import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgStyle } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [NgIf, NgStyle],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  @Input() title = '';
  @Input() visible = false;
  @Input() maxWidth = '550px';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
