import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { CartService } from '../../../services/cart.service';
import { LogoComponent } from '../../../components/logo/logo.component';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, FormsModule, LogoComponent],
  templateUrl: './customer-login.component.html',
  styleUrl: './customer-login.component.css',
})
export class CustomerLoginComponent implements OnInit {
  isLoginMode = true;
  loading = false;
  error: string | null = null;
  returnUrl = '/';

  // Forms data
  email = '';
  password = '';
  name = '';
  mobile = '';

  constructor(
    private readonly authService: CustomerAuthService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Redirect if already logged in as admin
    if (localStorage.getItem('admin_token')) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    // Redirect if already logged in as customer
    this.authService.isLoggedIn$.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.error = null;
    this.cdr.detectChanges();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.error = null;

    if (this.loading) {
      this.cartService.showToast('Please wait, processing...', 'info');
      return;
    }

    if (!this.email || !this.password) {
      this.error = 'Email and password are required.';
      this.cartService.showToast(this.error, 'error');
      this.cdr.detectChanges();
      return;
    }

    if (!this.isLoginMode && (!this.name || !this.mobile)) {
      this.error = 'Name and mobile number are required.';
      this.cartService.showToast(this.error, 'error');
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cartService.showToast(this.isLoginMode ? 'Logging in, please wait...' : 'Registering account, please wait...', 'info');
    this.cdr.detectChanges();

    if (this.isLoginMode) {
      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          if (res.data && res.data.role === 'admin') {
            localStorage.setItem('admin_token', res.data.accessToken);
            this.cartService.showToast('Successfully logged in as administrator', 'success');
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.cartService.showToast('Successfully logged in!', 'success');
            this.router.navigateByUrl(this.returnUrl);
          }
        },
        error: (err) => {
          this.error = err.message || 'Login failed. Please check your credentials.';
          this.cartService.showToast(this.error || 'Login failed', 'error');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      const payload = {
        email: this.email,
        password: this.password,
        name: this.name,
        mobile: this.mobile,
      };
      this.authService.register(payload).subscribe({
        next: () => {
          this.loading = false;
          this.cartService.showToast('Account registered successfully!', 'success');
          this.router.navigateByUrl(this.returnUrl);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.message || 'Registration failed. Please try again.';
          this.cartService.showToast(this.error || 'Registration failed', 'error');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }
}
