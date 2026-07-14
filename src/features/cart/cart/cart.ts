import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartItem } from '../../../models/cart.model';
import { Product } from '../../../models/product.model';

export interface CartItemWithProduct extends CartItem {
  product?: Product;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  cartItems = this.cartService.cartItems;
  cartItemsWithProducts = signal<CartItemWithProduct[]>([]);
  products = signal<Product[]>([]);
  isLoading = signal(true);
  updatingItems = signal<Set<number>>(new Set());

  subtotal = computed(() => {
    return this.cartItemsWithProducts().reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);
  });

  discount = computed(() => {
    return this.cartItemsWithProducts().reduce((sum, item) => {
      const p = item.product;
      if (!p) return sum;
      const original = p.price * item.quantity;
      const disc = (original * p.discountPercentage) / 100;
      return sum + disc;
    }, 0);
  });

  afterDiscount = computed(() => this.subtotal() - this.discount());

  shipping = computed(() => (this.afterDiscount() > 100 ? 0 : 9.99));

  tax = computed(() => this.afterDiscount() * 0.09);

  total = computed(
    () => this.afterDiscount() + this.shipping() + this.tax()
  );

  isEmpty = computed(() => this.cartItemsWithProducts().length === 0);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.cartService.loadCart(user.id).subscribe({
        next: () => this.loadProductDetails(),
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Failed to load cart', 'Error');
        },
      });
    } else {
      this.loadProductDetails();
    }
  }

  private loadProductDetails(): void {
    const items = this.cartItems();
    if (!items.length) {
      this.cartItemsWithProducts.set([]);
      this.isLoading.set(false);
      return;
    }

    const productRequests = items.map((item) =>
      this.productService.getProductById(item.productId)
    );

    forkJoin(productRequests).subscribe({
      next: (fetchedProducts) => {
        const itemsWithProducts: CartItemWithProduct[] = items.map(
          (item, index) => ({
            ...item,
            product: fetchedProducts[index],
          })
        );
        this.cartItemsWithProducts.set(itemsWithProducts);
        this.products.set(fetchedProducts);
        this.isLoading.set(false);
      },
      error: () => {
        this.cartItemsWithProducts.set(items.map((i) => ({ ...i } as CartItemWithProduct)));
        this.isLoading.set(false);
        this.toastr.error('Failed to load product details', 'Error');
      },
    });
  }

  incrementQuantity(item: CartItemWithProduct): void {
    const maxStock = item.product?.stock ?? 99;
    if (item.quantity >= maxStock) {
      this.toastr.warning(
        `Only ${maxStock} items available in stock`,
        'Stock Limit'
      );
      return;
    }
    this.setUpdating(item.id, true);
    this.cartService.updateQuantity(item.id, item.quantity + 1).subscribe({
      next: () => {
        this.refreshCartItems();
        this.setUpdating(item.id, false);
      },
      error: () => {
        this.setUpdating(item.id, false);
        this.toastr.error('Failed to update quantity', 'Error');
      },
    });
  }

  decrementQuantity(item: CartItemWithProduct): void {
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }
    this.setUpdating(item.id, true);
    this.cartService.updateQuantity(item.id, item.quantity - 1).subscribe({
      next: () => {
        this.refreshCartItems();
        this.setUpdating(item.id, false);
      },
      error: () => {
        this.setUpdating(item.id, false);
        this.toastr.error('Failed to update quantity', 'Error');
      },
    });
  }

  removeItem(item: CartItemWithProduct): void {
    this.setUpdating(item.id, true);
    this.cartService.removeFromCart(item.id).subscribe({
      next: () => {
        this.cartItemsWithProducts.update((items) =>
          items.filter((i) => i.id !== item.id)
        );
        this.setUpdating(item.id, false);
        this.toastr.info(
          `${item.product?.title ?? 'Item'} removed from cart`,
          'Removed'
        );
      },
      error: () => {
        this.setUpdating(item.id, false);
        this.toastr.error('Failed to remove item', 'Error');
      },
    });
  }

  private refreshCartItems(): void {
    const currentItems = this.cartItems();
    const currentWithProducts = this.cartItemsWithProducts();
    const updated = currentItems.map((item) => {
      const existing = currentWithProducts.find((i) => i.id === item.id);
      return { ...item, product: existing?.product };
    });
    this.cartItemsWithProducts.set(updated);
  }

  private setUpdating(id: number, state: boolean): void {
    this.updatingItems.update((set) => {
      const newSet = new Set(set);
      if (state) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  }

  isUpdating(id: number): boolean {
    return this.updatingItems().has(id);
  }

  getLineTotal(item: CartItemWithProduct): number {
    return (item.product?.price ?? 0) * item.quantity;
  }

  getDiscountedPrice(item: CartItemWithProduct): number {
    if (!item.product) return 0;
    const price = item.product.price;
    const disc = (price * item.product.discountPercentage) / 100;
    return price - disc;
  }

  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Please login to proceed to checkout', 'Login Required');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
