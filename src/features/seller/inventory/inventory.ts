import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth.service';
import { SellerService } from '../../../core/services/seller.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../models/product.model';
import { Seller } from '../../../models/seller.model';

@Component({
  selector: 'app-seller-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class SellerInventory implements OnInit {
  private authService = inject(AuthService);
  private sellerService = inject(SellerService);
  private productService = inject(ProductService);
  private toastr = inject(ToastrService);

  currentUser = this.authService.currentUser;

  products = signal<Product[]>([]);
  sellerProfile = signal<Seller | null>(null);
  isLoading = signal(true);
  isSubmittingId = signal<number | null>(null);

  searchQuery = signal('');
  stockFilter = signal<'all' | 'low' | 'out'>('all');

  stockUpdates = signal<Record<number, number>>({});

  filteredProducts = computed(() => {
    let list = [...this.products()];
    const query = this.searchQuery().toLowerCase();
    const filter = this.stockFilter();

    if (query) {
      list = list.filter(p => p.title.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
    }

    if (filter === 'low') {
      list = list.filter(p => p.stock > 0 && p.stock < 10);
    } else if (filter === 'out') {
      list = list.filter(p => p.stock === 0);
    }

    return list;
  });

  ngOnInit(): void {
    this.loadSellerProfile();
  }

  private loadSellerProfile(): void {
    const user = this.currentUser();
    if (!user) return;

    this.sellerService.getSellerByUserId(user.id).subscribe({
      next: (sellers) => {
        if (sellers && sellers.length > 0) {
          this.sellerProfile.set(sellers[0]);
          this.loadProducts(sellers[0].id);
        } else {
          this.isLoading.set(false);
          this.toastr.warning('No seller profile found.', 'Warning');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load seller profile.', 'Error');
      }
    });
  }

  private loadProducts(sellerId: number): void {
    this.productService.getProducts({ sellerId }).subscribe({
      next: (products) => {
        this.products.set(products);
        const updates: Record<number, number> = {};
        products.forEach(p => {
          updates[p.id] = p.stock;
        });
        this.stockUpdates.set(updates);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load products inventory.', 'Error');
      }
    });
  }

  onStockChange(productId: number, val: number): void {
    if (val < 0) return;
    this.stockUpdates.update(map => ({
      ...map,
      [productId]: val
    }));
  }

  adjustStock(productId: number, diff: number): void {
    const current = this.stockUpdates()[productId] ?? 0;
    const newVal = current + diff;
    if (newVal >= 0) {
      this.onStockChange(productId, newVal);
    }
  }

  saveStock(product: Product): void {
    const newStock = this.stockUpdates()[product.id];
    if (newStock === undefined || newStock < 0) return;

    this.isSubmittingId.set(product.id);
    const availabilityStatus = newStock > 0 ? 'In Stock' : 'Out of Stock';

    this.productService.updateProduct(product.id, { stock: newStock, availabilityStatus }).subscribe({
      next: (updated) => {
        this.products.update(list => list.map(p => p.id === product.id ? updated : p));
        this.toastr.success(`Inventory for ${product.title} updated to ${newStock}.`, 'Stock Saved');
        this.isSubmittingId.set(null);
      },
      error: () => {
        this.toastr.error('Failed to update stock level.', 'Error');
        this.isSubmittingId.set(null);
      }
    });
  }

  getStockBadgeClass(stock: number): string {
    if (stock === 0) return 'status-badge status-cancelled';
    if (stock < 10) return 'status-badge status-pending';
    return 'status-badge status-approved';
  }

  getStockLabel(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'Good Stock';
  }
}
