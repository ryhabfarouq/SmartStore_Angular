import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  registerForm!: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  selectedRole = signal<'customer' | 'seller'>('customer');

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-().]{7,20}$/)]],
      role: ['customer', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  get nameControl() { return this.registerForm.get('name'); }
  get emailControl() { return this.registerForm.get('email'); }
  get phoneControl() { return this.registerForm.get('phone'); }
  get roleControl() { return this.registerForm.get('role'); }
  get passwordControl() { return this.registerForm.get('password'); }
  get confirmPasswordControl() { return this.registerForm.get('confirmPassword'); }
  get passwordMismatch() {
    return this.registerForm.errors?.['passwordMismatch'] &&
           this.confirmPasswordControl?.touched;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  selectRole(role: 'customer' | 'seller'): void {
    this.selectedRole.set(role);
    this.registerForm.patchValue({ role });
  }

  getPasswordStrength(): { level: number; label: string; colorClass: string } {
    const pwd = this.passwordControl?.value || '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', colorClass: 'strength-weak' };
    if (score === 2) return { level: 2, label: 'Fair', colorClass: 'strength-fair' };
    if (score === 3) return { level: 3, label: 'Good', colorClass: 'strength-good' };
    return { level: 4, label: 'Strong', colorClass: 'strength-strong' };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastr.warning('Please fix the errors in the form before submitting.', 'Validation Error');
      return;
    }

    this.isLoading.set(true);
    const { name, email, phone, role, password } = this.registerForm.value;

    this.authService.register({ name, email, phone, role, password }).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.toastr.success(`Account created successfully! Welcome to ShopWave, ${user.name}!`, 'Registration Complete');
        this.router.navigate(['/auth/confirm']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastr.error(err.message || 'Registration failed. Please try again.', 'Registration Failed');
      }
    });
  }
}
