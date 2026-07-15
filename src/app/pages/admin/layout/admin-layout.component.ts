import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, NgClass, AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../../services/api.service';
import { CartService } from '../../../services/cart.service';

interface DashboardStats {
  totalOrders: number;
  paidOrders: number;
  pendingVerifications: number;
  totalProducts: number;
  totalCategories: number;
  totalRevenue: number;
}

interface Category {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  displayOrder: number;
}

interface Product {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: any; // ID or object
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnail: string;
  description: string;
  shortDescription: string;
  isActive: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  tags?: string[];
  images?: string[];
}

interface OrderItem {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

interface Order {
  _id: string;
  customerDetails: {
    name: string;
    mobile: string;
    email: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  paymentScreenshot: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface Banner {
  _id?: string;
  title: string;
  image: string;
  redirectLink: string;
  isActive: boolean;
}

interface Testimonial {
  _id?: string;
  customerName: string;
  review: string;
  rating: number;
  image: string;
}

interface Settings {
  companyName: string;
  companyLogo: string;
  upiId: string;
  upiQrCode: string;
  contactNumber: string;
  email: string;
  address: string;
  socialMediaLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, AsyncPipe, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit {
  readonly getImageUrl = getImageUrl;
  currentTab: 'metrics' | 'categories' | 'products' | 'orders' | 'banners' | 'settings' = 'metrics';
  
  // Dashboard Metrics
  stats: DashboardStats | null = null;
  
  // Lists
  categories: Category[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  banners: Banner[] = [];
  testimonials: Testimonial[] = [];
  settings: Settings | null = null;

  // Active form models
  selectedCategory: Category | null = null;
  selectedProduct: Product | null = null;
  selectedOrder: Order | null = null;
  
  // Banners & Testimonials models
  newBanner: Banner = { title: '', image: '', redirectLink: '', isActive: true };
  newTestimonial: Testimonial = { customerName: '', review: '', rating: 5, image: '' };

  // File Upload states
  uploadingImage = false;
  zoomImageSrc: string | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.apiService.getAdminToken()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // Load initial metrics tab
    this.switchTab('metrics');
  }

  switchTab(tab: 'metrics' | 'categories' | 'products' | 'orders' | 'banners' | 'settings'): void {
    this.currentTab = tab;
    this.selectedCategory = null;
    this.selectedProduct = null;

    if (tab === 'metrics') {
      this.loadDashboardStats();
    } else if (tab === 'categories') {
      this.loadCategories();
    } else if (tab === 'products') {
      this.loadProducts();
      this.loadCategories(); // Loaded for category picker dropdown
    } else if (tab === 'orders') {
      this.loadOrders();
    } else if (tab === 'banners') {
      this.loadBanners();
      this.loadTestimonials();
    } else if (tab === 'settings') {
      this.loadSettings();
    }
  }

  // --- Loader Operations ---

  private loadDashboardStats(): void {
    this.apiService.get<ApiResponseWrapper<DashboardStats>>('/admin/dashboard').subscribe({
      next: (res) => {
        this.stats = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  private loadCategories(): void {
    this.apiService.get<ApiResponseWrapper<Category[]>>('/admin/categories').subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadProducts(): void {
    this.apiService.get<any>('/admin/products?limit=50').subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadOrders(): void {
    this.apiService.get<ApiResponseWrapper<Order[]>>('/admin/orders?limit=100').subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadBanners(): void {
    this.apiService.get<ApiResponseWrapper<Banner[]>>('/banners').subscribe({
      next: (res) => {
        this.banners = res.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadTestimonials(): void {
    this.apiService.get<ApiResponseWrapper<Testimonial[]>>('/testimonials').subscribe({
      next: (res) => {
        this.testimonials = res.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadSettings(): void {
    this.apiService.get<ApiResponseWrapper<Settings>>('/settings').subscribe({
      next: (res) => {
        this.settings = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  // --- Category Operations ---

  openAddCategory(): void {
    this.selectedCategory = {
      name: '',
      slug: '',
      description: '',
      image: '/uploads/products/default.jpg',
      isActive: true,
      displayOrder: 1,
    };
  }

  openEditCategory(cat: Category): void {
    this.selectedCategory = { ...cat };
  }

  saveCategory(): void {
    if (!this.selectedCategory) return;
    
    // Auto generate slug from name if empty
    if (!this.selectedCategory.slug) {
      this.selectedCategory.slug = this.selectedCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const { _id, __v, createdAt, updatedAt, ...payload } = this.selectedCategory as any;

    const request$ = this.selectedCategory._id
      ? this.apiService.put<ApiResponseWrapper<Category>>(`/admin/categories/${this.selectedCategory._id}`, payload)
      : this.apiService.post<ApiResponseWrapper<Category>>('/admin/categories', payload);

    request$.subscribe({
      next: () => {
        this.cartService.showToast('Category saved successfully', 'success');
        this.selectedCategory = null;
        this.loadCategories();
      },
      error: (err) => this.cartService.showToast(err.message || 'Failed to save category', 'error'),
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.apiService.delete(`/admin/categories/${id}`).subscribe({
        next: () => {
          this.cartService.showToast('Category deleted', 'info');
          this.loadCategories();
        },
        error: (err) => this.cartService.showToast(err.message, 'error'),
      });
    }
  }

  // --- Product Operations ---

  openAddProduct(): void {
    this.selectedProduct = {
      name: '',
      slug: '',
      sku: '',
      categoryId: '',
      price: 0,
      discountPrice: 0,
      stock: 50,
      thumbnail: '/uploads/products/default.jpg',
      description: '',
      shortDescription: '',
      isActive: true,
      featured: false,
      newArrival: true,
      bestSeller: false,
    };
  }

  openEditProduct(prod: Product): void {
    // Extract ID string if populated as object
    const catId = prod.categoryId && typeof prod.categoryId === 'object' ? prod.categoryId._id : prod.categoryId;
    this.selectedProduct = { ...prod, categoryId: catId };
  }

  saveProduct(): void {
    if (!this.selectedProduct) return;

    if (!this.selectedProduct.slug) {
      this.selectedProduct.slug = this.selectedProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    // Split tags csv if provided as a string in standard forms
    if (this.selectedProduct.tags && typeof this.selectedProduct.tags === 'string') {
      this.selectedProduct.tags = (this.selectedProduct.tags as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const { _id, __v, createdAt, updatedAt, ...payload } = this.selectedProduct as any;

    const request$ = this.selectedProduct._id
      ? this.apiService.put<ApiResponseWrapper<Product>>(`/admin/products/${this.selectedProduct._id}`, payload)
      : this.apiService.post<ApiResponseWrapper<Product>>('/admin/products', payload);

    request$.subscribe({
      next: () => {
        this.cartService.showToast('Product saved successfully', 'success');
        this.selectedProduct = null;
        this.loadProducts();
      },
      error: (err) => this.cartService.showToast(err.message || 'Failed to save product', 'error'),
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.apiService.delete(`/admin/products/${id}`).subscribe({
        next: () => {
          this.cartService.showToast('Product deleted', 'info');
          this.loadProducts();
        },
        error: (err) => this.cartService.showToast(err.message, 'error'),
      });
    }
  }

  // --- Order Operations ---

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrderDetails(): void {
    this.selectedOrder = null;
  }

  verifyPayment(status: 'Paid' | 'Rejected'): void {
    if (!this.selectedOrder) return;
    this.apiService
      .post<ApiResponseWrapper<any>>(`/admin/orders/${this.selectedOrder._id}/verify-payment`, { status })
      .subscribe({
        next: (res) => {
          this.cartService.showToast(`Payment receipt status updated to: ${status}`, 'success');
          // Update local modal data
          this.selectedOrder = res.data;
          this.loadOrders();
        },
        error: (err) => this.cartService.showToast(err.message, 'error'),
      });
  }

  updateOrderStatus(status: string): void {
    if (!this.selectedOrder) return;
    this.apiService
      .patch<ApiResponseWrapper<any>>(`/admin/orders/${this.selectedOrder._id}/status`, { orderStatus: status })
      .subscribe({
        next: (res) => {
          this.cartService.showToast(`Shipping order status changed to: ${status}`, 'success');
          this.selectedOrder = res.data;
          this.loadOrders();
        },
        error: (err) => this.cartService.showToast(err.message, 'error'),
      });
  }

  // --- Banners & Testimonials Operations ---

  saveBanner(): void {
    if (!this.newBanner.title || !this.newBanner.image) {
      this.cartService.showToast('Please provide a title and promotional image path.', 'error');
      return;
    }
    this.apiService.post<any>('/admin/banners', this.newBanner).subscribe({
      next: () => {
        this.cartService.showToast('Promo banner successfully created', 'success');
        this.newBanner = { title: '', image: '', redirectLink: '', isActive: true };
        this.loadBanners();
      },
    });
  }

  saveTestimonial(): void {
    if (!this.newTestimonial.customerName || !this.newTestimonial.review) {
      this.cartService.showToast('Please specify a client name and feedback comments.', 'error');
      return;
    }
    this.apiService.post<any>('/admin/testimonials', this.newTestimonial).subscribe({
      next: () => {
        this.cartService.showToast('Client testimony saved', 'success');
        this.newTestimonial = { customerName: '', review: '', rating: 5, image: '' };
        this.loadTestimonials();
      },
    });
  }

  // --- Settings Update ---

  saveSettings(): void {
    if (!this.settings) return;
    const { _id, __v, createdAt, updatedAt, ...payload } = this.settings as any;
    this.apiService.put<any>('/settings', payload).subscribe({
      next: () => {
        this.cartService.showToast('System configuration settings saved', 'success');
        this.loadSettings();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cartService.showToast(err.message, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  // --- File uploads handlers ---

  onUploadFile(event: any, type: 'category' | 'product' | 'settingsLogo' | 'settingsQr' | 'banner' | 'testimonial'): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingImage = true;
    
    // Choose service upload context based on panel
    const upload$ = (type === 'settingsLogo' || type === 'settingsQr' || type === 'category' || type === 'product' || type === 'banner' || type === 'testimonial')
      ? this.apiService.uploadProductImage(file)
      : this.apiService.uploadPaymentScreenshot(file);

    upload$.subscribe({
      next: (uploadedPath) => {
        if (type === 'category' && this.selectedCategory) {
          this.selectedCategory.image = uploadedPath;
        } else if (type === 'product' && this.selectedProduct) {
          this.selectedProduct.thumbnail = uploadedPath;
        } else if (type === 'settingsLogo' && this.settings) {
          this.settings.companyLogo = uploadedPath;
        } else if (type === 'settingsQr' && this.settings) {
          this.settings.upiQrCode = uploadedPath;
        } else if (type === 'banner') {
          this.newBanner.image = uploadedPath;
        } else if (type === 'testimonial') {
          this.newTestimonial.image = uploadedPath;
        }
        this.cartService.showToast('Image uploaded successfully', 'success');
        this.uploadingImage = false;
      },
      error: (err) => {
        this.cartService.showToast(err.message || 'File upload failed', 'error');
        this.uploadingImage = false;
      },
    });
  }

  // --- Auth Session ---

  logout(): void {
    localStorage.removeItem('admin_token');
    this.cartService.showToast('Logged out of admin console', 'info');
    this.router.navigate(['/admin/login']);
  }

  // --- Zoom Preview ---
  openZoomImage(src: string): void {
    this.zoomImageSrc = src;
  }
  closeZoomImage(): void {
    this.zoomImageSrc = null;
  }

  // Get name of category safely
  getCategoryName(catId: any): string {
    if (!catId) return 'N/A';
    if (typeof catId === 'object') return catId.name;
    const cat = this.categories.find((c) => c._id === catId);
    return cat ? cat.name : 'Gifts';
  }
}
