import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>

    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-brandDark">Panel de Administración de Usuarios</h2>
          <p class="text-slate-500 text-sm mt-1">Gestiona las cuentas, roles y contraseñas (Hash BCRYPT) del sistema</p>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-800 border-collapse">
            <thead class="bg-slate-800 text-white uppercase text-xs font-bold tracking-wider">
              <tr>
                <th class="py-3.5 px-4">ID</th>
                <th class="py-3.5 px-4">Usuario</th>
                <th class="py-3.5 px-4">Nombre Completo</th>
                <th class="py-3.5 px-4">Contacto</th>
                <th class="py-3.5 px-4">Rol</th>
                <th class="py-3.5 px-4">Estado</th>
                <th class="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @if (loading) {
                <tr>
                  <td colspan="7" class="py-8 text-center text-gray-500">Cargando cuentas de usuarios...</td>
                </tr>
              } @else {
                @for (u of usuarios; track u.id_usuario) {
                  <tr class="hover:bg-blue-50/50 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold text-gray-600">#{{ u.id_usuario }}</td>
                    <td class="py-3.5 px-4 font-bold text-brandDark">{{ u.username }}</td>
                    <td class="py-3.5 px-4 font-medium text-gray-900">{{ u.nombres }} {{ u.apellido_paterno }} {{ u.apellido_materno }}</td>
                    <td class="py-3.5 px-4 text-gray-600 text-xs">
                      <div>{{ u.correo }}</div>
                      <div class="text-gray-400">{{ u.telefono || 'Sin teléfono' }}</div>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {{ u.rol_nombre }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4">
                      @if (u.estado === 1 || u.estado === '1') {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Activo
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Inactivo
                        </span>
                      }
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <!-- Editar Datos -->
                        <button (click)="abrirModalEditar(u)" class="p-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-lg transition-colors shadow-sm" title="Editar Datos">
                          ✏️
                        </button>
                        <!-- Cambiar Clave -->
                        <button (click)="abrirModalClave(u)" class="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors shadow-sm" title="Cambiar Contraseña">
                          🔑
                        </button>
                        <!-- Toggle Estado -->
                        @if (isSelf(u)) {
                          <button disabled class="p-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed opacity-60" title="No puedes desactivar tu propia cuenta activa">
                            🚫
                          </button>
                        } @else {
                          <button (click)="toggleEstado(u)" class="p-1.5 rounded-lg transition-colors shadow-sm" [class.bg-rose-100]="u.estado === 1 || u.estado === '1'" [class.text-rose-800]="u.estado === 1 || u.estado === '1'" [class.bg-emerald-100]="u.estado !== 1 && u.estado !== '1'" [class.text-emerald-800]="u.estado !== 1 && u.estado !== '1'">
                            🔄
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Editar Datos -->
    @if (modalEditarVisible) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
          <div class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <h3 class="font-bold text-lg">Editar Datos de Usuario</h3>
            <button (click)="modalEditarVisible = false" class="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
          </div>

          <form (ngSubmit)="guardarEdicion()" class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nombres *</label>
                <input type="text" [(ngModel)]="userEdit.nombres" name="nombres" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Apellido Paterno *</label>
                <input type="text" [(ngModel)]="userEdit.apellido_paterno" name="apellido_paterno" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Apellido Materno *</label>
                <input type="text" [(ngModel)]="userEdit.apellido_materno" name="apellido_materno" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Teléfono</label>
                <input type="text" [(ngModel)]="userEdit.telefono" name="telefono" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Correo Electrónico *</label>
              <input type="email" [(ngModel)]="userEdit.correo" name="correo" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Username *</label>
                <input type="text" [(ngModel)]="userEdit.username" name="username" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Rol de Usuario *</label>
                <select [(ngModel)]="userEdit.id_rol" name="id_rol" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold bg-white">
                  @for (r of roles; track r.id_rol) {
                    <option [value]="r.id_rol">{{ r.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="modalEditarVisible = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs">Cancelar</button>
              <button type="submit" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Cambiar Clave -->
    @if (modalClaveVisible) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
          <div class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
            <h3 class="font-bold text-lg">Cambiar Contraseña</h3>
            <button (click)="modalClaveVisible = false" class="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
          </div>

          <form (ngSubmit)="guardarClave()" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nueva Contraseña (BCRYPT) *</label>
              <input type="password" [(ngModel)]="nuevaPassword" name="nuevaPassword" required minlength="4" placeholder="••••••••" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" (click)="modalClaveVisible = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs">Cancelar</button>
              <button type="submit" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow">Actualizar Clave</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class AdminUsuariosComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  usuarios: any[] = [];
  roles: any[] = [];
  loading = false;

  modalEditarVisible = false;
  userEdit: any = {};

  modalClaveVisible = false;
  userClave: any = {};
  nuevaPassword = '';

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.getUsuarios().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.usuarios = res.usuarios;
          this.roles = res.roles;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al cargar usuarios:', err);
        this.cdr.detectChanges();
      }
    });
  }

  isSelf(u: any): boolean {
    const cur = this.authService.currentUser();
    return cur ? Number(cur.id_usuario) === Number(u.id_usuario) : false;
  }

  abrirModalEditar(u: any) {
    this.userEdit = { ...u };
    this.modalEditarVisible = true;
    this.cdr.detectChanges();
  }

  guardarEdicion() {
    const payload = {
      accion: 'editar_datos',
      ...this.userEdit
    };

    this.apiService.procesarUsuario(payload).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Datos actualizados correctamente.');
          this.modalEditarVisible = false;
          this.cargarUsuarios();
        } else {
          alert(res.message);
        }
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalClave(u: any) {
    this.userClave = u;
    this.nuevaPassword = '';
    this.modalClaveVisible = true;
    this.cdr.detectChanges();
  }

  guardarClave() {
    if (!this.nuevaPassword || this.nuevaPassword.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const payload = {
      accion: 'cambiar_password',
      id_usuario: this.userClave.id_usuario,
      nueva_password: this.nuevaPassword
    };

    this.apiService.procesarUsuario(payload).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Contraseña encriptada con BCRYPT y actualizada correctamente.');
          this.modalClaveVisible = false;
        } else {
          alert(res.message);
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleEstado(u: any) {
    if (this.isSelf(u)) {
      alert('No puedes desactivar tu propia cuenta mientras estás autenticado.');
      return;
    }

    const nuevoEstado = (Number(u.estado) === 1) ? 0 : 1;
    const payload = {
      accion: 'cambiar_estado',
      id_usuario: u.id_usuario,
      nuevo_estado: nuevoEstado
    };

    this.apiService.procesarUsuario(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.cargarUsuarios();
        }
        this.cdr.detectChanges();
      }
    });
  }
}
