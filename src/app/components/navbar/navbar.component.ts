import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe, NgIf, LogoComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @Output() readonly toggleCart = new EventEmitter<void>();

  mobileMenuOpen = false;

  constructor(public readonly cartService: CartService) {}

  onToggleCart(): void {
    this.toggleCart.emit();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
