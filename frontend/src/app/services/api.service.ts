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

  private cleanParams(params: any): any {
    if (!params || typeof params !== 'object') return params;
    const cleaned: any = {};
    for (const key of Object.keys(params)) {
      const val = params[key];
      if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null') {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }

  private requestWithFallback(method: 'get' | 'post', path: string, dataOrParams?: any): Observable<any> {
    const params = this.cleanParams(dataOrParams);
    const primary$ = method === 'get'
      ? this.http.get(`${this.primaryUrl}${path}`, { params })
      : this.http.post(`${this.primaryUrl}${path}`, params);

    return primary$.pipe(
      catchError(() => {
        return method === 'get'
          ? this.http.get(`${this.secondaryUrl}${path}`, { params })
          : this.http.post(`${this.secondaryUrl}${path}`, params);
      })
    );
  }

  login(payload: any): Observable<any> {
    return this.requestWithFallback('post', '/auth/login.php', payload);
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

  getCostCenters(): Observable<any> {
    return this.requestWithFallback('get', '/erp/ccostos.php');
  }

  buscarArticulos(alm_codigo: string, query: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'buscar', alm_codigo, q: query, page, limit });
  }

  getLotes(alm: string, art: string, fec?: string): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'lotes', alm, art, fec });
  }

  getStock(alm: string, art: string, fec?: string, lot: number = 0): Observable<any> {
    return this.requestWithFallback('get', '/erp/articulos.php', { accion: 'stock', alm, art, fec, lot });
  }

  guardarTransferencia(payload: any): Observable<any> {
    return this.requestWithFallback('post', '/erp/transferencias.php', payload);
  }
}

