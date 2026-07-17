import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div 
      [ngStyle]="{
        'width': (width === '42%' || width === 'auto') ? width : width + 'px', 
        'height': (height === 'auto') ? height : height + 'px'
      }" 
      style="overflow: hidden; position: relative; display: inline-flex; align-items: center; justify-content: center;"
    >
      <img
        src="assets/logo.jpg"
        [ngStyle]="{
          'width': '42%',
          'height': 'auto',
          'transform': 'scale(1.85)',
          'transform-origin': 'center center',
          'mix-blend-mode': invert ? 'normal' : 'multiply'
        }"
        alt="Zivora Petals"
      />
    </div>
  `,
})
export class LogoComponent {
  @Input() width: string | number = '100%';
  @Input() height: string | number = 'auto';
  @Input() textColor = '#610B24';
  @Input() bowColor = '#610B24';
  @Input() invert = false;
}
