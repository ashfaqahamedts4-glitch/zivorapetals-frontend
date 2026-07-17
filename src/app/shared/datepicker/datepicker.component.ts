import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css'
})
export class DatepickerComponent implements OnInit {
  @Input() selectedDate = ''; // YYYY-MM-DD
  @Input() placeholder = 'Select Date';
  @Output() selectedDateChange = new EventEmitter<string>();

  isOpen = false;
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth(); // 0-indexed
  daysInMonth: (number | null)[] = [];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  yearOptions: number[] = [];

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    const startYear = 2018;
    const endYear = 2038;
    for (let y = startYear; y <= endYear; y++) {
      this.yearOptions.push(y);
    }
    if (this.selectedDate) {
      const date = new Date(this.selectedDate);
      if (!isNaN(date.getTime())) {
        this.currentYear = date.getFullYear();
        this.currentMonth = date.getMonth();
      }
    }
    this.generateCalendar();
  }

  get displayValue(): string {
    if (!this.selectedDate) return '';
    const date = new Date(this.selectedDate);
    if (isNaN(date.getTime())) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }

  toggleCalendar(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.selectedDate) {
        const date = new Date(this.selectedDate);
        if (!isNaN(date.getTime())) {
          this.currentYear = date.getFullYear();
          this.currentMonth = date.getMonth();
        }
      }
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    this.daysInMonth = [];
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    // Fill offset slots before 1st day
    for (let i = 0; i < firstDayIndex; i++) {
      this.daysInMonth.push(null);
    }

    // Fill days of the month
    for (let day = 1; day <= totalDays; day++) {
      this.daysInMonth.push(day);
    }
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  selectDay(day: number | null): void {
    if (!day) return;
    const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.selectedDate = dateStr;
    this.selectedDateChange.emit(this.selectedDate);
    this.isOpen = false;
  }

  selectToday(): void {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectedDate = dateStr;
    this.selectedDateChange.emit(this.selectedDate);
    this.isOpen = false;
  }

  clearDate(): void {
    this.selectedDate = '';
    this.selectedDateChange.emit('');
    this.isOpen = false;
  }

  isDaySelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    const date = new Date(this.selectedDate);
    return date.getFullYear() === this.currentYear &&
           date.getMonth() === this.currentMonth &&
           date.getDate() === day;
  }

  onMonthChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentMonth = parseInt(target.value, 10);
    this.generateCalendar();
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.currentYear = parseInt(target.value, 10);
    this.generateCalendar();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
