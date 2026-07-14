import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { adminGuard } from '../core/guards/admin.guard';
import { sellerGuard } from '../core/guards/seller.guard';
import { guestGuard } from '../core/guards/guest.guard';

export const routes: Routes = [

  {
    path: 'auth',
    loadComponent: () => import('../layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('../features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('../features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'confirm',
        loadComponent: () =>
          import('../features/auth/email-confirm/email-confirm').then((m) => m.EmailConfirm),
      },
    ],
  },

  {
    path: 'admin',
    loadComponent: () => import('../layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/admin/dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'users',
        loadComponent: () => import('../features/admin/users/users').then((m) => m.AdminUsers),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../features/admin/products/products').then((m) => m.AdminProducts),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../features/admin/categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'orders',
        loadComponent: () => import('../features/admin/orders/orders').then((m) => m.AdminOrders),
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('../features/admin/banners/banners').then((m) => m.AdminBanners),
      },
    ],
  },

  {
    path: 'seller',
    loadComponent: () =>
      import('../layouts/seller-layout/seller-layout').then((m) => m.SellerLayout),
    canActivate: [authGuard, sellerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/seller/dashboard/dashboard').then((m) => m.SellerDashboard),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../features/seller/products/products').then((m) => m.SellerProducts),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('../features/seller/inventory/inventory').then((m) => m.SellerInventory),
      },
    ],
  },

  {
    path: '',
    loadComponent: () => import('../layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('../features/home/home/home').then((m) => m.Home),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../features/products/product-list/product-list').then((m) => m.ProductList),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('../features/products/product-detail/product-detail').then((m) => m.ProductDetail),
      },
      {
        path: 'cart',
        loadComponent: () => import('../features/cart/cart/cart').then((m) => m.Cart),
        canActivate: [authGuard],
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('../features/checkout/checkout/checkout').then((m) => m.Checkout),
        canActivate: [authGuard],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('../features/orders/order-list/order-list').then((m) => m.OrderList),
        canActivate: [authGuard],
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('../features/orders/order-detail/order-detail').then((m) => m.OrderDetail),
        canActivate: [authGuard],
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('../features/wishlist/wishlist/wishlist').then((m) => m.Wishlist),
        canActivate: [authGuard],
      },
      {
        path: 'profile',
        loadComponent: () => import('../features/profile/profile/profile').then((m) => m.Profile),
        canActivate: [authGuard],
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('../features/not-found/not-found').then((m) => m.NotFound),
  },
];
