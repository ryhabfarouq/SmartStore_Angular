import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private _currentUser = signal<User | null>(this.loadUserFromStorage());
  currentUser = this._currentUser.asReadonly();

  isLoggedIn = computed(() => !!this._currentUser());
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  isSeller = computed(() => this._currentUser()?.role === 'seller');
  isCustomer = computed(() => this._currentUser()?.role === 'customer');

  private loadUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem('SmartStore_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('SmartStore_token');
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.get<User[]>(`${this.apiUrl}/users?email=${credentials.email}`).pipe(
      map((users) => {
        const user = users.find(
          (u) =>
            u.password === credentials.password &&
            u.status !== 'deleted' &&
            u.status !== 'restricted',
        );
        if (!user) throw new Error('Invalid credentials or account restricted.');
        return user;
      }),
      tap((user) => {
        const token = `mock-jwt-${user.id}-${user.role}-${Date.now()}`;
        localStorage.setItem('SmartStore_token', token);
        localStorage.setItem('SmartStore_user', JSON.stringify(user));
        this._currentUser.set(user);
      }),
    );
  }

  register(data: RegisterRequest): Observable<User> {
    const newUser: Omit<User, 'id'> = {
      ...data,
      status: 'active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6c5ce7&color=fff`,
      address: { street: '', city: '', state: '', zip: '', country: '' },
      createdAt: new Date().toISOString(),
      emailVerified: false,
      wallet: 0,
    };
    return this.http.post<User>(`${this.apiUrl}/users`, newUser).pipe(
      tap((user) => {
        const token = `mock-jwt-${user.id}-${user.role}-${Date.now()}`;
        localStorage.setItem('SmartStore_token', token);
        localStorage.setItem('SmartStore_user', JSON.stringify(user));
        this._currentUser.set(user);
      }),
    );
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('SmartStore_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem('SmartStore_token');
    localStorage.removeItem('SmartStore_user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
