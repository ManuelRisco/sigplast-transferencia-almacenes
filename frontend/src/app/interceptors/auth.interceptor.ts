import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Evitamos agregar el token a la ruta de login
  if (req.url.includes('/auth/login.php')) {
    return next(req);
  }

  const token = localStorage.getItem('sigplast_token');
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha caducado o no estás autorizado. Por favor, inicia sesión nuevamente.',
          confirmButtonColor: '#0d9488'
        });
      } else if (error.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para realizar esta acción.',
          confirmButtonColor: '#0d9488'
        });
      }
      return throwError(() => error);
    })
  );
};
