import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';

export interface DropdownOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.css'
})
export class DropdownComponent {
  @Input() options: DropdownOption[] = [];
  @Input() selectedValue: any = null;
  @Input() placeholder = 'Select option';
  @Output() selectedValueChange = new EventEmitter<any>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.selectedValue);
    return selected ? selected.label : this.placeholder;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: DropdownOption): void {
    this.selectedValue = option.value;
    this.selectedValueChange.emit(this.selectedValue);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
