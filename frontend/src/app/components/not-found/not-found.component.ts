import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { AccessibilityWidgetComponent } from '../accessibility-widget/accessibility-widget.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, AccessibilityWidgetComponent],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {
  readonly authService = inject(AuthService);
  readonly a11y = inject(AccessibilityService);
  private readonly router = inject(Router);

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/erp']);
    }
  }
}
