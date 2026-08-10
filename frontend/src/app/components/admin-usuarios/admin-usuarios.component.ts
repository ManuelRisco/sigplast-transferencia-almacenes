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
  templateUrl: './admin-usuarios.component.html'
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
