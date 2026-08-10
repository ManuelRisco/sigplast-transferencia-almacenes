import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private primaryUrl = 'http://localhost/sigris/backend/api';
  private secondaryUrl = 'http://localhost/prueba/sigris/backend/api';

  constructor(private http: HttpClient) { }

  private requestWithFallback(method: 'get' | 'post', path: string, dataOrParams?: any): Observable<any> {
    const primary$ = method === 'get'
      ? this.http.get(`${this.primaryUrl}${path}`, { params: dataOrParams })
      : this.http.post(`${this.primaryUrl}${path}`, dataOrParams);

    return primary$.pipe(
      catchError(() => {
        return method === 'get'
          ? this.http.get(`${this.secondaryUrl}${path}`, { params: dataOrParams })
          : this.http.post(`${this.secondaryUrl}${path}`, dataOrParams);
      })
    );
  }

  login(payload: any): Observable<any> {
    return this.requestWithFallback('post', '/auth/login.php', payload);
  }

  registro(payload: any): Observable<any> {
    return this.requestWithFallback('post', '/auth/registro.php', payload);
  }

  getMovimientos(alm_codigo: string, mov_anho: string, mov_nmes: string, page: number = 1, limit: number = 20): Observable<any> {
    return this.requestWithFallback('get', '/erp/movimientos.php', { alm_codigo, mov_anho, mov_nmes, page, limit });
  }

  getDetalle(emp_codigo: string, mov_id: string): Observable<any> {
    return this.requestWithFallback('get', '/erp/detalle.php', { emp_codigo, mov_id });
  }

  getTiposMovimiento(): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'tipos_mov' });
  }

  buscarArticulos(alm_codigo: string, query: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'buscar', alm_codigo, q: query, page, limit });
  }

  getLotes(alm: string, art: string): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'lotes', alm, art });
  }

  getUsuarios(): Observable<any> {
    return this.requestWithFallback('get', '/admin/usuarios.php');
  }

  procesarUsuario(payload: any): Observable<any> {
    return this.requestWithFallback('post', '/admin/usuarios.php', payload);
  }
}

