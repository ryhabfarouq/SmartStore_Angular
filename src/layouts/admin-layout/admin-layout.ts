import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingSpinner],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  authService = inject(AuthService);
  sidebarCollapsed = false;

  user = this.authService.currentUser;
  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
  logout() { this.authService.logout(); }
}
