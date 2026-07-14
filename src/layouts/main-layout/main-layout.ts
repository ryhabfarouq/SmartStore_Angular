import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, LoadingSpinner],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.cartService.loadCart(user.id).subscribe();
      this.wishlistService.loadWishlist(user.id).subscribe();
    }
  }
}
