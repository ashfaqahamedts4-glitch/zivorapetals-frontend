import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponseWrapper, getImageUrl } from '../../services/api.service';
import { CartService, Product } from '../../services/cart.service';
import { LogoComponent } from '../../components/logo/logo.component';

interface Banner {
  _id: string;
  title: string;
  image: string;
  redirectLink: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

interface Testimonial {
  _id: string;
  customerName: string;
  review: string;
  rating: number;
  image: string;
}

interface Settings {
  _id?: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  upiId: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, AsyncPipe, FormsModule, LogoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly getImageUrl = getImageUrl;
  readonly Math = Math;
  banners: Banner[] = [];
  categories: Category[] = [];
  featuredProducts: Product[] = [];
  testimonials: Testimonial[] = [];
  settings: Settings | null = null;

  activeBanner = 0;
  loading = true;
  private bannerInterval: any;

  // Contact Form Model
  contactModel = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  sendingContact = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly cartService: CartService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  submitContactForm(): void {
    if (!this.contactModel.name || !this.contactModel.email || !this.contactModel.message) {
      alert('Please fill in all required fields.');
      return;
    }
    this.sendingContact = true;
    setTimeout(() => {
      alert('Thank you for reaching out! Our design concierge will get back to you within 24 hours.');
      this.contactModel = { name: '', email: '', subject: '', message: '' };
      this.sendingContact = false;
      this.cdr.detectChanges();
    }, 1200);
  }

  ngOnInit(): void {
    this.fetchHomeData();
  }

  ngOnDestroy(): void {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  private fetchHomeData(): void {
    this.loading = true;
    console.log('HomeComponent: fetchHomeData initiated.');
    
    // Combine public requests using direct subscribers
    this.apiService.get<ApiResponseWrapper<Banner[]>>('/banners').subscribe({
      next: (res) => {
        console.log('HomeComponent: Banners received:', res);
        this.banners = res?.data || [];
        this.startBannerAutoplay();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Error fetching banners:', err);
        this.cdr.detectChanges();
      }
    });

    this.apiService.get<ApiResponseWrapper<Category[]>>('/categories').subscribe({
      next: (res) => {
        console.log('HomeComponent: Categories received:', res);
        this.categories = res?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Error fetching categories:', err);
        this.cdr.detectChanges();
      }
    });

    this.apiService.get<ApiResponseWrapper<Product[]>>('/products?featured=true&limit=8').subscribe({
      next: (res) => {
        console.log('HomeComponent: Featured products received:', res);
        this.featuredProducts = res?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Error fetching featured products:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('HomeComponent: Featured products completed.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    this.apiService.get<ApiResponseWrapper<Testimonial[]>>('/testimonials').subscribe({
      next: (res) => {
        console.log('HomeComponent: Testimonials received:', res);
        this.testimonials = res?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Error fetching testimonials:', err);
        this.cdr.detectChanges();
      }
    });

    this.apiService.get<ApiResponseWrapper<Settings>>('/settings').subscribe({
      next: (res) => {
        console.log('HomeComponent: Settings received:', res);
        this.settings = res?.data || null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('HomeComponent: Error fetching settings:', err);
      }
    });
  }

  // Banner autoplay
  private startBannerAutoplay(): void {
    if (this.banners.length > 1) {
      this.bannerInterval = setInterval(() => {
        this.nextBanner();
      }, 6000);
    }
  }

  nextBanner(): void {
    this.activeBanner = (this.activeBanner + 1) % (this.banners.length || 1);
  }

  prevBanner(): void {
    this.activeBanner = (this.activeBanner - 1 + (this.banners.length || 1)) % (this.banners.length || 1);
  }

  setBanner(index: number): void {
    this.activeBanner = index;
  }

  addToBag(product: Product): void {
    this.cartService.addToCart(product._id, 1);
  }

  onImageError(event: any, fallbackUrl: string): void {
    event.target.src = fallbackUrl;
  }

  getRatingArray(rating: number): number[] {
    return Array(rating || 5).fill(0);
  }
}
