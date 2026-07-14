import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  searchQuery = signal('');
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  get user() { return this.authService.currentUser(); }
  get cartCount() { return this.cartService.cartCount(); }

  search(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: query } });
      this.searchQuery.set('');
    }
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }
}
