import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

import { OrderService } from '../../../core/services/order.service';
import { UserService } from '../../../core/services/user.service';
import { Order, OrderStatus } from '../../../models/order.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class AdminOrders implements OnInit {
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  orders = signal<(Order & { customerName?: string; customerEmail?: string })[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);

  searchQuery = signal('');
  statusFilter = signal<string>('all');

  selectedOrder = signal<(Order & { customerName?: string; customerEmail?: string }) | null>(null);
  showDetailModal = signal(false);
  updatingOrderId = signal<number | null>(null);

  availableStatuses: OrderStatus[] = [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  totalOrdersCount = computed(() => this.orders().length);
  totalRevenue = computed(() =>
    this.orders()
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + o.total, 0),
  );
  pendingOrdersCount = computed(
    () =>
      this.orders().filter(
        (o) => o.status === 'placed' || o.status === 'confirmed' || o.status === 'processing',
      ).length,
  );
  completedOrdersCount = computed(
    () => this.orders().filter((o) => o.status === 'delivered').length,
  );

  filteredOrders = computed(() => {
    let list = [...this.orders()];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();

    if (filter !== 'all') {
      list = list.filter((o) => o.status === filter);
    }

    if (query) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          (o.customerName && o.customerName.toLowerCase().includes(query)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(query)),
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      orders: this.orderService.getAllOrders(),
      users: this.userService.getAllUsers(),
    }).subscribe({
      next: ({ orders, users }) => {
        this.users.set(users);
        const mappedOrders = orders.map((order) => {
          const user = users.find((u) => u.id === order.userId);
          return {
            ...order,
            customerName: user ? user.name : 'Unknown Customer',
            customerEmail: user ? user.email : '',
          };
        });
        this.orders.set(mappedOrders);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load orders and user details.', 'Error');
        this.isLoading.set(false);
      },
    });
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): void {
    this.updatingOrderId.set(orderId);
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (updatedOrder) => {
        this.orders.update((list) =>
          list.map((o) =>
            o.id === orderId ? { ...o, status: newStatus, updatedAt: updatedOrder.updatedAt } : o,
          ),
        );

        const selected = this.selectedOrder();
        if (selected && selected.id === orderId) {
          this.selectedOrder.set({
            ...selected,
            status: newStatus,
            updatedAt: updatedOrder.updatedAt,
          });
        }

        this.updatingOrderId.set(null);
        this.toastr.success(`Order status updated to ${newStatus}.`, 'Success');
      },
      error: () => {
        this.updatingOrderId.set(null);
        this.toastr.error('Failed to update order status.', 'Error');
      },
    });
  }

  openDetails(order: Order & { customerName?: string; customerEmail?: string }): void {

    this.isLoading.set(true);
    this.orderService.getOrderById(order.id).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set({
          ...fullOrder,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
        } as any);
        this.showDetailModal.set(true);
        this.isLoading.set(false);
      },
      error: () => {

        this.selectedOrder.set(order);
        this.showDetailModal.set(true);
        this.isLoading.set(false);
      },
    });
  }

  closeDetails(): void {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'placed':
        return 'status-badge status-pending';
      case 'confirmed':
        return 'status-badge status-confirmed';
      case 'processing':
        return 'status-badge status-processing';
      case 'shipped':
        return 'status-badge status-shipped';
      case 'delivered':
        return 'status-badge status-delivered';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'refunded':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  }
}
