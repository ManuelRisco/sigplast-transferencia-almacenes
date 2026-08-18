import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { MovimientosResponse, DetalleResponse, CcostosResponse, TransferenciaResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class TransferenciasService extends BaseApiService {

  getMovimientos(alm_codigo: string, mov_anho: string, mov_nmes: string, page: number = 1, limit: number = 20): Observable<MovimientosResponse> {
    return this.doRequest('get', '/erp/movimientos.php', { alm_codigo, mov_anho, mov_nmes, page, limit });
  }

  getDetalle(emp_codigo: string, mov_id: string): Observable<DetalleResponse> {
    return this.doRequest('get', '/erp/detalle.php', { emp_codigo, mov_id });
  }

  getCostCenters(): Observable<CcostosResponse> {
    return this.doRequest('get', '/erp/ccostos.php');
  }

  guardarTransferencia(payload: any): Observable<TransferenciaResponse> {
    return this.doRequest('post', '/erp/transferencias.php', payload);
  }
}
