import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { AccessibilityWidgetComponent } from '../accessibility-widget/accessibility-widget.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, AccessibilityWidgetComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  readonly sidebarService = inject(SidebarService);
  readonly a11y = inject(AccessibilityService);

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
