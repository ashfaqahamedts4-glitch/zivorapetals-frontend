import { Injectable } from '@angular/core';
import { ApiService, ApiResponseWrapper } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastService } from '../shared/toast/toast.service';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnail: string;
  sku: string;
  isActive: boolean;
  shortDescription?: string;
  description?: string;
  images?: string[];
  tags?: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  categoryId?: any;
}

export interface CartItem {
  productId: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  guestCartId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface ToastAlert {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);
  readonly cart$: Observable<Cart | null> = this.cartSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private readonly toastSubject = new BehaviorSubject<ToastAlert | null>(null);
  readonly toast$: Observable<ToastAlert | null> = this.toastSubject.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly toastService: ToastService
  ) {
    this.refreshCart();
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastService.show(message, type);
  }

  hideToast(): void {
    // Deprecated, handled automatically by ToastService dismiss
  }

  refreshCart(): void {
    this.loadingSubject.next(true);
    this.apiService.get<ApiResponseWrapper<Cart>>('/cart').subscribe({
      next: (res) => {
        this.cartSubject.next(res.data);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error fetching cart:', err);
        this.loadingSubject.next(false);
      },
    });
  }

  addToCart(productId: string, quantity: number): void {
    this.loadingSubject.next(true);
    this.apiService.post<ApiResponseWrapper<Cart>>('/cart/add', { productId, quantity }).subscribe({
      next: (res) => {
        this.cartSubject.next(res.data);
        this.showToast('Product added to bag!', 'success');
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.message || 'Failed to add to bag', 'error');
        this.loadingSubject.next(false);
      },
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.loadingSubject.next(true);
    this.apiService.put<ApiResponseWrapper<Cart>>('/cart/quantity', { productId, quantity }).subscribe({
      next: (res) => {
        this.cartSubject.next(res.data);
        this.showToast('Cart quantity updated', 'success');
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.message || 'Failed to update quantity', 'error');
        this.loadingSubject.next(false);
      },
    });
  }

  removeFromCart(productId: string): void {
    this.loadingSubject.next(true);
    this.apiService.delete<ApiResponseWrapper<Cart>>(`/cart/item/${productId}`).subscribe({
      next: (res) => {
        this.cartSubject.next(res.data);
        this.showToast('Product removed from bag', 'success');
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.message || 'Failed to remove product', 'error');
        this.loadingSubject.next(false);
      },
    });
  }

  clearCart(): void {
    this.loadingSubject.next(true);
    this.apiService.post<ApiResponseWrapper<Cart>>('/cart/clear', {}).subscribe({
      next: (res) => {
        this.cartSubject.next(res.data);
        this.showToast('Cart cleared', 'info');
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.message || 'Failed to clear cart', 'error');
        this.loadingSubject.next(false);
      },
    });
  }

  // Reactive properties mapping
  readonly cartCount$: Observable<number> = this.cart$.pipe(
    map((cart) => cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0)
  );

  readonly cartSubtotal$: Observable<number> = this.cart$.pipe(
    map((cart) => {
      return (
        cart?.items.reduce((acc, item) => {
          const product = item.productId;
          if (!product) return acc;
          const price =
            product.discountPrice !== undefined &&
            product.discountPrice !== null &&
            product.discountPrice > 0
              ? product.discountPrice
              : product.price;
          return acc + price * item.quantity;
        }, 0) || 0
      );
    })
  );
}
