import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SellerService } from '../../../core/services/seller.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastrService } from 'ngx-toastr';
import { Product } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { Seller } from '../../../models/seller.model';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class SellerProducts implements OnInit {
  private authService = inject(AuthService);
  private sellerService = inject(SellerService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  sellerProfile = signal<Seller | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showModal = signal(false);
  showDeleteModal = signal(false);
  editingProduct = signal<Product | null>(null);
  deletingProduct = signal<Product | null>(null);
  searchQuery = signal('');
  sortBy = signal('newest');

  productForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadSellerProfile();
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

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.toastr.error('Failed to load categories.', 'Error')
    });
  }

  private loadSellerProfile(): void {
    const user = this.currentUser();
    if (!user) return;

    this.sellerService.getSellerByUserId(user.id).subscribe({
      next: (sellers) => {
        if (sellers && sellers.length > 0) {
          this.sellerProfile.set(sellers[0]);
          this.loadProducts(sellers[0].id);
        } else {
          this.isLoading.set(false);
          this.toastr.warning('No seller profile found.', 'Warning');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load seller profile.', 'Error');
      }
    });
  }

  private loadProducts(sellerId: number): void {
    this.productService.getProducts({ sellerId }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load products.', 'Error');
      }
    });
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery.set(val);
    this.applyFilters();
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.sortBy.set(val);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.products()];
    const query = this.searchQuery();
    if (query) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }
    switch (this.sortBy()) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'stock': result.sort((a, b) => a.stock - b.stock); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    this.filteredProducts.set(result);
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

  onCategoryChange(event: Event): void {
    const catId = Number((event.target as HTMLSelectElement).value);
    const cat = this.categories().find(c => c.id === catId);
    if (cat) {
      this.productForm.patchValue({ category: cat.name });
    }
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Validation Error');
      return;
    }

    const seller = this.sellerProfile();
    if (!seller) {
      this.toastr.error('Seller profile not found.', 'Error');
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
      sellerId: seller.id,
      rating: 0,
      tags: [],
      availabilityStatus: Number(formVal.stock) > 0 ? 'In Stock' : 'Out of Stock',
      isFeatured: false,
      createdAt: new Date().toISOString()
    };

    this.isSubmitting.set(true);

    if (this.editingProduct()) {
      this.productService.updateProduct(this.editingProduct()!.id, productData).subscribe({
        next: (updated) => {
          this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.applyFilters();
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Product updated successfully!', 'Success');
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
          this.applyFilters();
          this.isSubmitting.set(false);
          this.closeModal();
          this.toastr.success('Product added successfully!', 'Success');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastr.error('Failed to add product.', 'Error');
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
        this.applyFilters();
        this.closeDeleteModal();
        this.toastr.success('Product deleted successfully!', 'Success');
      },
      error: () => {
        this.toastr.error('Failed to delete product.', 'Error');
      }
    });
  }

  getStockBadge(stock: number): string {
    if (stock === 0) return 'status-badge status-cancelled';
    if (stock < 10) return 'status-badge status-pending';
    return 'status-badge status-approved';
  }

  getStockLabel(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.productForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
