import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { Product } from '../../../models/product.model';
import { Review } from '../../../models/seller.model';
import { StarRating } from '../../../shared/components/star-rating/star-rating';
import { ProductCard } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, StarRating, ProductCard],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private toastr = inject(ToastrService);

  currentUser = this.authService.currentUser;

  product = signal<Product | null>(null);
  reviews = signal<Review[]>([]);
  relatedProducts = signal<Product[]>([]);
  isLoading = signal(true);

  selectedImage = signal('');
  quantity = signal(1);
  activeTab = signal<'description' | 'reviews'>('description');

  newRating = signal(5);
  newComment = signal('');
  isSubmittingReview = signal(false);

  discountedPrice = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    return prod.price * (1 - prod.discountPercentage / 100);
  });

  get isInWishlist(): boolean {
    const prod = this.product();
    return prod ? this.wishlistService.isInWishlist(prod.id) : false;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadProductData(id);
      }
    });
  }

  loadProductData(id: number): void {
    this.isLoading.set(true);
    this.quantity.set(1);

    forkJoin({
      product: this.productService.getProductById(id),
      reviews: this.reviewService.getProductReviews(id)
    }).subscribe({
      next: ({ product, reviews }) => {
        this.product.set(product);
        this.reviews.set(reviews);
        if (product.images && product.images.length > 0) {
          this.selectedImage.set(product.images[0]);
        } else {
          this.selectedImage.set(product.thumbnail);
        }
        this.loadRelatedProducts(product);
      },
      error: () => {
        this.toastr.error('Failed to load product details.', 'Error');
        this.router.navigate(['/products']);
        this.isLoading.set(false);
      }
    });
  }

  loadRelatedProducts(prod: Product): void {
    this.productService.getProducts({ categoryId: prod.categoryId }).subscribe({
      next: (list) => {
        const filtered = list.filter(p => p.id !== prod.id).slice(0, 4);
        this.relatedProducts.set(filtered);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  selectImage(imgUrl: string): void {
    this.selectedImage.set(imgUrl);
  }

  incrementQty(): void {
    const maxStock = this.product()?.stock ?? 0;
    if (this.quantity() < maxStock) {
      this.quantity.update(q => q + 1);
    } else {
      this.toastr.warning('Cannot exceed available stock.', 'Warning');
    }
  }

  decrementQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    const user = this.currentUser();
    const prod = this.product();
    if (!user) {
      this.toastr.warning('Please log in to add items to your cart.', 'Login Required');
      return;
    }
    if (!prod) return;

    this.cartService.addToCart(user.id, prod.id, this.quantity()).subscribe({
      next: () => {
        this.toastr.success(`${prod.title} added to cart!`, 'Success');
      },
      error: () => {}
    });
  }

  toggleWishlist(): void {
    const user = this.currentUser();
    const prod = this.product();
    if (!user) {
      this.toastr.warning('Please log in to manage your wishlist.', 'Login Required');
      return;
    }
    if (!prod) return;

    const wishItem = this.wishlistService.getWishlistItem(prod.id);
    if (wishItem) {
      this.wishlistService.removeFromWishlist(wishItem.id).subscribe({
        next: () => this.toastr.info('Removed from wishlist.', 'Wishlist'),
        error: () => {}
      });
    } else {
      this.wishlistService.addToWishlist(user.id, prod.id).subscribe({
        next: () => this.toastr.success('Added to wishlist!', 'Wishlist'),
        error: () => {}
      });
    }
  }

  selectRating(rating: number): void {
    this.newRating.set(rating);
  }

  submitReview(): void {
    const user = this.currentUser();
    const prod = this.product();
    if (!user) {
      this.toastr.warning('Please log in to submit a review.', 'Login Required');
      return;
    }
    if (!prod) return;

    if (!this.newComment().trim()) {
      this.toastr.warning('Please enter a comment for your review.', 'Validation Warning');
      return;
    }

    this.isSubmittingReview.set(true);
    const reviewData = {
      productId: prod.id,
      userId: user.id,
      userName: user.name,
      rating: this.newRating(),
      comment: this.newComment().trim()
    };

    this.reviewService.addReview(reviewData).subscribe({
      next: (newReview) => {
        this.reviews.update(list => [...list, newReview]);
        this.toastr.success('Thank you for your feedback!', 'Review Submitted');
        this.newComment.set('');
        this.newRating.set(5);
        this.isSubmittingReview.set(false);
      },
      error: () => {
        this.toastr.error('Failed to submit review.', 'Error');
        this.isSubmittingReview.set(false);
      }
    });
  }
}
