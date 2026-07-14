import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingSpinner],
  templateUrl: './seller-layout.html',
  styleUrl: './seller-layout.scss'
})
export class SellerLayout {
  authService = inject(AuthService);
  get user() { return this.authService.currentUser(); }
  logout() { this.authService.logout(); }
}
