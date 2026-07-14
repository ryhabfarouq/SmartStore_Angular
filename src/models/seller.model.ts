import { Address } from './user.model';

export interface Seller {
  id: number;
  userId: number;
  storeName: string;
  description: string;
  logo: string;
  banner: string;
  rating: number;
  totalSales: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  joinedAt: string;
  contactEmail: string;
  phone: string;
  address: Address;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  gradient: string;
  isActive: boolean;
  order: number;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
