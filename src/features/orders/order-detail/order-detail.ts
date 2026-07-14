import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus, OrderTimeline } from '../../../models/order.model';

interface TimelineStep {
  status: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss'
})
export class OrderDetail implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  order = signal<Order | null>(null);
  isLoading = signal(true);
  isCancelling = signal(false);

  readonly timelineSteps: TimelineStep[] = [
    { status: 'placed',     label: 'Order Placed',   icon: 'fas fa-shopping-cart', description: 'Your order has been received' },
    { status: 'confirmed',  label: 'Confirmed',      icon: 'fas fa-check-circle',  description: 'Order confirmed by seller' },
    { status: 'processing', label: 'Processing',     icon: 'fas fa-cog',           description: 'Preparing your items' },
    { status: 'shipped',    label: 'Shipped',         icon: 'fas fa-truck',         description: 'On the way to you' },
    { status: 'delivered',  label: 'Delivered',       icon: 'fas fa-box-open',      description: 'Successfully delivered' }
  ];

  private readonly statusOrder = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) this.loadOrder(id);
    });
  }

  private loadOrder(id: number): void {
    this.isLoading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Order not found', 'Error');
        this.isLoading.set(false);
        this.router.navigate(['/orders']);
      }
    });
  }

  getStepStatus(step: TimelineStep): 'completed' | 'active' | 'pending' {
    const order = this.order();
    if (!order) return 'pending';

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return step.status === 'placed' ? 'completed' : 'pending';
    }

    const currentIndex  = this.statusOrder.indexOf(order.status);
    const stepIndex     = this.statusOrder.indexOf(step.status);

    if (stepIndex < currentIndex)  return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  getTimelineEntry(status: string): OrderTimeline | undefined {
    return this.order()?.timeline?.find(t => t.status === status);
  }

  canCancel(): boolean {
    const status = this.order()?.status;
    return status === 'placed' || status === 'confirmed';
  }

  cancelOrder(): void {
    const order = this.order();
    if (!order || !this.canCancel()) return;
    this.isCancelling.set(true);
    this.orderService.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.isCancelling.set(false);
        this.toastr.success('Your order has been cancelled.', 'Order Cancelled');
      },
      error: () => {
        this.isCancelling.set(false);
        this.toastr.error('Failed to cancel order. Try again.', 'Error');
      }
    });
  }

  getStatusBadgeClass(status: OrderStatus): string {
    const map: Record<string, string> = {
      placed:     'status-pending',
      confirmed:  'status-confirmed',
      processing: 'status-processing',
      shipped:    'status-shipped',
      delivered:  'status-delivered',
      cancelled:  'status-cancelled',
      refunded:   'status-cancelled'
    };
    return map[status] ?? 'status-pending';
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      credit_card: 'Credit / Debit Card',
      paypal: 'PayPal',
      stripe: 'Stripe',
      wallet: 'Wallet Balance',
      cod: 'Cash on Delivery'
    };
    return labels[method] ?? method;
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      credit_card: 'fas fa-credit-card',
      paypal: 'fab fa-paypal',
      stripe: 'fab fa-stripe-s',
      wallet: 'fas fa-wallet',
      cod: 'fas fa-money-bill-wave'
    };
    return icons[method] ?? 'fas fa-credit-card';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
