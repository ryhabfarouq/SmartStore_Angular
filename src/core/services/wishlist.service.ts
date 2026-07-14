import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Wishlist } from '../../models/wishlist.model';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wishlist`;

  private _wishlist = signal<Wishlist[]>([]);
  wishlist = this._wishlist.asReadonly();

  loadWishlist(userId: number): Observable<Wishlist[]> {
    return this.http
      .get<Wishlist[]>(`${this.apiUrl}?userId=${userId}`)
      .pipe(tap((items) => this._wishlist.set(items)));
  }

  addToWishlist(userId: number, productId: number): Observable<Wishlist> {
    const item: Omit<Wishlist, 'id'> = { userId, productId, addedAt: new Date().toISOString() };
    return this.http
      .post<Wishlist>(this.apiUrl, item)
      .pipe(tap((newItem) => this._wishlist.update((items) => [...items, newItem])));
  }

  removeFromWishlist(wishlistItemId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${wishlistItemId}`)
      .pipe(
        tap(() => this._wishlist.update((items) => items.filter((i) => i.id !== wishlistItemId))),
      );
  }

  isInWishlist(productId: number): boolean {
    return this._wishlist().some((i) => i.productId === productId);
  }

  getWishlistItem(productId: number): Wishlist | undefined {
    return this._wishlist().find((i) => i.productId === productId);
  }
}
