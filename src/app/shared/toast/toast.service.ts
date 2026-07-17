import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$: Observable<ToastMessage[]> = this.toastsSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { message, type, id };
    
    let current = this.toastsSubject.value;
    
    // Clear any active 'info' loading toasts when success or error details are presented
    if (type === 'success' || type === 'error') {
      current = current.filter((t) => t.type !== 'info');
    }
    
    this.toastsSubject.next([...current, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, 4000);
  }

  dismiss(id: string): void {
    const filtered = this.toastsSubject.value.filter((t) => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
