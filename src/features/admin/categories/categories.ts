import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class AdminCategories implements OnInit {
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  showModal = signal(false);
  showDeleteModal = signal(false);

  editingCategory = signal<Category | null>(null);
  deletingCategory = signal<Category | null>(null);

  searchQuery = signal('');
  categoryForm!: FormGroup;

  filteredCategories = computed(() => {
    let list = [...this.categories()];
    const query = this.searchQuery().toLowerCase();
    if (query) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query),
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      icon: ['fas fa-tags', Validators.required],
      color: ['#6c5ce7', Validators.required],
      image: ['', Validators.required],
    });
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load categories.', 'Error');
        this.isLoading.set(false);
      },
    });
  }

  openAddModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({ icon: 'fas fa-tags', color: '#6c5ce7' });
    this.showModal.set(true);
  }

  openEditModal(cat: Category): void {
    this.editingCategory.set(cat);
    this.categoryForm.patchValue({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      image: cat.image,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  openDeleteModal(cat: Category): void {
    this.deletingCategory.set(cat);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingCategory.set(null);
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.toastr.warning('Please resolve form validation errors.', 'Validation Error');
      return;
    }

    const formVal = this.categoryForm.value;
    const slug = formVal.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const catData: Omit<Category, 'id'> = {
      name: formVal.name,
      slug,
      icon: formVal.icon,
      color: formVal.color,
      image: formVal.image,
      productCount: this.editingCategory()?.productCount ?? 0,
    };

    this.isSubmitting.set(true);

    if (this.editingCategory()) {
      this.categoryService.updateCategory(this.editingCategory()!.id, catData).subscribe({
        next: (updated) => {
          this.categories.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Category updated successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to update category.', 'Error');
        },
      });
    } else {
      this.categoryService.createCategory(catData).subscribe({
        next: (created) => {
          this.categories.update((list) => [...list, created]);
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Category created successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to create category.', 'Error');
        },
      });
    }
  }

  confirmDelete(): void {
    const cat = this.deletingCategory();
    if (!cat) return;

    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== cat.id));
        this.closeDeleteModal();
        this.toastr.success('Category deleted successfully.', 'Success');
      },
      error: () => {
        this.toastr.error('Failed to delete category.', 'Error');
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.categoryForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
