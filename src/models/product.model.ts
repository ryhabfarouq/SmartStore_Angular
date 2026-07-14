export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  categoryId: number;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  sellerId: number;
  tags: string[];
  availabilityStatus: string;
  images: string[];
  thumbnail: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface ProductFilter {
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sellerId?: number;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}
