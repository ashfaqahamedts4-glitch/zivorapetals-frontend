import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  pendingVerificationOrders?: Order[];
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
  orderNumber?: string;
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

import { ModalComponent } from '../../../shared/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../shared/dropdown/dropdown.component';
import { DatepickerComponent } from '../../../shared/datepicker/datepicker.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, AsyncPipe, FormsModule, DatePipe, DecimalPipe, ModalComponent, DropdownComponent, DatepickerComponent],
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

  // Orders pagination and filters
  orderPage = 1;
  orderLimit = 10;
  orderTotal = 0;
  orderSearch = '';
  orderStatusFilter = '';
  orderPaymentStatusFilter = '';
  orderStartDateFilter = '';
  orderEndDateFilter = '';

  shippingStatusOptions: DropdownOption[] = [
    { value: '', label: 'All Shipping Statuses' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  paymentStatusOptions: DropdownOption[] = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'Pending Verification', label: 'Pending Verification' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Rejected', label: 'Rejected' }
  ];

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
  isUpdatingPayment = false;
  isUpdatingStatus = false;
  // Mobile UI state
  isSidebarOpen = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (!this.apiService.getAdminToken()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // Set default date range to last 1 month
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30); // 30 days ago

    this.orderStartDateFilter = this.formatDate(oneMonthAgo);
    this.orderEndDateFilter = this.formatDate(today);

    // Read the query parameter tab to restore state on reload
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      const validTabs = ['metrics', 'categories', 'products', 'orders', 'banners', 'settings'];
      if (tab && validTabs.includes(tab)) {
        if (this.currentTab !== tab) {
          this.switchTab(tab as any);
        } else {
          this.loadTabContents(tab as any);
        }
      } else {
        if (this.currentTab !== 'metrics') {
          this.switchTab('metrics');
        } else {
          this.loadTabContents('metrics');
        }
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  switchTab(tab: 'metrics' | 'categories' | 'products' | 'orders' | 'banners' | 'settings'): void {
    this.currentTab = tab;
    this.selectedCategory = null;
    this.selectedProduct = null;

    // Update query parameter without page reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });

    this.loadTabContents(tab);
  }

  loadTabContents(tab: 'metrics' | 'categories' | 'products' | 'orders' | 'banners' | 'settings'): void {
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

  loadOrders(): void {
    let url = `/admin/orders?page=${this.orderPage}&limit=${this.orderLimit}`;
    if (this.orderSearch) {
      url += `&search=${encodeURIComponent(this.orderSearch)}`;
    }
    if (this.orderStatusFilter) {
      url += `&orderStatus=${encodeURIComponent(this.orderStatusFilter)}`;
    }
    if (this.orderPaymentStatusFilter) {
      url += `&paymentStatus=${encodeURIComponent(this.orderPaymentStatusFilter)}`;
    }
    if (this.orderStartDateFilter) {
      url += `&startDate=${encodeURIComponent(this.orderStartDateFilter)}`;
    }
    if (this.orderEndDateFilter) {
      url += `&endDate=${encodeURIComponent(this.orderEndDateFilter)}`;
    }

    this.apiService.get<any>(url).subscribe({
      next: (res) => {
        this.orders = res.data || [];
        if (res.pagination) {
          this.orderTotal = res.pagination.total || 0;
          this.orderPage = res.pagination.page || 1;
          this.orderLimit = res.pagination.limit || 10;
        } else {
          this.orderTotal = this.orders.length;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cartService.showToast(err.message || 'Failed to load orders', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  onOrderSearch(): void {
    this.orderPage = 1;
    this.loadOrders();
  }

  onOrderFilterChange(): void {
    this.orderPage = 1;
    this.loadOrders();
  }

  onOrderPageChange(page: number): void {
    if (page < 1 || page > this.getTotalOrderPages()) return;
    this.orderPage = page;
    this.loadOrders();
  }

  getTotalOrderPages(): number {
    return Math.ceil(this.orderTotal / this.orderLimit) || 1;
  }

  clearOrderFilters(): void {
    this.orderSearch = '';
    this.orderStatusFilter = '';
    this.orderPaymentStatusFilter = '';
    this.orderStartDateFilter = '';
    this.orderEndDateFilter = '';
    this.orderPage = 1;
    this.loadOrders();
  }

  exportOrdersToCSV(): void {
    this.cartService.showToast('Generating CSV export, please wait...', 'info');
    let url = `/admin/orders?page=1&limit=${this.orderTotal || 1000}`;
    if (this.orderSearch) {
      url += `&search=${encodeURIComponent(this.orderSearch)}`;
    }
    if (this.orderStatusFilter) {
      url += `&orderStatus=${encodeURIComponent(this.orderStatusFilter)}`;
    }
    if (this.orderPaymentStatusFilter) {
      url += `&paymentStatus=${encodeURIComponent(this.orderPaymentStatusFilter)}`;
    }
    if (this.orderStartDateFilter) {
      url += `&startDate=${encodeURIComponent(this.orderStartDateFilter)}`;
    }
    if (this.orderEndDateFilter) {
      url += `&endDate=${encodeURIComponent(this.orderEndDateFilter)}`;
    }

    this.apiService.get<any>(url).subscribe({
      next: (res) => {
        const exportData = res.data || [];
        if (exportData.length === 0) {
          this.cartService.showToast('No orders found to export', 'error');
          return;
        }
        this.downloadCSV(exportData);
      },
      error: (err) => {
        this.cartService.showToast(err.message || 'Failed to export orders', 'error');
      }
    });
  }

  downloadCSV(orders: Order[]): void {
    const headers = [
      'Order Reference ID',
      'Customer Name',
      'Mobile',
      'Email',
      'Total Value (INR)',
      'Payment Status',
      'Shipping Status',
      'Placed Date',
      'Shipping Address',
      'Product Items'
    ];

    const rows = orders.map(order => {
      const addr = order.shippingAddress;
      const addressStr = `"${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}"`;
      const itemsStr = `"${order.items.map(item => `${item.name} (${item.sku}) x${item.quantity}`).join('; ')}"`;
      const placedDate = new Date(order.createdAt).toLocaleString();
      return [
        order.orderNumber || order._id,
        order.customerDetails.name,
        order.customerDetails.mobile,
        order.customerDetails.email,
        order.totalAmount,
        order.paymentStatus,
        order.orderStatus,
        placedDate,
        addressStr,
        itemsStr
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Zivora_Orders_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.cartService.showToast('CSV report downloaded successfully', 'success');
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
    if (!this.selectedOrder || this.isUpdatingPayment) return;
    this.isUpdatingPayment = true;
    this.cartService.showToast('Processing payment verification and email, please wait...', 'info');
    this.cdr.detectChanges();

    this.apiService
      .post<ApiResponseWrapper<any>>(`/admin/orders/${this.selectedOrder._id}/verify-payment`, { status })
      .subscribe({
        next: (res) => {
          this.isUpdatingPayment = false;
          this.cartService.showToast(`Payment receipt status updated to: ${status}`, 'success');
          this.selectedOrder = res.data;
          this.loadOrders();
          this.loadDashboardStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUpdatingPayment = false;
          this.cartService.showToast(err.message, 'error');
          this.cdr.detectChanges();
        },
      });
  }

  updateOrderStatus(status: string): void {
    if (!this.selectedOrder || this.isUpdatingStatus) return;
    this.isUpdatingStatus = true;
    this.cartService.showToast('Updating shipping status, please wait...', 'info');
    this.cdr.detectChanges();

    this.apiService
      .patch<ApiResponseWrapper<any>>(`/admin/orders/${this.selectedOrder._id}/status`, { orderStatus: status })
      .subscribe({
        next: (res) => {
          this.isUpdatingStatus = false;
          this.cartService.showToast(`Shipping order status changed to: ${status}`, 'success');
          this.selectedOrder = res.data;
          this.loadOrders();
          this.loadDashboardStats();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUpdatingStatus = false;
          this.cartService.showToast(err.message, 'error');
          this.cdr.detectChanges();
        },
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
