export type PaymentMethod = 'credit_card' | 'paypal' | 'cash_on_delivery' | 'wallet';

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transactionId: string;
  cardLast4?: string;
  paypalEmail?: string;
  createdAt: string;
}

export interface PaymentRequest {
  orderId: number;
  userId: number;
  amount: number;
  method: PaymentMethod;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  paypalEmail?: string;
}
