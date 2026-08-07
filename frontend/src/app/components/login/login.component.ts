import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-brandDark/30 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brandDark to-brandTeal text-white shadow-lg mb-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-wide">Sistema de Almacén</h1>
          <p class="text-slate-400 text-sm mt-1">Ingresa tus credenciales para acceder</p>
        </div>

        @if (errorMessage) {
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="username" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Usuario *</label>
            <input type="text" id="username" name="username" [(ngModel)]="username" required
                   class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal focus:border-transparent transition-all text-sm"
                   placeholder="Ej. jperez">
          </div>

          <div>
            <label for="password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña *</label>
            <div class="relative">
              <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="password" required
                     class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal focus:border-transparent transition-all text-sm pr-10"
                     placeholder="••••••••">
              <button type="button" (click)="toggleShowPassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading"
                  class="w-full py-3.5 px-4 bg-gradient-to-r from-brandDark to-brandTeal hover:from-blue-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-brandDark/30 hover:shadow-brandDark/50 transition-all duration-200 text-sm tracking-wide flex items-center justify-center gap-2">
            @if (loading) {
              <span>Autenticando...</span>
            } @else {
              <span>Iniciar Sesión</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            }
          </button>
        </form>

        <div class="mt-8 text-center text-sm text-slate-400">
          ¿No tienes una cuenta? 
          <a routerLink="/registro" class="text-brandTeal hover:underline font-semibold ml-1">Crear Cuenta</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  router = inject(Router);

  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  loading = false;

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.apiService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.authService.saveSession(res.user, res.token);
          this.router.navigate(['/erp']);
        } else {
          this.errorMessage = res.message || 'Credenciales inválidas.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error de conexión con el servidor.';
      }
    });
  }
}
