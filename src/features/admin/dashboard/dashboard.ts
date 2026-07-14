import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../models/order.model';
import { User } from '../../../models/user.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);

  users = signal<User[]>([]);
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  isLoading = signal(true);

  totalRevenue = computed(() => this.orders().reduce((sum, o) => sum + o.total, 0));

  recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  stats = computed(() => [
    {
      label: 'Total Users',
      value: this.users().length,
      icon: 'fas fa-users',
      color: '#6c5ce7',
      bgClass: 'bg-purple',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total Products',
      value: this.products().length,
      icon: 'fas fa-box',
      color: '#0984e3',
      bgClass: 'bg-blue',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Total Orders',
      value: this.orders().length,
      icon: 'fas fa-shopping-cart',
      color: '#00b894',
      bgClass: 'bg-green',
      trend: '+23%',
      trendUp: true,
    },
    {
      label: 'Total Revenue',
      value: this.totalRevenue(),
      icon: 'fas fa-dollar-sign',
      color: '#e17055',
      bgClass: 'bg-orange',
      trend: '+18%',
      trendUp: true,
      isCurrency: true,
    },
  ]);

  quickLinks = [
    {
      label: 'Manage Users',
      icon: 'fas fa-users',
      route: '/admin/users',
      color: '#6c5ce7',
      desc: 'View and manage all users',
    },
    {
      label: 'Manage Products',
      icon: 'fas fa-box-open',
      route: '/admin/products',
      color: '#0984e3',
      desc: 'Add, edit, or delete products',
    },
    {
      label: 'Manage Categories',
      icon: 'fas fa-tags',
      route: '/admin/categories',
      color: '#00b894',
      desc: 'Organize product categories',
    },
    {
      label: 'Manage Banners',
      icon: 'fas fa-image',
      route: '/admin/banners',
      color: '#e17055',
      desc: 'Control homepage banners',
    },
    {
      label: 'All Orders',
      icon: 'fas fa-receipt',
      route: '/admin/orders',
      color: '#fd79a8',
      desc: 'Track and manage orders',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    let loaded = 0;
    const checkDone = () => {
      if (++loaded === 3) this.isLoading.set(false);
    };

    this.userService.getAllUsers().subscribe({
      next: (u) => {
        this.users.set(u);
        checkDone();
      },
      error: () => checkDone(),
    });

    this.productService.getProducts().subscribe({
      next: (p) => {
        this.products.set(p);
        checkDone();
      },
      error: () => checkDone(),
    });

    this.orderService.getAllOrders().subscribe({
      next: (o) => {
        this.orders.set(o);
        checkDone();
      },
      error: () => checkDone(),
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      placed: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      refunded: 'status-cancelled',
    };
    return map[status] || 'status-pending';
  }
}
