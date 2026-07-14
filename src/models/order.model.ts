import { Address } from './user.model';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: number;
  title: string;
  thumbnail: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderTimeline {
  status: string;
  timestamp: string;
  description: string;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  trackingNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimeline[];
}

export interface CreateOrderRequest {
  userId: number;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  notes?: string;
}
