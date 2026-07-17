import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { CustomerAuthService } from '../../services/customer-auth.service';

interface Settings {
  upiId: string;
  upiQrCode: string;
  companyName: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, AsyncPipe, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  readonly getImageUrl = getImageUrl;
  // UPI Configs
  settings: Settings | null = null;
  checkoutLoading = false;
  successOrder: any = null;

  // Form parameters
  name = '';
  email = '';
  mobile = '';
  addressLine1 = '';
  addressLine2 = '';
  city = '';
  state = '';
  pincode = '';
  landmark = '';
  notes = '';

  // Screenshot upload status
  screenshotFile: File | null = null;
  screenshotUrl = '';
  uploadingFile = false;
  validationError: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly cartService: CartService,
    private readonly apiService: ApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    public readonly authService: CustomerAuthService
  ) { }

  ngOnInit(): void {
    // 1. Load settings
    this.apiService
      .get<ApiResponseWrapper<Settings>>('/settings')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.settings = res.data;
          this.cdr.detectChanges();
        },
      });

    // 2. Redirect if cart is empty on initialization
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe((cart) => {
      if (!this.successOrder && cart !== null && cart.items.length === 0) {
        // Wait briefly for first load state to clear
        setTimeout(() => {
          if (cart.items.length === 0) {
            this.router.navigate(['/shop']);
          }
        }, 100);
      }
    });

    // 3. Auto-fill from logged-in customer profile
    this.authService.customer$.pipe(takeUntil(this.destroy$)).subscribe((customer) => {
      if (customer) {
        this.name = this.name || customer.name || '';
        this.email = this.email || customer.email || '';
        this.mobile = this.mobile || customer.mobile || '';

        if (customer.shippingAddress) {
          this.addressLine1 = this.addressLine1 || customer.shippingAddress.addressLine1 || '';
          this.addressLine2 = this.addressLine2 || customer.shippingAddress.addressLine2 || '';
          this.city = this.city || customer.shippingAddress.city || '';
          this.state = this.state || customer.shippingAddress.state || '';
          this.pincode = this.pincode || customer.shippingAddress.pincode || '';
          this.landmark = this.landmark || customer.shippingAddress.landmark || '';
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle uploader trigger
  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadScreenshot(files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadScreenshot(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private uploadScreenshot(file: File): void {
    this.screenshotFile = file;
    this.validationError = null;
    this.uploadingFile = true;
    this.cartService.showToast('Uploading payment receipt screenshot...', 'info');
    this.cdr.detectChanges();

    this.apiService.uploadPaymentScreenshot(file).subscribe({
      next: (uploadedPath) => {
        this.screenshotUrl = uploadedPath;
        this.uploadingFile = false;
        this.cartService.showToast('Payment screenshot uploaded successfully!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.validationError = err.message || 'Failed to upload screenshot. Please try again.';
        this.cartService.showToast(this.validationError || 'Upload failed', 'error');
        this.screenshotFile = null;
        this.uploadingFile = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleCheckoutSubmit(event: Event): void {
    event.preventDefault();
    this.validationError = null;

    if (this.checkoutLoading) {
      this.cartService.showToast('Please wait, placing your order...', 'info');
      return;
    }

    if (!this.name || !this.email || !this.mobile || !this.addressLine1 || !this.city || !this.state || !this.pincode) {
      this.validationError = 'Please complete all required shipping fields.';
      this.cartService.showToast(this.validationError, 'error');
      return;
    }

    if (!this.screenshotUrl) {
      this.validationError = 'Please upload your UPI payment screenshot to proceed.';
      this.cartService.showToast(this.validationError, 'error');
      return;
    }

    this.checkoutLoading = true;
    this.cartService.showToast('Placing your order and sending confirmation email, please wait...', 'info');
    this.cdr.detectChanges();
    const payload = {
      customerDetails: {
        name: this.name,
        mobile: this.mobile,
        email: this.email,
      },
      shippingAddress: {
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        city: this.city,
        state: this.state,
        pincode: this.pincode,
        landmark: this.landmark,
      },
      notes: this.notes,
      paymentScreenshot: this.screenshotUrl,
    };

    this.apiService.post<ApiResponseWrapper<any>>('/orders/checkout', payload).subscribe({
      next: (res) => {
        this.successOrder = res.data;
        this.cartService.showToast('Order placed successfully! Check your email for confirmation.', 'success');
        this.cartService.clearCart(); // Wipes current guest cart on success
        this.checkoutLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        this.validationError = err.message || 'Checkout failed. Please verify inventory and try again.';
        this.cartService.showToast(this.validationError || 'Checkout failed', 'error');
        this.checkoutLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
