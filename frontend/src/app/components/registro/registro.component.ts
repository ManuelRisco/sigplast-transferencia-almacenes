import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-xl bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 my-8">
        
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-white tracking-wide">Crear Nueva Cuenta</h1>
          <p class="text-slate-400 text-sm mt-1">Completa los datos para registrar un usuario</p>
        </div>

        @if (errorMessage) {
          <div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="border-b border-slate-700/60 pb-4 mb-4">
            <h2 class="text-xs font-bold text-brandTeal uppercase tracking-wider mb-3">Información Personal</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label for="nombres" class="block text-xs text-slate-300 mb-1">Nombres *</label>
                <input type="text" id="nombres" name="nombres" [(ngModel)]="nombres" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="Juan">
              </div>
              <div>
                <label for="apellido_paterno" class="block text-xs text-slate-300 mb-1">Apellido Paterno *</label>
                <input type="text" id="apellido_paterno" name="apellido_paterno" [(ngModel)]="apellido_paterno" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="Pérez">
              </div>
              <div>
                <label for="apellido_materno" class="block text-xs text-slate-300 mb-1">Apellido Materno *</label>
                <input type="text" id="apellido_materno" name="apellido_materno" [(ngModel)]="apellido_materno" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="Gómez">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="correo" class="block text-xs text-slate-300 mb-1">Correo Electrónico *</label>
                <input type="email" id="correo" name="correo" [(ngModel)]="correo" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="correo@ejemplo.com">
              </div>
              <div>
                <label for="telefono" class="block text-xs text-slate-300 mb-1">Teléfono</label>
                <input type="text" id="telefono" name="telefono" [(ngModel)]="telefono" class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="987654321">
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold text-brandTeal uppercase tracking-wider mb-3">Cuenta de Acceso</h2>

            <div class="mb-3">
              <label for="username" class="block text-xs text-slate-300 mb-1">Nombre de Usuario *</label>
              <input type="text" id="username" name="username" [(ngModel)]="username" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="jperez">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="password" class="block text-xs text-slate-300 mb-1">Contraseña *</label>
                <input type="password" id="password" name="password" [(ngModel)]="password" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="••••••••">
              </div>
              <div>
                <label for="confirm_password" class="block text-xs text-slate-300 mb-1">Confirmar Contraseña *</label>
                <input type="password" id="confirm_password" name="confirm_password" [(ngModel)]="confirm_password" required class="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brandTeal" placeholder="••••••••">
              </div>
            </div>
          </div>

          <button type="submit" [disabled]="loading"
                  class="w-full py-3.5 px-4 bg-gradient-to-r from-brandDark to-brandTeal hover:from-blue-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-brandDark/30 hover:shadow-brandDark/50 transition-all duration-200 text-sm tracking-wide mt-6">
            @if (loading) {
              <span>Registrando...</span>
            } @else {
              <span>Registrar Cuenta</span>
            }
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes una cuenta? 
          <a routerLink="/login" class="text-brandTeal hover:underline font-semibold ml-1">Iniciar Sesión</a>
        </div>
      </div>
    </div>
  `
})
export class RegistroComponent {
  apiService = inject(ApiService);
  router = inject(Router);

  nombres = '';
  apellido_paterno = '';
  apellido_materno = '';
  correo = '';
  telefono = '';
  username = '';
  password = '';
  confirm_password = '';
  errorMessage = '';
  loading = false;

  onSubmit() {
    if (!this.nombres || !this.apellido_paterno || !this.apellido_materno || !this.correo || !this.username || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (this.password !== this.confirm_password) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      nombres: this.nombres,
      apellido_paterno: this.apellido_paterno,
      apellido_materno: this.apellido_materno,
      correo: this.correo,
      telefono: this.telefono,
      username: this.username,
      password: this.password
    };

    this.apiService.registro(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          alert('Cuenta registrada exitosamente. Ahora puedes iniciar sesión.');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = res.message || 'Error al registrar la cuenta.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error de comunicación con el servidor.';
      }
    });
  }
}
