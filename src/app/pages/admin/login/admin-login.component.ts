import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponseWrapper } from '../../../services/api.service';
import { CartService } from '../../../services/cart.service';

interface LoginResponse {
  accessToken: string;
}

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent implements OnInit {
  email = 'admin@zivora.com'; // Default seeded admin email
  password = '';
  loading = false;
  error: string | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.apiService.getAdminToken()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.error = null;

    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.apiService
      .post<ApiResponseWrapper<LoginResponse>>('/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          if (res.data && res.data.accessToken) {
            localStorage.setItem('admin_token', res.data.accessToken);
            this.cartService.showToast('Successfully logged in as administrator', 'success');
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.error = 'Invalid authentication response structure.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = err.message || 'Invalid email or password.';
          this.loading = false;
        },
      });
  }
}
