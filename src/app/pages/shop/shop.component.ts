import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgFor, AsyncPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService, Product } from '../../services/cart.service';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, NgClass, AsyncPipe, FormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
})
export class ShopComponent implements OnInit, OnDestroy {
  readonly getImageUrl = getImageUrl;
  products: Product[] = [];
  categories: Category[] = [];
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Fetch categories
    this.apiService.get<ApiResponseWrapper<Category[]>>('/categories').subscribe({
      next: (res) => {
        this.categories = res?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching categories in shop:', err);
        this.cdr.detectChanges();
      }
    });

    // 2. Initial load from route snapshot parameters
    const snapshotParams = this.route.snapshot.queryParams;
    this.parseParams(snapshotParams);
    this.fetchCatalog();

    // 3. Listen to route query params to execute catalog reload on changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      // Avoid duplicate initial call if params are identical/empty
      if (Object.keys(params).length > 0) {
        this.parseParams(params);
        this.fetchCatalog();
      } else if (params && Object.keys(params).length === 0 && (this.search || this.categoryId || this.page !== 1)) {
        // Reset query state if params were cleared
        this.parseParams(params);
        this.fetchCatalog();
      }
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

  updateFilters(newParams: Record<string, string | number | null>): void {
    const updatedQueryParams = {
      ...this.route.snapshot.queryParams,
      ...newParams,
    };

    // Reset page to 1 when changing filters
    if (!('page' in newParams)) {
      updatedQueryParams['page'] = '1';
    }

    // Clean up empty filters
    Object.keys(updatedQueryParams).forEach((key) => {
      if (updatedQueryParams[key] === '' || updatedQueryParams[key] === null || updatedQueryParams[key] === undefined) {
        delete updatedQueryParams[key];
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: updatedQueryParams,
    });
  }

  handleSearchSubmit(event: Event): void {
    event.preventDefault();
    this.updateFilters({ search: this.searchInput });
  }

  handlePriceApply(event: Event): void {
    event.preventDefault();
    this.updateFilters({ minPrice: this.localMinPrice, maxPrice: this.localMaxPrice });
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

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop';
  }

  // Generate pagination links
  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
