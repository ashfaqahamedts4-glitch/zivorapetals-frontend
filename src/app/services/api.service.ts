import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ApiResponseWrapper<T> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  // Helper to retrieve or initialize guest cart token
  getGuestCartId(): string {
    let cartId = localStorage.getItem('x-guest-cart-id');
    if (!cartId) {
      cartId = `guest-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      localStorage.setItem('x-guest-cart-id', cartId);
    }
    return cartId;
  }

  // Helper to fetch administrator bearer token
  getAdminToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  // Helper to fetch customer bearer token
  getCustomerToken(): string | null {
    return localStorage.getItem('customer_token');
  }

  // Generate request headers dynamically
  private getHeaders(endpoint?: string, isMultipart = false): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (!isMultipart) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    // Attach guest cart header
    headers = headers.set('x-guest-cart-id', this.getGuestCartId());
    
    // Determine whether to attach admin token or customer token
    const isAdminRoute = endpoint && (endpoint.startsWith('/admin') || endpoint.includes('/admin/'));
    const adminToken = this.getAdminToken();
    const customerToken = this.getCustomerToken();

    if (isAdminRoute && adminToken) {
      headers = headers.set('Authorization', `Bearer ${adminToken}`);
    } else if (customerToken) {
      headers = headers.set('Authorization', `Bearer ${customerToken}`);
    } else if (adminToken) {
      headers = headers.set('Authorization', `Bearer ${adminToken}`);
    }

    return headers;
  }

  // Error handler
  private handleError(error: any) {
    console.error('API Error details:', error);
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Trigger window event if 401 Unauthorized for logout
    if (error.status === 401) {
      const isUrlAdmin = error.url && (error.url.includes('/admin/') || error.url.includes('/admin'));
      if (isUrlAdmin) {
        localStorage.removeItem('admin_token');
        window.dispatchEvent(new Event('admin-logout'));
      } else {
        localStorage.removeItem('customer_token');
        window.dispatchEvent(new Event('customer-logout'));
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  // HTTP wrapper methods
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(endpoint),
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const isMultipart = body instanceof FormData;
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders(endpoint, isMultipart),
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const isMultipart = body instanceof FormData;
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders(endpoint, isMultipart),
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const isMultipart = body instanceof FormData;
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders(endpoint, isMultipart),
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(endpoint),
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  // Dedicated upload helper for public manual payment screenshot
  uploadPaymentScreenshot(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<ApiResponseWrapper<any>>('/upload/payment-screenshot', formData).pipe(
      map((res) => res.data.url)
    );
  }

  // Dedicated upload helper for admin product images
  uploadProductImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<ApiResponseWrapper<any>>('/admin/upload/product-image', formData).pipe(
      map((res) => res.data.url)
    );
  }
}

// Global safe helper to build absolute image asset links with placeholders
export function getImageUrl(path?: any, fallback = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop'): string {
  if (!path) return fallback;

  // Extract URL if database contains a corrupt object due to the previous upload bug
  if (typeof path === 'object' && path !== null) {
    if ('url' in path) {
      path = path.url;
    } else {
      return fallback;
    }
  }

  if (typeof path !== 'string') return fallback;
  if (path.startsWith('http')) return path;
  return `http://localhost:3000${path}`;
}

