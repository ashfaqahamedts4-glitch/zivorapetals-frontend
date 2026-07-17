import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly STORAGE_KEY = 'zivora_wishlist';
  private wishlistSubject = new BehaviorSubject<string[]>([]);

  constructor() {
    this.loadWishlist();
  }

  get wishlist$(): Observable<string[]> {
    return this.wishlistSubject.asObservable();
  }

  getWishlist(): string[] {
    return this.wishlistSubject.value;
  }

  isInWishlist(productId: string): boolean {
    return this.getWishlist().includes(productId);
  }

  toggleWishlist(productId: string): boolean {
    const current = [...this.getWishlist()];
    const index = current.indexOf(productId);
    let added = false;

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(productId);
      added = true;
    }

    this.wishlistSubject.next(current);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
    return added;
  }

  private loadWishlist(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.wishlistSubject.next(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading wishlist from storage:', e);
    }
  }
}
