import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductFilter } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProducts(filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();
    if (filter?.categoryId) params = params.set('categoryId', filter.categoryId);
    if (filter?.sellerId) params = params.set('sellerId', filter.sellerId);
    if (filter?.search) params = params.set('title_like', filter.search);
    if (filter?.inStock) params = params.set('availabilityStatus', 'In Stock');
    if (filter?.page) params = params.set('_page', filter.page);
    if (filter?.limit) params = params.set('_limit', filter.limit);
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?isFeatured=true`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?title_like=${query}`);
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, {
      ...product,
      createdAt: new Date().toISOString(),
    });
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
