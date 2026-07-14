import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, CreateOrderRequest, OrderStatus } from '../../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  getUserOrders(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}?userId=${userId}&_sort=createdAt&_order=desc`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}?_sort=createdAt&_order=desc`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  placeOrder(request: CreateOrderRequest): Observable<Order> {
    const subtotal = request.items.reduce((sum, i) => sum + i.subtotal, 0);
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const tax = subtotal * 0.09;
    const total = subtotal + shippingCost + tax;
    const orderNum = `ORD-${Date.now()}`;
    const now = new Date().toISOString();

    const order: Omit<Order, 'id'> = {
      ...request,
      orderNumber: orderNum,
      paymentStatus: 'pending',
      status: 'placed',
      subtotal,
      shippingCost,
      tax,
      discount: 0,
      total,
      trackingNumber: '',
      notes: request.notes || '',
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'placed', timestamp: now, description: 'Order placed successfully' }],
    };
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    const now = new Date().toISOString();
    return this.http.patch<Order>(`${this.apiUrl}/${id}`, {
      status,
      updatedAt: now,
    });
  }

  cancelOrder(id: number): Observable<Order> {
    return this.updateOrderStatus(id, 'cancelled');
  }
}
