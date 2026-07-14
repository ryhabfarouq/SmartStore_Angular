import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Review } from '../../models/seller.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;

  getProductReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}?productId=${productId}`);
  }

  addReview(review: Omit<Review, 'id' | 'createdAt'>): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, { ...review, createdAt: new Date().toISOString() });
  }
}
