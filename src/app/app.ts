import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, AsyncPipe, NavbarComponent, CartDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  isCartOpen = false;

  constructor(
    public readonly router: Router,
    public readonly cartService: CartService
  ) {}

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  // Helper to determine if we are currently inside the Admin Portal
  isAdminPage(): boolean {
    return this.router.url.startsWith('/admin');
  }
}
