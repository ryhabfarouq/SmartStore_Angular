import {
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { BannerService } from '../../../core/services/banner.service';

import { Product } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { Banner } from '../../../models/seller.model';

import { ProductCard } from '../../../shared/components/product-card/product-card';
import { BannerSlider } from '../banner-slider/banner-slider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ProductCard,
    BannerSlider,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private bannerService = inject(BannerService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  banners = signal<Banner[]>([]);
  isLoading = signal(true);

  newsletterForm: FormGroup;

  stats = [
    { icon: 'fas fa-box', value: '10K+', label: 'Products', color: '#6c5ce7' },
    { icon: 'fas fa-users', value: '50K+', label: 'Happy Customers', color: '#00b894' },
    { icon: 'fas fa-th-large', value: '100+', label: 'Categories', color: '#fd79a8' },
    { icon: 'fas fa-star', value: '99%', label: 'Satisfaction', color: '#fdcb6e' },
  ];

  categoryIcons = [
    { icon: 'fas fa-laptop', color: '#6c5ce7' },
    { icon: 'fas fa-tshirt', color: '#fd79a8' },
    { icon: 'fas fa-couch', color: '#00b894' },
    { icon: 'fas fa-dumbbell', color: '#fdcb6e' },
    { icon: 'fas fa-gem', color: '#e17055' },
    { icon: 'fas fa-book', color: '#0984e3' },
    { icon: 'fas fa-utensils', color: '#00cec9' },
    { icon: 'fas fa-car', color: '#a29bfe' },
  ];

  constructor() {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      categories: this.categoryService.getCategories(),
      products: this.productService.getFeaturedProducts(),
      banners: this.bannerService.getActiveBanners(),
    }).subscribe({
      next: ({ categories, products, banners }) => {
        this.categories.set(categories);
        this.featuredProducts.set(products.slice(0, 8));
        this.banners.set(banners);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load page data', 'Error');
        this.isLoading.set(false);
      },
    });
  }

  navigateToCategory(categoryId: number): void {
    this.router.navigate(['/products'], {
      queryParams: { categoryId },
    });
  }

  getCategoryIcon(category: Category, index: number): string {
    return category.icon || this.categoryIcons[index % this.categoryIcons.length].icon;
  }

  getCategoryColor(category: Category, index: number): string {
    return category.color || this.categoryIcons[index % this.categoryIcons.length].color;
  }

  submitNewsletter(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      return;
    }
    const email = this.newsletterForm.value.email;
    this.toastr.success(
      `${email} subscribed! You'll get the best deals first.`,
      'Subscribed Successfully!',
      { timeOut: 4000 }
    );
    this.newsletterForm.reset();
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }
}
