import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, StarRating],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input() product!: Product;
  @Input() showActions = true;

  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  get discountedPrice(): number {
    return this.product.price * (1 - this.product.discountPercentage / 100);
  }

  get isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  get isInCart(): boolean {
    return this.cartService.isInCart(this.product.id);
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const user = this.authService.currentUser();
    if (!user) { this.toastr.warning('Please login to add items to cart', 'Login Required'); return; }
    this.cartService.addToCart(user.id, this.product.id).subscribe({
      next: () => this.toastr.success(`${this.product.title} added to cart!`, 'Cart Updated'),
      error: () => {}
    });
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const user = this.authService.currentUser();
    if (!user) { this.toastr.warning('Please login to save items', 'Login Required'); return; }
    const wishItem = this.wishlistService.getWishlistItem(this.product.id);
    if (wishItem) {
      this.wishlistService.removeFromWishlist(wishItem.id).subscribe({
        next: () => this.toastr.info('Removed from wishlist', 'Wishlist'),
        error: () => {}
      });
    } else {
      this.wishlistService.addToWishlist(user.id, this.product.id).subscribe({
        next: () => this.toastr.success('Added to wishlist!', 'Wishlist'),
        error: () => {}
      });
    }
  }
}
