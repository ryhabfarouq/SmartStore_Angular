import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-email-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-confirm.html',
  styleUrl: './email-confirm.scss',
})
export class EmailConfirm implements OnInit {
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);

  resending = signal(false);
  currentUser = this.authService.currentUser;

  ngOnInit(): void {

    setTimeout(() => {
      const icon = document.querySelector('.confirm-icon');
      icon?.classList.add('animate-in');
    }, 100);
  }

  onResendEmail(): void {
    this.resending.set(true);

    setTimeout(() => {
      this.resending.set(false);
      this.toastr.info(
        'A new confirmation email has been sent to your inbox. Please check your spam folder too.',
        'Email Sent!',
        { timeOut: 5000, progressBar: true },
      );
    }, 1500);
  }

  continueShopping(): void {
    this.router.navigate(['/home']);
  }
}
