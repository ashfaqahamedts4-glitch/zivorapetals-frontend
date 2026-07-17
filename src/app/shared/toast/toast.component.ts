import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnInit {
  constructor(public readonly toastService: ToastService) { }

  ngOnInit(): void { }

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  trackByToastId(index: number, toast: any): string {
    return toast.id;
  }
}
