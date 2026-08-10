import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NavbarComponent],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);
  private readonly router = inject(Router);

  get isOpen(): boolean {
    return this.sidebarService.isOpen();
  }

  closeSidebar() {
    this.sidebarService.close();
  }

  closeOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.sidebarService.close();
    }
  }

  logout() {
    this.authService.clearSession();
    this.sidebarService.close();
    this.router.navigate(['/login']);
  }
}
