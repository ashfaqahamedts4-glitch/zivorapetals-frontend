import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../../services/api.service';
import { CartService, Product } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-customer-wishlist',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor],
  templateUrl: './customer-wishlist.component.html',
  styleUrl: './customer-wishlist.component.css',
})
export class CustomerWishlistComponent implements OnInit {
  readonly getImageUrl = getImageUrl;
  wishlistProducts: Product[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.error = null;
    const wishlistIds = this.wishlistService.getWishlist();

    if (wishlistIds.length === 0) {
      this.wishlistProducts = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.apiService.get<any>('/products?page=1&limit=100').subscribe({
      next: (res) => {
        const allProducts: Product[] = res.data || [];
        this.wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p._id));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading wishlist products:', err);
        this.error = 'Failed to load wishlisted items. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeFromWishlist(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    this.wishlistService.toggleWishlist(product._id);
    this.wishlistProducts = this.wishlistProducts.filter((p) => p._id !== product._id);
    this.toastService.show(`${product.name} removed from wishlist.`, 'info');
    this.cdr.detectChanges();
  }

  addToBag(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    if (product.stock > 0) {
      this.cartService.addToCart(product._id, 1);
      this.toastService.show(`${product.name} added to cart!`, 'success');
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop';
  }
}
