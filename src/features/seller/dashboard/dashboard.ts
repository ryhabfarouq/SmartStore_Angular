import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SellerService } from '../../../core/services/seller.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastrService } from 'ngx-toastr';
import { Seller } from '../../../models/seller.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class SellerDashboard implements OnInit {
  private authService = inject(AuthService);
  private sellerService = inject(SellerService);
  private productService = inject(ProductService);
  private toastr = inject(ToastrService);

  currentUser = this.authService.currentUser;

  sellerProfile = signal<Seller | null>(null);
  recentProducts = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  isLoading = signal(true);

  totalProducts = computed(() => this.allProducts().length);
  totalSales = computed(() => this.sellerProfile()?.totalSales ?? 0);
  sellerRating = computed(() => this.sellerProfile()?.rating ?? 0);
  storeStatus = computed(() => this.sellerProfile()?.status ?? 'pending');

  ratingStars = computed(() => {
    const rating = this.sellerRating();
    return Array.from({ length: 5 }, (_, i) => ({
      full: i < Math.floor(rating),
      half: i === Math.floor(rating) && rating % 1 >= 0.5,
      empty: i >= Math.ceil(rating)
    }));
  });

  ngOnInit(): void {
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
        this.allProducts.set(products);
        this.recentProducts.set(products.slice(0, 5));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load products.', 'Error');
      }
    });
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'text-danger';
    if (stock < 10) return 'text-warning';
    return 'text-success';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      approved: 'status-approved',
      pending: 'status-pending',
      suspended: 'status-cancelled',
      rejected: 'status-cancelled'
    };
    return `status-badge ${map[status] || 'status-pending'}`;
  }
}
