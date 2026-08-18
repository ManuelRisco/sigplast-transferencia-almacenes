import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected http = inject(HttpClient);

  protected get primaryUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.protocol}//${window.location.hostname}/transferencia-almacenes/backend/api`;
    }
    return 'http://localhost/transferencia-almacenes/backend/api';
  }

  protected cleanParams(params: any): any {
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

  protected doRequest(method: 'get' | 'post', path: string, dataOrParams?: any): Observable<any> {
    const params = this.cleanParams(dataOrParams);
    return method === 'get'
      ? this.http.get(`${this.primaryUrl}${path}`, { params })
      : this.http.post(`${this.primaryUrl}${path}`, params);
  }
}
