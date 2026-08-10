import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessibilityService, ColorFilterType } from '../../services/accessibility.service';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accessibility-widget.component.html'
})
export class AccessibilityWidgetComponent {
  readonly a11y = inject(AccessibilityService);

  readonly filterOptions: { id: ColorFilterType; label: string; icon: string }[] = [
    { id: 'none', label: 'Normal', icon: '🎨' },
    { id: 'protanopia', label: 'Protanopía', icon: '🔴' },
    { id: 'deuteranopia', label: 'Deuteranopía', icon: '🟢' },
    { id: 'tritanopia', label: 'Tritanopía', icon: '🔵' },
    { id: 'monochrome', label: 'Escala Grises', icon: '⚪' },
    { id: 'high-contrast', label: 'Alto Contraste', icon: '🔆' },
    { id: 'inverted', label: 'Invertido', icon: '🌓' }
  ];

  readonly fontSizePresets = [
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '125%', value: 125 },
    { label: '150%', value: 150 }
  ];
}
