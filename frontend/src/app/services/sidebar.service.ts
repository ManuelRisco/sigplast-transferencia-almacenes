import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  readonly isOpen = signal<boolean>(localStorage.getItem('sigplast_sidebar_open') === 'true');

  toggle() {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    localStorage.setItem('sigplast_sidebar_open', String(nextState));
  }

  open() {
    this.isOpen.set(true);
    localStorage.setItem('sigplast_sidebar_open', 'true');
  }

  close() {
    this.isOpen.set(false);
    localStorage.setItem('sigplast_sidebar_open', 'false');
  }
}
