import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { AccessibilityWidgetComponent } from '../accessibility-widget/accessibility-widget.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AccessibilityWidgetComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  authService = inject(AuthService);
  a11y = inject(AccessibilityService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  loading = false;

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.authService.saveSession(res.user, res.token);
          this.router.navigate(['/erp']);
        } else {
          this.errorMessage = (res && res.message) ? res.message : 'Credenciales inválidas.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error de conexión con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }
}
