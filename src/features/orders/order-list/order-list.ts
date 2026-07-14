import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderStatus } from '../../../models/order.model';

type FilterType = 'all' | 'active' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.scss'],
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);
  activeFilter = signal<FilterType>('all');
  cancellingId = signal<number | null>(null);

  filteredOrders = computed(() => {
    const all = this.orders();
    const filter = this.activeFilter();
    switch (filter) {
      case 'active':
        return all.filter((o) =>
          ['placed', 'confirmed', 'processing', 'shipped'].includes(o.status),
        );
      case 'delivered':
        return all.filter((o) => o.status === 'delivered');
      case 'cancelled':
        return all.filter((o) => o.status === 'cancelled' || o.status === 'refunded');
      default:
        return all;
    }
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.orderService.getUserOrders(user.id).subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastr.error('Failed to load orders', 'Error');
          this.isLoading.set(false);
        },
      });
    }
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  canCancel(status: OrderStatus): boolean {
    return status === 'placed' || status === 'confirmed';
  }

  cancelOrder(order: Order): void {
    if (!this.canCancel(order.status)) return;
    this.cancellingId.set(order.id);
    this.orderService.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.orders.update((orders) => orders.map((o) => (o.id === updated.id ? updated : o)));
        this.cancellingId.set(null);
        this.toastr.success(`Order ${order.orderNumber} has been cancelled.`, 'Order Cancelled');
      },
      error: () => {
        this.cancellingId.set(null);
        this.toastr.error('Failed to cancel order. Please try again.', 'Error');
      },
    });
  }

  getStatusClass(status: OrderStatus): string {
    const map: Record<string, string> = {
      placed: 'badge-placed',
      confirmed: 'badge-confirmed',
      processing: 'badge-processing',
      shipped: 'badge-shipped',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
      refunded: 'badge-cancelled',
    };
    return map[status] ?? 'badge-placed';
  }

  getStatusIcon(status: OrderStatus): string {
    const map: Record<string, string> = {
      placed: 'fas fa-clock',
      confirmed: 'fas fa-check-circle',
      processing: 'fas fa-cog',
      shipped: 'fas fa-truck',
      delivered: 'fas fa-box-open',
      cancelled: 'fas fa-times-circle',
      refunded: 'fas fa-undo',
    };
    return map[status] ?? 'fas fa-clock';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  get filterCounts() {
    const all = this.orders();
    return {
      all: all.length,
      active: all.filter((o) => ['placed', 'confirmed', 'processing', 'shipped'].includes(o.status))
        .length,
      delivered: all.filter((o) => o.status === 'delivered').length,
      cancelled: all.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length,
    };
  }
}
