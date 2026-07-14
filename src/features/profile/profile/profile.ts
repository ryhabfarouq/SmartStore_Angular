import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  currentUser = this.authService.currentUser;
  activeTab = signal<'profile' | 'security'>('profile');
  isSubmittingProfile = signal(false);
  isSubmittingSecurity = signal(false);

  profileForm!: FormGroup;
  securityForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.fillProfileForm();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required]
    }, {
      validators: this.passwordsMatchValidator
    });
  }

  private passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmNewPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  private fillProfileForm(): void {
    const user = this.currentUser();
    if (!user) return;

    this.profileForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zip: user.address?.zip || '',
      country: user.address?.country || ''
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastr.warning('Please correct all validation errors.', 'Validation Warning');
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isSubmittingProfile.set(true);
    const formVal = this.profileForm.value;

    const updatedData: Partial<User> = {
      name: formVal.name,
      phone: formVal.phone,
      address: {
        street: formVal.street,
        city: formVal.city,
        state: formVal.state,
        zip: formVal.zip,
        country: formVal.country
      }
    };

    this.userService.updateUser(user.id, updatedData).subscribe({
      next: (updatedUser) => {
        this.authService.updateCurrentUser(updatedUser);
        this.toastr.success('Profile details updated successfully!', 'Success');
        this.isSubmittingProfile.set(false);
      },
      error: () => {
        this.toastr.error('Failed to update profile details.', 'Error');
        this.isSubmittingProfile.set(false);
      }
    });
  }

  saveSecurity(): void {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      if (this.securityForm.errors?.['mismatch']) {
        this.toastr.warning('Passwords do not match.', 'Validation Warning');
      } else {
        this.toastr.warning('Please satisfy password criteria.', 'Validation Warning');
      }
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    const { currentPassword, newPassword } = this.securityForm.value;

    if (user.password !== currentPassword) {
      this.toastr.error('The current password you entered is incorrect.', 'Authentication Error');
      return;
    }

    this.isSubmittingSecurity.set(true);

    this.userService.updateUser(user.id, { password: newPassword }).subscribe({
      next: (updatedUser) => {
        this.authService.updateCurrentUser(updatedUser);
        this.toastr.success('Password updated successfully!', 'Success');
        this.securityForm.reset();
        this.isSubmittingSecurity.set(false);
      },
      error: () => {
        this.toastr.error('Failed to update password.', 'Error');
        this.isSubmittingSecurity.set(false);
      }
    });
  }

  changeAvatarMock(): void {
    this.toastr.info('Avatar editing is simulated.', 'Mock Feature');
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
