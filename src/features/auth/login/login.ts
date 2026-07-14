import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  loginForm!: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirectByRole(this.authService.currentUser()!.role);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }
  get passwordControl() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(`Welcome back, ${user.name}!`, 'Login Successful');
        this.redirectByRole(user.role);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastr.error(
          err.message || 'Invalid email or password. Please try again.',
          'Login Failed',
        );
      },
    });
  }

  private redirectByRole(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'seller':
        this.router.navigate(['/seller/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
