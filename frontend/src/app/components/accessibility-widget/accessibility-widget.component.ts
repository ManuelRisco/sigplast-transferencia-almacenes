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

  readonly filterOptions: { id: ColorFilterType; label: string; icon: string; desc: string }[] = [
    { id: 'none', label: 'Estándar', icon: '🎨', desc: 'Colores originales' },
    { id: 'protanopia', label: 'Protanopía', icon: '🔴', desc: 'Deficiencia rojo' },
    { id: 'deuteranopia', label: 'Deuteranopía', icon: '🟢', desc: 'Deficiencia verde' },
    { id: 'tritanopia', label: 'Tritanopía', icon: '🔵', desc: 'Deficiencia azul' },
    { id: 'monochrome', label: 'Monocromático', icon: '⚪', desc: 'Escala de grises' },
    { id: 'high-contrast', label: 'Alto Contraste', icon: '🔆', desc: 'Mayor visibilidad' },
    { id: 'inverted', label: 'Invertido', icon: '🌓', desc: 'Modo inverso' }
  ];

  readonly fontSizePresets = [
    { label: '90%', value: 90 },
    { label: '100%', value: 100 },
    { label: '110%', value: 110 },
    { label: '120%', value: 120 },
    { label: '130%', value: 130 }
  ];
}
