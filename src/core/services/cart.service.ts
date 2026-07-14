import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, of, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem, CartSummary } from '../../models/cart.model';
import { Product } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cart`;
  private productsUrl = `${environment.apiUrl}/products`;

  private _cartItems = signal<CartItem[]>([]);
  cartItems = this._cartItems.asReadonly();

  cartCount = computed(() => this._cartItems().reduce((sum, i) => sum + i.quantity, 0));

  loadCart(userId: number): Observable<CartItem[]> {
    return this.http
      .get<CartItem[]>(`${this.apiUrl}?userId=${userId}`)
      .pipe(tap((items) => this._cartItems.set(items)));
  }

  addToCart(userId: number, productId: number, quantity = 1): Observable<CartItem> {
    const existing = this._cartItems().find((i) => i.productId === productId);
    if (existing) {
      return this.updateQuantity(existing.id, existing.quantity + quantity);
    }
    const item: Omit<CartItem, 'id'> = {
      userId,
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    };
    return this.http
      .post<CartItem>(this.apiUrl, item)
      .pipe(tap((newItem) => this._cartItems.update((items) => [...items, newItem])));
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<CartItem> {
    return this.http
      .patch<CartItem>(`${this.apiUrl}/${cartItemId}`, { quantity })
      .pipe(
        tap((updated) =>
          this._cartItems.update((items) => items.map((i) => (i.id === cartItemId ? updated : i))),
        ),
      );
  }

  removeFromCart(cartItemId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${cartItemId}`)
      .pipe(tap(() => this._cartItems.update((items) => items.filter((i) => i.id !== cartItemId))));
  }

  clearCart(userId: number): Observable<void> {
    const items = this._cartItems();
    const deletes = items.map((i) => this.http.delete<void>(`${this.apiUrl}/${i.id}`));
    return forkJoin(deletes.length ? deletes : [of(null)]).pipe(
      tap(() => this._cartItems.set([])),
      map(() => undefined),
    );
  }

  isInCart(productId: number): boolean {
    return this._cartItems().some((i) => i.productId === productId);
  }

  getCartSummary(products: Product[]): CartSummary {
    const items = this._cartItems();
    let subtotal = 0;
    let discount = 0;
    items.forEach((item) => {
      const p = products.find((p) => p.id === item.productId);
      if (p) {
        const originalPrice = p.price * item.quantity;
        const discountAmount = (originalPrice * p.discountPercentage) / 100;
        subtotal += originalPrice;
        discount += discountAmount;
      }
    });
    const afterDiscount = subtotal - discount;
    const shippingCost = afterDiscount > 100 ? 0 : 9.99;
    const tax = afterDiscount * 0.09;
    const total = afterDiscount + shippingCost + tax;
    return { items, subtotal, discount, shippingCost, tax, total, itemCount: this.cartCount() };
  }
}
