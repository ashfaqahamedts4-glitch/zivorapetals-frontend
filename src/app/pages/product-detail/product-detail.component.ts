import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService, Product } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../shared/toast/toast.service';

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

  // Related products
  relatedProducts: Product[] = [];
  relatedLoading = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService,
    private readonly toastService: ToastService,
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
    this.relatedProducts = [];
    this.cdr.detectChanges();

    this.apiService.get<ApiResponseWrapper<Product>>(`/products/${slug}`).subscribe({
      next: (res) => {
        this.product = res.data;
        if (this.product) {
          this.selectedImage = this.product.thumbnail;
          this.gallery = [this.product.thumbnail, ...(this.product.images || [])].filter(Boolean);
          // Fetch related products from same category
          this.fetchRelatedProducts();
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

  private fetchRelatedProducts(): void {
    if (!this.product) return;
    const catId = (this.product.categoryId as any)?._id || this.product.categoryId;
    if (!catId) return;

    this.relatedLoading = true;
    this.apiService.get<any>(`/products?category=${catId}&limit=8`).subscribe({
      next: (res) => {
        const all: Product[] = res.data?.products || res.data || [];
        // Exclude current product
        this.relatedProducts = all.filter((p) => p._id !== this.product!._id).slice(0, 6);
        this.relatedLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.relatedLoading = false;
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
    this.cartService.addToCart(this.product._id, this.quantity);
    setTimeout(() => {
      this.addingToCart = false;
    }, 800);
  }

  addRelatedToBag(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    if (product.stock > 0) {
      this.cartService.addToCart(product._id, 1);
      this.toastService.show(`${product.name} added to cart!`, 'success');
    }
  }

  toggleRelatedWishlist(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    const wasWishlisted = this.wishlistService.isInWishlist(product._id);
    this.wishlistService.toggleWishlist(product._id);
    this.toastService.show(wasWishlisted ? `Removed from wishlist` : `Added to wishlist!`, wasWishlisted ? 'info' : 'success');
    this.cdr.detectChanges();
  }

  isWishlisted(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  handleShareProduct(): void {
    if (!this.product) return;
    const shareData = {
      title: this.product.name,
      text: this.product.shortDescription || `Check out ${this.product.name} on Zivora!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => this.toastService.show('Product shared successfully!', 'success'))
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Error sharing:', err);
          }
        });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          this.toastService.show('Product link copied to clipboard!', 'success');
        })
        .catch((err) => {
          console.error('Clipboard copy failed:', err);
          this.toastService.show('Failed to copy link to clipboard.', 'error');
        });
    }
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
