import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ArticulosResponse, LotesResponse, StockResponse, TiposMovResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService extends BaseApiService {
  
  getTiposMovimiento(): Observable<TiposMovResponse> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'tipos_mov' });
  }

  buscarArticulos(alm_codigo: string, query: string, page: number = 1, limit: number = 10): Observable<ArticulosResponse> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'buscar', alm_codigo, q: query, page, limit });
  }

  getLotes(alm: string, art: string, fec?: string): Observable<LotesResponse> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'lotes', alm, art, fec });
  }

  getStock(alm: string, art: string, fec?: string, lot: number = 0): Observable<StockResponse> {
    return this.doRequest('get', '/erp/articulos.php', { accion: 'stock', alm, art, fec, lot });
  }
}
