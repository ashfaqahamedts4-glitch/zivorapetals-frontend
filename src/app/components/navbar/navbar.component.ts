import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
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
  showAccountDropdown = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAccountDropdown();
  }

  constructor(
    public readonly cartService: CartService,
    public readonly authService: CustomerAuthService
  ) {}

  onToggleCart(): void {
    this.toggleCart.emit();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleAccountDropdown(event: Event): void {
    event.stopPropagation();
    this.showAccountDropdown = !this.showAccountDropdown;
  }

  closeAccountDropdown(): void {
    this.showAccountDropdown = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.closeAccountDropdown();
    this.closeMobileMenu();
  }
}
