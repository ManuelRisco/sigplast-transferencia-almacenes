import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  isOpen = localStorage.getItem('sigris_sidebar_open') === 'true';

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    localStorage.setItem('sigris_sidebar_open', String(this.isOpen));
  }

  closeSidebar() {
    this.isOpen = false;
    localStorage.setItem('sigris_sidebar_open', 'false');
  }

  logout() {
    this.authService.clearSession();
    this.closeSidebar();
    this.router.navigate(['/login']);
  }
}
