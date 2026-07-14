import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../models/product.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProducts implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  showModal = signal(false);
  showDeleteModal = signal(false);

  editingProduct = signal<Product | null>(null);
  deletingProduct = signal<Product | null>(null);

  searchQuery = signal('');
  categoryFilter = signal<string>('all');

  productForm!: FormGroup;

  filteredProducts = computed(() => {
    let list = [...this.products()];
    const query = this.searchQuery().toLowerCase();
    const cat = this.categoryFilter();

    if (query) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      );
    }

    if (cat !== 'all') {
      list = list.filter(p => p.category === cat);
    }

    return list;
  });

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: ['', Validators.required],
      category: [''],
      price: ['', [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      brand: ['', Validators.required],
      thumbnail: ['', Validators.required],
      images: ['']
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    let loaded = 0;
    const checkDone = () => { if (++loaded === 2) this.isLoading.set(false); };

    this.productService.getProducts().subscribe({
      next: (prods) => { this.products.set(prods); checkDone(); },
      error: () => { this.toastr.error('Failed to load products'); checkDone(); }
    });

    this.categoryService.getCategories().subscribe({
      next: (cats) => { this.categories.set(cats); checkDone(); },
      error: () => { this.toastr.error('Failed to load categories'); checkDone(); }
    });
  }

  onCategoryChange(event: Event): void {
    const catId = Number((event.target as HTMLSelectElement).value);
    const cat = this.categories().find(c => c.id === catId);
    if (cat) {
      this.productForm.patchValue({ category: cat.name });
    }
  }

  openAddModal(): void {
    this.editingProduct.set(null);
    this.productForm.reset({ discountPercentage: 0, stock: 0 });
    this.showModal.set(true);
  }

  openEditModal(product: Product): void {
    this.editingProduct.set(product);
    this.productForm.patchValue({
      title: product.title,
      description: product.description,
      categoryId: product.categoryId,
      category: product.category,
      price: product.price,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      brand: product.brand,
      thumbnail: product.thumbnail,
      images: product.images?.join(', ') ?? ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
    this.productForm.reset({ discountPercentage: 0, stock: 0 });
  }

  openDeleteModal(product: Product): void {
    this.deletingProduct.set(product);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingProduct.set(null);
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toastr.warning('Please correct form errors.', 'Validation Error');
      return;
    }

    const formVal = this.productForm.value;
    const imagesArray = formVal.images
      ? formVal.images.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      : [];

    const productData = {
      title: formVal.title,
      description: formVal.description,
      category: formVal.category,
      categoryId: Number(formVal.categoryId),
      price: Number(formVal.price),
      discountPercentage: Number(formVal.discountPercentage || 0),
      stock: Number(formVal.stock),
      brand: formVal.brand,
      thumbnail: formVal.thumbnail,
      images: imagesArray.length > 0 ? imagesArray : [formVal.thumbnail],
      sellerId: 1, 
      rating: this.editingProduct()?.rating ?? 4.5,
      tags: this.editingProduct()?.tags ?? [],
      availabilityStatus: Number(formVal.stock) > 0 ? 'In Stock' : 'Out of Stock',
      isFeatured: this.editingProduct()?.isFeatured ?? false,
      createdAt: this.editingProduct()?.createdAt ?? new Date().toISOString()
    };

    this.isSubmitting.set(true);

    if (this.editingProduct()) {
      this.productService.updateProduct(this.editingProduct()!.id, productData).subscribe({
        next: (updated) => {
          this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Product updated successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to update product.', 'Error');
        }
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: (created) => {
          this.products.update(list => [created, ...list]);
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Product created successfully.', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to create product.', 'Error');
        }
      });
    }
  }

  confirmDelete(): void {
    const product = this.deletingProduct();
    if (!product) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== product.id));
        this.closeDeleteModal();
        this.toastr.success('Product deleted successfully.', 'Success');
      },
      error: () => {
        this.toastr.error('Failed to delete product.', 'Error');
      }
    });
  }

  getStockBadgeClass(stock: number): string {
    if (stock === 0) return 'status-badge status-cancelled';
    if (stock < 10) return 'status-badge status-pending';
    return 'status-badge status-approved';
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.productForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
