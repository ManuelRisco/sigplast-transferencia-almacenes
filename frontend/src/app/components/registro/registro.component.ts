import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.component.html'
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
