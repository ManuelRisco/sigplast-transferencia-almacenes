import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  readonly isOpen = signal<boolean>(this.getInitialState());

  private getInitialState(): boolean {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('sigplast_sidebar_open') === 'true';
    }
    return true; // Default state
  }

  toggle() {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('sigplast_sidebar_open', String(nextState));
    }
  }

  open() {
    this.isOpen.set(true);
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('sigplast_sidebar_open', 'true');
    }
  }

  close() {
    this.isOpen.set(false);
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('sigplast_sidebar_open', 'false');
    }
  }
}
