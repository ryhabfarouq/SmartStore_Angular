import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Seller } from '../../models/seller.model';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sellers`;

  getAllSellers(): Observable<Seller[]> {
    return this.http.get<Seller[]>(this.apiUrl);
  }

  getSellerById(id: number): Observable<Seller> {
    return this.http.get<Seller>(`${this.apiUrl}/${id}`);
  }

  getSellerByUserId(userId: number): Observable<Seller[]> {
    return this.http.get<Seller[]>(`${this.apiUrl}?userId=${userId}`);
  }

  updateSeller(id: number, data: Partial<Seller>): Observable<Seller> {
    return this.http.patch<Seller>(`${this.apiUrl}/${id}`, data);
  }

  updateSellerStatus(id: number, status: Seller['status']): Observable<Seller> {
    return this.http.patch<Seller>(`${this.apiUrl}/${id}`, { status });
  }

  createSeller(seller: Omit<Seller, 'id'>): Observable<Seller> {
    return this.http.post<Seller>(this.apiUrl, seller);
  }
}
