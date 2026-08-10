import { Injectable, signal, effect } from '@angular/core';

export type ColorFilterType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome' | 'high-contrast' | 'inverted';

export interface AccessibilitySettings {
  fontSize: number;
  colorFilter: ColorFilterType;
  dyslexicFont: boolean;
  enhancedSpacing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private readonly STORAGE_KEY = 'sigris_accessibility';

  // Signals de estado
  fontSize = signal<number>(100);
  colorFilter = signal<ColorFilterType>('none');
  dyslexicFont = signal<boolean>(false);
  enhancedSpacing = signal<boolean>(false);
  isMenuOpen = signal<boolean>(false);

  constructor() {
    this.loadSettings();

    // Effect reactivo para aplicar cambios al HTML
    effect(() => {
      this.applyDOMChanges();
      this.saveSettings();
    });
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  setFontSize(size: number) {
    const clamped = Math.max(90, Math.min(150, size));
    this.fontSize.set(clamped);
  }

  increaseFontSize() {
    if (this.fontSize() < 140) {
      this.fontSize.update(v => v + 10);
    }
  }

  decreaseFontSize() {
    if (this.fontSize() > 90) {
      this.fontSize.update(v => v - 10);
    }
  }

  setColorFilter(filter: ColorFilterType) {
    this.colorFilter.set(filter);
  }

  toggleDyslexicFont() {
    this.dyslexicFont.update(v => !v);
  }

  toggleEnhancedSpacing() {
    this.enhancedSpacing.update(v => !v);
  }

  resetAll() {
    this.fontSize.set(100);
    this.colorFilter.set('none');
    this.dyslexicFont.set(false);
    this.enhancedSpacing.set(false);
  }

  get isDefault(): boolean {
    return this.fontSize() === 100 &&
           this.colorFilter() === 'none' &&
           !this.dyslexicFont() &&
           !this.enhancedSpacing();
  }

  private applyDOMChanges() {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // 1. Aplicar tamaño de fuente al root
    if (this.fontSize() === 100) {
      root.style.fontSize = '';
    } else {
      root.style.fontSize = `${this.fontSize()}%`;
    }

    // 2. Aplicar clases de filtros de daltonismo / contraste
    const filterClasses = [
      'filter-protanopia',
      'filter-deuteranopia',
      'filter-tritanopia',
      'filter-monochrome',
      'filter-high-contrast',
      'filter-inverted'
    ];
    filterClasses.forEach(cls => root.classList.remove(cls));

    if (this.colorFilter() !== 'none') {
      root.classList.add(`filter-${this.colorFilter()}`);
    }

    // 3. Fuente para dislexia
    if (this.dyslexicFont()) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }

    // 4. Espaciado adicional
    if (this.enhancedSpacing()) {
      root.classList.add('enhanced-spacing');
    } else {
      root.classList.remove('enhanced-spacing');
    }
  }

  private saveSettings() {
    if (typeof localStorage === 'undefined') return;
    const settings: AccessibilitySettings = {
      fontSize: this.fontSize(),
      colorFilter: this.colorFilter(),
      dyslexicFont: this.dyslexicFont(),
      enhancedSpacing: this.enhancedSpacing()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('No se pudo guardar la configuración de accesibilidad', e);
    }
  }

  private loadSettings() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed: AccessibilitySettings = JSON.parse(raw);
      if (parsed.fontSize) this.fontSize.set(parsed.fontSize);
      if (parsed.colorFilter) this.colorFilter.set(parsed.colorFilter);
      if (typeof parsed.dyslexicFont === 'boolean') this.dyslexicFont.set(parsed.dyslexicFont);
      if (typeof parsed.enhancedSpacing === 'boolean') this.enhancedSpacing.set(parsed.enhancedSpacing);
    } catch (e) {
      console.warn('Error leyendo configuración de accesibilidad guardada', e);
    }
  }
}
