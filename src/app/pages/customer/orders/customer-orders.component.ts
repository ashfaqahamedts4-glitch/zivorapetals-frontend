import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../../services/api.service';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerDetails: {
    name: string;
    mobile: string;
    email?: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentScreenshot: string;
  paymentStatus: 'Pending Verification' | 'Paid' | 'Rejected';
  orderStatus: string;
  createdAt: string;
  cancellationReason?: string;
}

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.css',
})
export class CustomerOrdersComponent implements OnInit, OnDestroy {
  readonly getImageUrl = getImageUrl;
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  loading = true;
  error: string | null = null;
  private pollSubscription: Subscription | null = null;

  // Order status steps in order
  readonly statusSteps = [
    { label: 'Placed', value: 'Pending' },
    { label: 'Payment Verifying', value: 'Payment Verification' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Packed', value: 'Packed' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  constructor(
    private readonly apiService: ApiService,
    public readonly authService: CustomerAuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    console.log('CustomerOrdersComponent: Starting background polling...');
    this.pollSubscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.apiService.get<ApiResponseWrapper<Order[]>>('/customer/orders'))
      )
      .subscribe({
        next: (res: any) => {
          let newOrders: Order[] = [];
          if (res && Array.isArray(res)) {
            newOrders = res;
          } else if (res && res.data && Array.isArray(res.data)) {
            newOrders = res.data;
          } else if (res && Array.isArray(res.orders)) {
            newOrders = res.orders;
          }

          this.orders = newOrders;

          // Silent update of the active selected order details on change
          if (this.selectedOrder) {
            const fresh = this.orders.find((o) => o._id === this.selectedOrder?._id);
            if (fresh) {
              this.selectedOrder = fresh;
            }
          } else if (this.orders.length > 0) {
            this.selectedOrder = this.orders[0];
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('CustomerOrdersComponent: Polling sync error:', err);
          if (this.loading) {
            this.error = err.message || 'Failed to load orders.';
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      });
  }

  private stopPolling(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = null;
    }
  }

  loadOrders(): void {
    this.startPolling();
  }

  selectOrder(order: Order): void {
    this.selectedOrder = order;
    this.cdr.detectChanges();
  }

  // Get index of the current order status in the steps
  getStatusIndex(status: string): number {
    return this.statusSteps.findIndex(step => step.value === status);
  }

  // Check if step should be active
  isStepActive(stepValue: string, currentStatus: string): boolean {
    if (currentStatus === 'Cancelled') return false;
    const currentIndex = this.getStatusIndex(currentStatus);
    const stepIndex = this.statusSteps.findIndex(step => step.value === stepValue);
    return stepIndex <= currentIndex;
  }
}
