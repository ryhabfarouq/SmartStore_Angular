import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment, PaymentRequest } from '../../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  processPayment(request: PaymentRequest): Observable<Payment> {

    const payment: Omit<Payment, 'id'> = {
      orderId: request.orderId,
      userId: request.userId,
      amount: request.amount,
      method: request.method,
      status: 'success',
      transactionId: `TXN-${request.method.toUpperCase()}-${Date.now()}`,
      cardLast4: request.cardNumber ? request.cardNumber.slice(-4) : undefined,
      paypalEmail: request.paypalEmail,
      createdAt: new Date().toISOString(),
    };
    return this.http.post<Payment>(this.apiUrl, payment).pipe(
      delay(1500), 
    );
  }

  getUserPayments(userId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getPaymentByOrder(orderId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}?orderId=${orderId}`);
  }
}
