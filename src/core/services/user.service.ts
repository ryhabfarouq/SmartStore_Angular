import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserStatus } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  updateUserStatus(id: number, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, { status });
  }

  softDeleteUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, { status: 'deleted' });
  }
}
