# 🛒 Smart Store — Angular E-Commerce Platform

A modern and responsive **E-Commerce Web Application** built with **Angular**, **Bootstrap**, and **SCSS**.

Smart Store provides a complete shopping experience for customers, sellers, and administrators. The project uses **JSON Server** as a mock REST API for development and testing.

---

## 🚀 Technologies Used

* Angular
* TypeScript
* Bootstrap
* SCSS
* RxJS
* Angular Router
* Angular Reactive Forms
* JSON Server
* REST API
* Local Storage / Session Storage

---

## ✨ Features

### 👤 User Management

* User registration and login
* Login using:

  * Email
  * Phone number
  * Google authentication *(Bonus)*
* Email confirmation
* User profile management

  * Name
  * Address
  * Payment details
  * Personal information
* Multi-user role system:

  * Customer
  * Seller
  * Admin
* Wishlist and favorites
* Order history
* Product reviews and ratings

---

### 📦 Product Management

* Product categories
* Product listings
* Product images
* Detailed product descriptions
* Product pricing
* Stock availability
* Search products by name
* Advanced product filtering:

  * Price
  * Category
  * Availability
* Responsive product catalog

---

### 🛒 Shopping Cart & Checkout

* Add products to cart
* Remove products from cart
* Adjust product quantities
* Dynamic order summary
* Price breakdown
* Guest checkout
* Multiple payment methods:

  * Credit Card
  * PayPal
  * Cash on Delivery
  * Wallet
* Promo codes and discounts 

---

### 📋 Order Management

* Order placement
* Order confirmation
* Order history
* Order tracking
* Dynamic order status updates
* Email order notifications

#### Order Status

* Pending
* Confirmed
* Processing
* Shipped
* Delivered
* Cancelled

---

### 💳 Payment Integration

Secure payment gateway integration with services such as:

* Stripe
* PayPal
* Razorpay

Additional payment features:

* Secure checkout process
* Saved payment cards 
* Payment auto-fill for faster checkout 

---

### 🛡️ Admin Panel

The Admin Dashboard provides complete management functionality.

#### User Management

* View users
* Approve users
* Restrict users
* Soft delete users
* Manage user roles

#### Product Management

* Add products
* Update products
* Delete products
* Manage product stock
* Manage categories

#### Order Management

* View all orders
* Manage orders
* Update order status
* Shipping management

#### Marketing Management

* Manage discounts
* Manage promo codes 
* Manage homepage banners
* Homepage content management

---

### 🏪 Seller / Vendor Management

* Seller registration
* Seller profile setup
* Product listing management
* Add new products
* Update products
* Delete products
* Inventory management
* Stock management
* Order processing 
* Order status updates
* Earnings management
* Seller payout management 

---

## 👥 User Roles

| Role        | Permissions                                                           |
| ----------- | --------------------------------------------------------------------- |
| 👤 Customer | Browse products, manage cart, checkout, wishlist, orders, and reviews |
| 🏪 Seller   | Manage products, inventory, and seller orders                         |
| 🛡️ Admin   | Full system management including users, products, orders, and content |

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Navigate to the Project

```bash
cd smart-store
```

### 3. Install Dependencies

```bash
npm install
```

---

## ▶️ Run the Project

This project uses **JSON Server** as a mock backend API.

Run the Angular application and JSON Server using:

```bash
npm run dev
```

The development server will start the Angular application and the JSON Server.

Open your browser and navigate to:

```text
http://localhost:4200
```

---

## 🗄️ JSON Server

The project uses JSON Server to simulate a REST API.

It provides mock endpoints for:

* Users
* Products
* Categories
* Orders
* Cart
* Wishlist
* Reviews
* Sellers
* Banners
* Promo Codes

Example API endpoints:

```text
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
PATCH  /products/:id
DELETE /products/:id
```

---

## 📁 Project Structure

```text
src/
│
├── app/
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── services/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── wishlist/
│   │   ├── admin/
│   │   └── seller/
│   │
│   ├── models/
│   └── app.routes.ts
│
├── assets/
├── styles/
└── styles.scss
```

---

## 🎨 UI & Styling

The application UI is built using:

* Bootstrap
* SCSS
* Responsive Grid System
* Bootstrap Components
* Custom SCSS Components
* Mobile-first responsive design

The application is fully responsive and optimized for:

* 📱 Mobile devices
* 📟 Tablets
* 💻 Laptops
* 🖥️ Desktop screens

---

## 🔐 Authentication & Authorization

The application supports role-based authentication and authorization.

Angular Guards are used to protect routes based on user roles.

```text
Customer → Customer Routes
Seller   → Seller Dashboard
Admin    → Admin Dashboard
```

Unauthorized users are prevented from accessing protected application routes.

---

## 🌟 Future Improvements

* Real backend integration
* JWT authentication
* Angular SSR
* NgRx state management
* Real-time order tracking
* Push notifications
* Advanced analytics dashboard


---

## 👩‍💻 Author

**Ryhab Farouq**

Frontend Developer & Web Development Instructor

---

## 📄 License

This project is developed for educational and training purposes.

---

⭐ If you like this project, consider giving the repository a star!
