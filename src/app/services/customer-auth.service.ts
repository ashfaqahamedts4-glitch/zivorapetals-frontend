import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService, ApiResponseWrapper } from './api.service';

export interface CustomerShippingAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  mobile: string;
  shippingAddress?: CustomerShippingAddress;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerAuthService {
  private readonly customerSubject = new BehaviorSubject<Customer | null>(null);
  readonly customer$ = this.customerSubject.asObservable();

  private readonly loggedInSubject = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router
  ) {
    this.init();
    
    // Listen for customer logout events (e.g. from 401 interceptor)
    window.addEventListener('customer-logout', () => {
      this.clearSession();
      this.router.navigate(['/login']);
    });
  }

  private init(): void {
    const token = localStorage.getItem('customer_token');
    const dataStr = localStorage.getItem('customer_data');
    if (token && dataStr) {
      try {
        const customer = JSON.parse(dataStr);
        this.customerSubject.next(customer);
        this.loggedInSubject.next(true);
        // Refresh profile from server in background
        this.getProfile().subscribe({
          error: () => this.clearSession()
        });
      } catch (e) {
        this.clearSession();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponseWrapper<{ accessToken: string; role: 'admin' | 'customer'; customer?: Customer; admin?: any }>> {
    return this.apiService.post<ApiResponseWrapper<{ accessToken: string; role: 'admin' | 'customer'; customer?: Customer; admin?: any }>>('/auth/login', credentials).pipe(
      tap((res) => {
        if (res.data && res.data.accessToken && res.data.role === 'customer') {
          this.setSession(res.data.accessToken, res.data.customer!);
        }
      })
    );
  }

  register(payload: any): Observable<ApiResponseWrapper<{ accessToken: string; customer: Customer }>> {
    return this.apiService.post<ApiResponseWrapper<{ accessToken: string; customer: Customer }>>('/auth/customer/register', payload).pipe(
      tap((res) => {
        if (res.data && res.data.accessToken) {
          this.setSession(res.data.accessToken, res.data.customer);
        }
      })
    );
  }

  getProfile(): Observable<ApiResponseWrapper<Customer>> {
    return this.apiService.get<ApiResponseWrapper<Customer>>('/auth/customer/me').pipe(
      tap((res) => {
        if (res.data) {
          this.customerSubject.next(res.data);
          localStorage.setItem('customer_data', JSON.stringify(res.data));
        }
      })
    );
  }

  updateProfile(data: Partial<Customer>): Observable<ApiResponseWrapper<Customer>> {
    return this.apiService.put<ApiResponseWrapper<Customer>>('/auth/customer/profile', data).pipe(
      tap((res) => {
        if (res.data) {
          this.customerSubject.next(res.data);
          localStorage.setItem('customer_data', JSON.stringify(res.data));
        }
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(token: string, customer: Customer): void {
    localStorage.setItem('customer_token', token);
    localStorage.setItem('customer_data', JSON.stringify(customer));
    this.customerSubject.next(customer);
    this.loggedInSubject.next(true);
  }

  private clearSession(): void {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
    this.customerSubject.next(null);
    this.loggedInSubject.next(false);
  }
}
