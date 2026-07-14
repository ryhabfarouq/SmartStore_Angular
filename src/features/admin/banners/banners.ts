import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { BannerService } from '../../../core/services/banner.service';
import { Banner } from '../../../models/seller.model';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './banners.html',
  styleUrl: './banners.scss'
})
export class AdminBanners implements OnInit {
  private bannerService = inject(BannerService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  banners = signal<Banner[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  showModal = signal(false);
  showDeleteModal = signal(false);

  editingBanner = signal<Banner | null>(null);
  deletingBanner = signal<Banner | null>(null);

  searchQuery = signal('');
  bannerForm!: FormGroup;

  sortedBanners = computed(() => {
    let list = [...this.banners()];
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      list = list.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.subtitle.toLowerCase().includes(query)
      );
    }

    return list.sort((a, b) => a.order - b.order);
  });

  ngOnInit(): void {
    this.initForm();
    this.loadBanners();
  }

  private initForm(): void {
    this.bannerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      subtitle: ['', Validators.required],
      ctaText: ['Shop Now', Validators.required],
      ctaLink: ['/products', Validators.required],
      image: ['', Validators.required],
      gradient: ['linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', Validators.required],
      isActive: [true],
      order: [1, [Validators.required, Validators.min(1)]]
    });
  }

  private loadBanners(): void {
    this.isLoading.set(true);
    this.bannerService.getAllBanners().subscribe({
      next: (data) => {
        this.banners.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load banners.', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  toggleActive(banner: Banner): void {
    const originalState = banner.isActive;
    const updatedState = !originalState;

    this.bannerService.updateBanner(banner.id, { isActive: updatedState }).subscribe({
      next: (updated) => {
        this.banners.update(list => list.map(b => b.id === banner.id ? updated : b));
        this.toastr.success(`Banner status updated to ${updatedState ? 'Active' : 'Inactive'}.`, 'Success');
      },
      error: () => {
        this.toastr.error('Failed to update banner status.', 'Error');
      }
    });
  }

  openAddModal(): void {
    this.editingBanner.set(null);
    const nextOrder = this.banners().length > 0
      ? Math.max(...this.banners().map(b => b.order)) + 1
      : 1;

    this.bannerForm.reset({
      ctaText: 'Shop Now',
      ctaLink: '/products',
      gradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
      isActive: true,
      order: nextOrder
    });
    this.showModal.set(true);
  }

  openEditModal(banner: Banner): void {
    this.editingBanner.set(banner);
    this.bannerForm.patchValue({
      title: banner.title,
      subtitle: banner.subtitle,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      image: banner.image,
      gradient: banner.gradient,
      isActive: banner.isActive,
      order: banner.order
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingBanner.set(null);
    this.bannerForm.reset();
  }

  openDeleteModal(banner: Banner): void {
    this.deletingBanner.set(banner);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingBanner.set(null);
  }

  submitBanner(): void {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      this.toastr.warning('Please correct form errors.', 'Validation Error');
      return;
    }

    const formVal = this.bannerForm.value;
    const bannerData: Omit<Banner, 'id'> = {
      title: formVal.title,
      subtitle: formVal.subtitle,
      ctaText: formVal.ctaText,
      ctaLink: formVal.ctaLink,
      image: formVal.image,
      gradient: formVal.gradient,
      isActive: !!formVal.isActive,
      order: Number(formVal.order)
    };

    this.isSubmitting.set(true);

    if (this.editingBanner()) {
      this.bannerService.updateBanner(this.editingBanner()!.id, bannerData).subscribe({
        next: (updated) => {
          this.banners.update(list => list.map(b => b.id === updated.id ? updated : b));
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Banner updated successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to update banner.', 'Error');
        }
      });
    } else {
      this.bannerService.createBanner(bannerData).subscribe({
        next: (created) => {
          this.banners.update(list => [...list, created]);
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Banner created successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to create banner.', 'Error');
        }
      });
    }
  }

  confirmDelete(): void {
    const banner = this.deletingBanner();
    if (!banner) return;

    this.bannerService.deleteBanner(banner.id).subscribe({
      next: () => {
        this.banners.update(list => list.filter(b => b.id !== banner.id));
        this.closeDeleteModal();
        this.toastr.success('Banner deleted successfully.', 'Success');
      },
      error: () => {
        this.toastr.error('Failed to delete banner.', 'Error');
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.bannerForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
