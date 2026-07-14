import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Banner } from '../../models/seller.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/banners`;

  getActiveBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.apiUrl}?isActive=true&_sort=order`);
  }

  getAllBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.apiUrl}?_sort=order`);
  }

  createBanner(banner: Omit<Banner, 'id'>): Observable<Banner> {
    return this.http.post<Banner>(this.apiUrl, banner);
  }

  updateBanner(id: number, data: Partial<Banner>): Observable<Banner> {
    return this.http.patch<Banner>(`${this.apiUrl}/${id}`, data);
  }

  deleteBanner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
