import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Wishlist as WishlistItem } from '../../../models/wishlist.model';
import { Product } from '../../../models/product.model';

export interface WishlistItemWithProduct extends WishlistItem {
  product?: Product;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class Wishlist implements OnInit {
  private wishlistService = inject(WishlistService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  wishlist = this.wishlistService.wishlist;
  wishlistWithProducts = signal<WishlistItemWithProduct[]>([]);
  isLoading = signal(true);
  isActionLoading = signal<number | null>(null);

  isEmpty = computed(() => this.wishlistWithProducts().length === 0);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.wishlistService.loadWishlist(user.id).subscribe({
        next: () => this.loadProductDetails(),
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Failed to load wishlist.', 'Error');
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  private loadProductDetails(): void {
    const items = this.wishlist();
    if (!items.length) {
      this.wishlistWithProducts.set([]);
      this.isLoading.set(false);
      return;
    }

    const requests = items.map((item) => this.productService.getProductById(item.productId));

    forkJoin(requests).subscribe({
      next: (products) => {
        const mapped = items.map((item, index) => ({
          ...item,
          product: products[index],
        }));
        this.wishlistWithProducts.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.wishlistWithProducts.set(
          items.map((item) => ({ ...item }) as WishlistItemWithProduct),
        );
        this.isLoading.set(false);
        this.toastr.error('Failed to load some product details.', 'Error');
      },
    });
  }

  removeItem(item: WishlistItemWithProduct): void {
    this.isActionLoading.set(item.id);
    this.wishlistService.removeFromWishlist(item.id).subscribe({
      next: () => {
        this.wishlistWithProducts.update((list) => list.filter((i) => i.id !== item.id));
        this.isActionLoading.set(null);
        this.toastr.info(
          `${item.product?.title ?? 'Product'} removed from wishlist.`,
          'Wishlist Updated',
        );
      },
      error: () => {
        this.isActionLoading.set(null);
        this.toastr.error('Failed to remove item.', 'Error');
      },
    });
  }

  moveToCart(item: WishlistItemWithProduct): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!item.product || item.product.stock === 0) {
      this.toastr.warning('This item is currently out of stock.', 'Out of Stock');
      return;
    }

    this.isActionLoading.set(item.id);

    this.cartService.addToCart(user.id, item.productId, 1).subscribe({
      next: () => {
        this.wishlistService.removeFromWishlist(item.id).subscribe({
          next: () => {
            this.wishlistWithProducts.update((list) => list.filter((i) => i.id !== item.id));
            this.isActionLoading.set(null);
            this.toastr.success(`${item.product?.title} moved to cart!`, 'Cart Updated');
          },
          error: () => {
            this.isActionLoading.set(null);
            this.toastr.warning(
              `${item.product?.title} added to cart, but failed to remove from wishlist.`,
              'Partial Success',
            );
          },
        });
      },
      error: () => {
        this.isActionLoading.set(null);
        this.toastr.error('Failed to add item to cart.', 'Error');
      },
    });
  }

  getDiscountedPrice(product: Product): number {
    return product.price * (1 - product.discountPercentage / 100);
  }
}
