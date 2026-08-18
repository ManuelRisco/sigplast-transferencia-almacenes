import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService extends BaseApiService {
  
  getTiposMovimiento(): Observable<any> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'tipos_mov' });
  }

  buscarArticulos(alm_codigo: string, query: string, page: number = 1, limit: number = 10): Observable<any> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'buscar', alm_codigo, q: query, page, limit });
  }

  getLotes(alm: string, art: string, fec?: string): Observable<any> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'lotes', alm, art, fec });
  }

  getStock(alm: string, art: string, fec?: string, lot: number = 0): Observable<any> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'stock', alm, art, fec, lot });
  }
}
