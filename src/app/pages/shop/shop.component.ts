import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor, AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService, Product } from '../../services/cart.service';
import { ToastService } from '../../shared/toast/toast.service';
import { DropdownComponent, DropdownOption } from '../../shared/dropdown/dropdown.component';
import { WishlistService } from '../../services/wishlist.service';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgClass, AsyncPipe, FormsModule, DropdownComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
})
export class ShopComponent implements OnInit, OnDestroy {
  readonly getImageUrl = getImageUrl;
  readonly Math = Math;
  products: Product[] = [];
  categories: Category[] = [];
  categoryRows: { category: Category; products: Product[] }[] = [];
  categoryRowsLoading = false;
  loading = true;

  // Pagination totals
  totalPages = 1;
  totalProducts = 0;

  // Filter params
  page = 1;
  categoryId = '';
  search = '';
  sortBy = 'createdAt';
  sortOrder = 'desc';
  minPrice = '';
  maxPrice = '';

  // Local filter models
  searchInput = '';
  localMinPrice = '';
  localMaxPrice = '';
  showMobileFilters = false;
  categorySearchQuery = '';
  showOnlyWishlist = false;

  get wishlistCount(): number {
    return this.wishlistService.getWishlist().length;
  }

  get filteredCategories(): Category[] {
    if (!this.categorySearchQuery.trim()) {
      return this.categories;
    }
    const query = this.categorySearchQuery.toLowerCase().trim();
    return this.categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }

  sortOptions: DropdownOption[] = [
    { value: 'createdAt-desc', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Alphabetical: A-Z' },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastService: ToastService,
    private readonly ngZone: NgZone,
    private readonly wishlistService: WishlistService
  ) { }

  ngOnInit(): void {
    // 1. Fetch categories
    this.apiService.get<ApiResponseWrapper<Category[]>>('/categories').subscribe({
      next: (res) => {
        this.categories = res?.data || [];
        this.fetchCategoryRows();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching categories in shop:', err);
        this.cdr.detectChanges();
      }
    });

    // 2. Listen to route query params (emits immediately on subscription)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.ngZone.run(() => {
        this.parseParams(params);
        this.cdr.detectChanges();
        this.fetchCatalog();
      });
    });
  }

  private parseParams(params: any): void {
    this.page = parseInt(params['page'] || '1', 10);
    this.categoryId = params['category'] || '';
    this.search = params['search'] || '';
    this.sortBy = params['sortBy'] || 'createdAt';
    this.sortOrder = params['sortOrder'] || 'desc';
    this.minPrice = params['minPrice'] || '';
    this.maxPrice = params['maxPrice'] || '';
    this.showOnlyWishlist = params['wishlist'] === 'true';

    // Sync form models
    this.searchInput = this.search;
    this.localMinPrice = this.minPrice;
    this.localMaxPrice = this.maxPrice;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchCatalog(): void {
    this.loading = true;
    this.cdr.detectChanges();

    if (this.showOnlyWishlist) {
      const wishlistIds = this.wishlistService.getWishlist();
      if (wishlistIds.length === 0) {
        this.products = [];
        this.totalPages = 1;
        this.totalProducts = 0;
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      this.apiService.get<any>(`/products?page=1&limit=100`).subscribe({
        next: (res) => {
          const allProds: Product[] = res.data || [];
          this.products = allProds.filter((p) => wishlistIds.includes(p._id));
          this.totalPages = 1;
          this.totalProducts = this.products.length;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching wishlist products:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
      return;
    }

    // Construct query parameters
    const queryParts: string[] = [];
    queryParts.push(`page=${this.page}`);
    queryParts.push(`limit=9`);
    if (this.categoryId) queryParts.push(`categoryId=${this.categoryId}`);
    if (this.search) queryParts.push(`search=${encodeURIComponent(this.search)}`);
    if (this.sortBy) queryParts.push(`sortBy=${this.sortBy}`);
    if (this.sortOrder) queryParts.push(`sortOrder=${this.sortOrder}`);
    if (this.minPrice) queryParts.push(`minPrice=${this.minPrice}`);
    if (this.maxPrice) queryParts.push(`maxPrice=${this.maxPrice}`);

    this.apiService
      .get<any>(`/products?${queryParts.join('&')}`)
      .subscribe({
        next: (res) => {
          this.products = res.data || [];
          this.totalPages = res.pagination?.totalPages || 1;
          this.totalProducts = res.pagination?.total || 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching catalog:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private fetchCategoryRows(): void {
    if (this.categories.length === 0) return;
    this.categoryRowsLoading = true;
    this.categoryRows = [];
    let completed = 0;
    const rows: { category: Category; products: Product[] }[] = [];

    this.categories.forEach((cat, i) => {
      this.apiService.get<any>(`/products?categoryId=${cat._id}&limit=10&sortBy=createdAt&sortOrder=desc`).subscribe({
        next: (res) => {
          const prods: Product[] = res.data || [];
          if (prods.length > 0) {
            rows[i] = { category: cat, products: prods };
          }
          completed++;
          if (completed === this.categories.length) {
            // filter out empty slots, preserve category order
            this.categoryRows = rows.filter(Boolean);
            this.categoryRowsLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          completed++;
          if (completed === this.categories.length) {
            this.categoryRows = rows.filter(Boolean);
            this.categoryRowsLoading = false;
            this.cdr.detectChanges();
          }
        },
      });
    });
  }

  updateFilters(newParams: Record<string, any>): void {
    if (newParams['wishlist'] !== undefined) {
      this.showOnlyWishlist = newParams['wishlist'] === true || newParams['wishlist'] === 'true';
    } else if (newParams['category'] !== undefined) {
      this.showOnlyWishlist = false;
    }

    // Build updated queryParams from current class values + new values
    const queryParams: any = {
      page: newParams['page'] !== undefined ? newParams['page'] : 1,
      category: newParams['category'] !== undefined ? newParams['category'] : this.categoryId,
      search: newParams['search'] !== undefined ? newParams['search'] : this.search,
      sortBy: newParams['sortBy'] !== undefined ? newParams['sortBy'] : this.sortBy,
      sortOrder: newParams['sortOrder'] !== undefined ? newParams['sortOrder'] : this.sortOrder,
      minPrice: newParams['minPrice'] !== undefined ? newParams['minPrice'] : this.minPrice,
      maxPrice: newParams['maxPrice'] !== undefined ? newParams['maxPrice'] : this.maxPrice,
      wishlist: this.showOnlyWishlist ? 'true' : null,
    };

    // Clean up empty filters
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });
    this.loading = true;
    this.products = [];
    this.totalProducts = 0;

    this.cdr.detectChanges();

    this.ngZone.run(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: queryParams,
      });
    });
  }

  onSortChange(value: string): void {
    const parts = value.split('-');
    this.updateFilters({
      sortBy: parts[0],
      sortOrder: parts[1]
    });
  }

  toggleWishlistFilter(): void {
    this.updateFilters({ category: '', wishlist: !this.showOnlyWishlist, page: 1 });
  }

  handleSearchSubmit(event: Event): void {
    event.preventDefault();
    this.updateFilters({ search: this.searchInput });
  }

  handlePriceApply(event: Event): void {
    event.preventDefault();
    this.updateFilters({ minPrice: this.localMinPrice, maxPrice: this.localMaxPrice });
  }

  applyPriceFilter(event: Event): void {
    this.handlePriceApply(event);
  }

  getCategoryName(id: string): string {
    return this.categories.find((c) => c._id === id)?.name || '';
  }

  resetFilters(): void {
    this.searchInput = '';
    this.localMinPrice = '';
    this.localMaxPrice = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  handlePageChange(targetPage: number): void {
    if (targetPage >= 1 && targetPage <= this.totalPages) {
      this.updateFilters({ page: targetPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  addToBag(product: Product): void {
    this.cartService.addToCart(product._id, 1);
  }

  shareProduct(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    const shareUrl = `${window.location.origin}/product/${product.slug}`;

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || `Take a look at this beautiful gift: ${product.name}`,
        url: shareUrl
      }).then(() => {
        console.log('Product shared successfully');
      }).catch(err => {
        // If they close the native sharing dialog, it returns AbortError, which we ignore safely
        if (err.name !== 'AbortError') {
          console.error('Failed to share product:', err);
        }
      });
    } else {
      // Fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          this.toastService.show('Product link copied to clipboard!', 'success');
        }).catch(err => {
          console.error('Failed to copy text: ', err);
          this.toastService.show('Failed to copy link.', 'error');
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          this.toastService.show('Product link copied to clipboard!', 'success');
        } catch (err) {
          this.toastService.show('Failed to copy link.', 'error');
        }
        document.body.removeChild(textarea);
      }
    }
  }

  toggleWishlist(event: Event, product: Product): void {
    event.stopPropagation();
    event.preventDefault();
    const added = this.wishlistService.toggleWishlist(product._id);
    if (added) {
      this.toastService.show(`${product.name} added to wishlist!`, 'success');
    } else {
      this.toastService.show(`${product.name} removed from wishlist!`, 'info');
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop';
  }

  // Generate pagination links
  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
