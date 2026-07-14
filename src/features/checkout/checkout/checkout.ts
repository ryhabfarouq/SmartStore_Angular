import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

import { CartItem } from '../../../models/cart.model';
import { Product } from '../../../models/product.model';
import { Order } from '../../../models/order.model';
import { PaymentMethod } from '../../../models/payment.model';

export type CheckoutStep = 1 | 2 | 3;
export type PaymentOption = 'credit_card' | 'paypal' | 'cash_on_delivery' | 'wallet';

export interface CartItemWithProduct extends CartItem {
  product?: Product;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  currentStep = signal<CheckoutStep>(1);
  selectedPaymentMethod = signal<PaymentOption>('credit_card');
  placedOrder = signal<Order | null>(null);
  isProcessing = signal(false);
  isLoadingProducts = signal(true);
  cartItemsWithProducts = signal<CartItemWithProduct[]>([]);

  currentUser = this.authService.currentUser;

  subtotal = computed(() =>
    this.cartItemsWithProducts().reduce((sum, item) => {
      return sum + (item.product?.price ?? 0) * item.quantity;
    }, 0)
  );

  discount = computed(() =>
    this.cartItemsWithProducts().reduce((sum, item) => {
      const p = item.product;
      if (!p) return sum;
      const orig = p.price * item.quantity;
      return sum + (orig * p.discountPercentage) / 100;
    }, 0)
  );

  afterDiscount = computed(() => this.subtotal() - this.discount());
  shipping = computed(() => (this.afterDiscount() > 100 ? 0 : 9.99));
  tax = computed(() => this.afterDiscount() * 0.09);
  total = computed(() => this.afterDiscount() + this.shipping() + this.tax());

  walletBalance = computed(() => this.currentUser()?.wallet ?? 0);
  hasEnoughWallet = computed(() => this.walletBalance() >= this.total());

  shippingForm!: FormGroup;
  creditCardForm!: FormGroup;
  paypalForm!: FormGroup;

  paymentOptions: { value: PaymentOption; label: string; icon: string; desc: string }[] = [
    { value: 'credit_card', label: 'Credit Card', icon: 'fas fa-credit-card', desc: 'Visa, MasterCard, Amex' },
    { value: 'paypal', label: 'PayPal', icon: 'fab fa-paypal', desc: 'Pay with your PayPal account' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery', icon: 'fas fa-money-bill-wave', desc: 'Pay when you receive' },
    { value: 'wallet', label: 'Wallet', icon: 'fas fa-wallet', desc: 'Use your ShopWave balance' },
  ];

  ngOnInit(): void {
    const user = this.currentUser();
    if (!user) {
      this.toastr.warning('Please login to continue', 'Login Required');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initForms(user);
    this.loadCartProducts();
  }

  private initForms(user: any): void {
    const addr = user.address ?? {};

    this.shippingForm = this.fb.group({
      street: [addr.street || '', [Validators.required, Validators.minLength(5)]],
      city: [addr.city || '', [Validators.required, Validators.minLength(2)]],
      state: [addr.state || '', [Validators.required]],
      zip: [addr.zip || '', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      country: [addr.country || '', [Validators.required]],
    });

    this.creditCardForm = this.fb.group({
      cardHolderName: ['', [Validators.required, Validators.minLength(3)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    });

    this.paypalForm = this.fb.group({
      paypalEmail: ['', [Validators.required, Validators.email]],
    });
  }

  private loadCartProducts(): void {
    const items = this.cartService.cartItems();
    if (!items.length) {
      this.isLoadingProducts.set(false);
      return;
    }

    const requests = items.map((item) =>
      this.productService.getProductById(item.productId)
    );

    forkJoin(requests).subscribe({
      next: (products) => {
        const withProducts: CartItemWithProduct[] = items.map((item, idx) => ({
          ...item,
          product: products[idx],
        }));
        this.cartItemsWithProducts.set(withProducts);
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.cartItemsWithProducts.set(items.map((i) => ({ ...i } as CartItemWithProduct)));
        this.isLoadingProducts.set(false);
      },
    });
  }

  goToStep(step: CheckoutStep): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  continueToPayment(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }
    this.currentStep.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectPaymentMethod(method: PaymentOption): void {
    this.selectedPaymentMethod.set(method);
  }

  placeOrder(): void {
    const method = this.selectedPaymentMethod();

    if (method === 'credit_card' && this.creditCardForm.invalid) {
      this.creditCardForm.markAllAsTouched();
      this.toastr.warning('Please fill in your card details', 'Validation Error');
      return;
    }

    if (method === 'paypal' && this.paypalForm.invalid) {
      this.paypalForm.markAllAsTouched();
      this.toastr.warning('Please enter your PayPal email', 'Validation Error');
      return;
    }

    if (method === 'wallet' && !this.hasEnoughWallet()) {
      this.toastr.error('Insufficient wallet balance', 'Payment Error');
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isProcessing.set(true);

    const shippingAddress = this.shippingForm.value;
    const orderItems = this.cartItemsWithProducts().map((item) => ({
      productId: item.productId,
      title: item.product?.title ?? '',
      thumbnail: item.product?.thumbnail ?? '',
      quantity: item.quantity,
      price: item.product?.price ?? 0,
      subtotal: (item.product?.price ?? 0) * item.quantity,
    }));

    const orderRequest = {
      userId: user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod: method,
    };

    this.orderService
      .placeOrder(orderRequest)
      .pipe(
        switchMap((order) => {
          const paymentReq = {
            orderId: order.id,
            userId: user.id,
            amount: order.total,
            method: method as PaymentMethod,
            cardNumber:
              method === 'credit_card'
                ? this.creditCardForm.value.cardNumber
                : undefined,
            cardExpiry:
              method === 'credit_card'
                ? this.creditCardForm.value.expiry
                : undefined,
            cardCvv:
              method === 'credit_card'
                ? this.creditCardForm.value.cvv
                : undefined,
            paypalEmail:
              method === 'paypal'
                ? this.paypalForm.value.paypalEmail
                : undefined,
          };

          this.placedOrder.set(order);
          return this.paymentService.processPayment(paymentReq);
        })
      )
      .subscribe({
        next: () => {
          this.cartService.clearCart(user.id).subscribe();
          this.isProcessing.set(false);
          this.currentStep.set(3);
          this.toastr.success(
            'Your order has been placed successfully!',
            'Order Placed'
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          this.isProcessing.set(false);
          this.toastr.error(
            'Failed to process your order. Please try again.',
            'Order Failed'
          );
        },
      });
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    this.creditCardForm.patchValue({ cardNumber: value }, { emitEvent: false });
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.creditCardForm.patchValue({ expiry: value }, { emitEvent: false });
    input.value = value;
  }

  getDisplayCardNumber(): string {
    const num = this.creditCardForm?.value?.cardNumber ?? '';
    return num.replace(/(.{4})/g, '$1 ').trim();
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getFieldError(form: FormGroup, field: string): string {
    const ctrl = form.get(field);
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return 'This field is required';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} characters`;
    if (ctrl.errors['pattern']) return 'Invalid format';
    if (ctrl.errors['email']) return 'Invalid email address';
    return 'Invalid value';
  }

  trackById(index: number, item: CartItemWithProduct): number {
    return item.id;
  }
}
