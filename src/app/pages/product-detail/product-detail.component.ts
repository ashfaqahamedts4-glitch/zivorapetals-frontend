import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService, Product } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgClass, AsyncPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  readonly Math = Math;
  readonly getImageUrl = getImageUrl;
  product: Product | null = null;
  loading = true;
  error: string | null = null;

  // Gallery state
  selectedImage = '';
  gallery: string[] = [];

  // Quantity and Tab settings
  quantity = 1;
  activeTab: 'description' | 'details' = 'description';
  addingToCart = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const slug = params['slug'];
      if (slug) {
        this.fetchProductDetails(slug);
      }
      this.cdr.detectChanges();
    });
  }

  private fetchProductDetails(slug: string): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.apiService.get<ApiResponseWrapper<Product>>(`/products/${slug}`).subscribe({
      next: (res) => {
        this.product = res.data;
        if (this.product) {
          this.selectedImage = this.product.thumbnail;
          this.gallery = [this.product.thumbnail, ...(this.product.images || [])].filter(Boolean);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = err.message || 'Product details not found.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  handleQtyChange(delta: number): void {
    if (!this.product) return;
    const targetQty = this.quantity + delta;
    if (targetQty >= 1 && targetQty <= this.product.stock) {
      this.quantity = targetQty;
    }
  }

  handleAddToBag(): void {
    if (!this.product) return;
    this.addingToCart = true;

    // Add to cart in service, service manages success alerts automatically
    this.cartService.addToCart(this.product._id, this.quantity);

    // Reset loader after small timeout
    setTimeout(() => {
      this.addingToCart = false;
    }, 800);
  }

  selectImage(imgUrl: string): void {
    this.selectedImage = imgUrl;
  }

  setActiveTab(tab: 'description' | 'details'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/shop']);
  }

  onImageError(event: any, fallbackUrl = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop'): void {
    event.target.src = fallbackUrl;
  }
}
