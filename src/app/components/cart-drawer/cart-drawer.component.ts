import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { getImageUrl } from '../../services/api.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.css',
})
export class CartDrawerComponent {
  readonly getImageUrl = getImageUrl;
  @Input() isOpen = false;
  @Output() readonly closeCart = new EventEmitter<void>();

  constructor(
    public readonly cartService: CartService,
    private readonly router: Router
  ) {}

  onClose(): void {
    this.closeCart.emit();
  }

  proceedToCheckout(): void {
    this.onClose();
    this.router.navigate(['/checkout']);
  }

  // Handle image loading failures gracefully
  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop';
  }
}
