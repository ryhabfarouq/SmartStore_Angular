import {
  Component, OnInit, inject, signal, computed, effect, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SellerService } from '../../../core/services/seller.service';
import { Product, ProductFilter } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { Seller } from '../../../models/seller.model';
import { ProductCard } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, ProductCard],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private sellerService = inject(SellerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  sellers = signal<Seller[]>([]);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');
  sortBy = signal<string>('newest');
  searchQuery = signal('');

  selectedCategories = signal<number[]>([]);
  priceMin = signal<number | null>(null);
  priceMax = signal<number | null>(null);
  inStockOnly = signal(false);
  selectedSeller = signal<number | null>(null);

  filterForm: FormGroup;
  searchForm: FormGroup;

  filteredCount = computed(() => this.products().length);

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedCategories().length) count++;
    if (this.priceMin() !== null || this.priceMax() !== null) count++;
    if (this.inStockOnly()) count++;
    if (this.selectedSeller()) count++;
    return count;
  });

  skeletons = Array(8).fill(0);

  constructor() {
    this.filterForm = this.fb.group({
      priceMin: [null],
      priceMax: [null],
      inStockOnly: [false],
      sellerId: [null]
    });

    this.searchForm = this.fb.group({
      search: ['']
    });

    this.searchForm.get('search')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      this.searchQuery.set(val ?? '');
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSellers();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const search = params['search'] || '';
      const categoryId = params['categoryId'] ? +params['categoryId'] : null;

      this.searchForm.patchValue({ search }, { emitEvent: false });
      this.searchQuery.set(search);

      if (categoryId) {
        this.selectedCategories.set([categoryId]);
      }

      this.loadProducts();
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: cats => this.categories.set(cats),
      error: () => {}
    });
  }

  loadSellers(): void {
    this.sellerService.getAllSellers().subscribe({
      next: sels => this.sellers.set(sels),
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    const filter: ProductFilter = {};
    if (this.searchQuery()) filter.search = this.searchQuery();

    this.productService.getProducts(filter).subscribe({
      next: prods => {
        this.allProducts.set(prods);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allProducts()];

    const q = this.searchQuery().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategories().length) {
      result = result.filter(p => this.selectedCategories().includes(p.categoryId));
    }

    if (this.priceMin() !== null) {
      result = result.filter(p => p.price >= this.priceMin()!);
    }
    if (this.priceMax() !== null) {
      result = result.filter(p => p.price <= this.priceMax()!);
    }

    if (this.inStockOnly()) {
      result = result.filter(p => p.availabilityStatus === 'In Stock');
    }

    if (this.selectedSeller()) {
      result = result.filter(p => p.sellerId === this.selectedSeller());
    }

    switch (this.sortBy()) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    this.products.set(result);
  }

  onSortChange(sort: string): void {
    this.sortBy.set(sort);
    this.applyFilters();
  }

  toggleCategory(categoryId: number): void {
    const current = this.selectedCategories();
    if (current.includes(categoryId)) {
      this.selectedCategories.set(current.filter(id => id !== categoryId));
    } else {
      this.selectedCategories.set([...current, categoryId]);
    }
    this.applyFilters();
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategories().includes(categoryId);
  }

  onPriceChange(): void {
    const vals = this.filterForm.value;
    this.priceMin.set(vals.priceMin ? +vals.priceMin : null);
    this.priceMax.set(vals.priceMax ? +vals.priceMax : null);
    this.applyFilters();
  }

  onStockChange(): void {
    this.inStockOnly.set(this.filterForm.value.inStockOnly);
    this.applyFilters();
  }

  onSellerChange(): void {
    const sellerId = this.filterForm.value.sellerId;
    this.selectedSeller.set(sellerId ? +sellerId : null);
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.priceMin.set(null);
    this.priceMax.set(null);
    this.inStockOnly.set(false);
    this.selectedSeller.set(null);
    this.filterForm.reset();
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  getCategoryName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '';
  }

  removeSellerFilter(): void {
    this.selectedSeller.set(null);
    this.filterForm.patchValue({ sellerId: null });
    this.applyFilters();
  }

  removeCategoryFilter(id: number): void {
    this.selectedCategories.set(this.selectedCategories().filter(c => c !== id));
    this.applyFilters();
  }

  removePriceFilter(): void {
    this.priceMin.set(null);
    this.priceMax.set(null);
    this.filterForm.patchValue({ priceMin: null, priceMax: null });
    this.applyFilters();
  }

  removeStockFilter(): void {
    this.inStockOnly.set(false);
    this.filterForm.patchValue({ inStockOnly: false });
    this.applyFilters();
  }

  getSellerName(id: number): string {
    return this.sellers().find(s => s.id === id)?.storeName ?? '';
  }
}
