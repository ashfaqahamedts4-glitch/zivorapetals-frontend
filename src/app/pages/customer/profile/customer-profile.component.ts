import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerAuthService, Customer } from '../../../services/customer-auth.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.css',
})
export class CustomerProfileComponent implements OnInit {
  customer: Customer | null = null;
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Form Fields
  email = '';
  profilePassword = '';
  name = '';
  mobile = '';
  addressLine1 = '';
  addressLine2 = '';
  city = '';
  state = '';
  pincode = '';
  landmark = '';

  constructor(
    private readonly authService: CustomerAuthService,
    private readonly cartService: CartService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.customer$.subscribe((cust) => {
      this.customer = cust;
      if (cust) {
        this.email = cust.email || '';
        this.name = cust.name || '';
        this.mobile = cust.mobile || '';
        if (cust.shippingAddress) {
          this.addressLine1 = cust.shippingAddress.addressLine1 || '';
          this.addressLine2 = cust.shippingAddress.addressLine2 || '';
          this.city = cust.shippingAddress.city || '';
          this.state = cust.shippingAddress.state || '';
          this.pincode = cust.shippingAddress.pincode || '';
          this.landmark = cust.shippingAddress.landmark || '';
        }
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.successMessage = null;
    this.errorMessage = null;

    if (this.loading) {
      this.cartService.showToast('Please wait, updating your profile...', 'info');
      return;
    }

    if (!this.name || !this.mobile || !this.email) {
      this.errorMessage = 'Email, name and mobile number are required.';
      this.cartService.showToast(this.errorMessage || 'Validation error', 'error');
      this.cdr.detectChanges();
      return;
    }

    if (this.email !== this.customer?.email && !this.profilePassword) {
      this.errorMessage = 'Current password is required to change your email address.';
      this.cartService.showToast(this.errorMessage || 'Validation error', 'error');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cartService.showToast('Saving your profile changes, please wait...', 'info');
    this.cdr.detectChanges();

    const payload: any = {
      name: this.name,
      mobile: this.mobile,
      shippingAddress: {
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        city: this.city,
        state: this.state,
        pincode: this.pincode,
        landmark: this.landmark,
      },
    };

    if (this.email !== this.customer?.email) {
      payload.email = this.email;
      payload.password = this.profilePassword;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.cartService.showToast('Profile updated successfully!', 'success');
        this.successMessage = 'Profile updated successfully!';
        this.profilePassword = '';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to update profile. Please try again.';
        this.cartService.showToast(this.errorMessage || 'Profile update failed', 'error');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
