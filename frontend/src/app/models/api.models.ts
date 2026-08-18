export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: any;
}

export interface LoginResponse extends BaseResponse {
  token: string;
  user: any; 
}

export interface ArticulosResponse extends BaseResponse {
  articulos?: any[];
  total_records?: number;
}

export interface LotesResponse extends BaseResponse {
  lotes?: any[];
}

export interface StockResponse extends BaseResponse {
  stock?: any;
}

export interface TiposMovResponse extends BaseResponse {
  tipos_mov?: any[];
}

export interface CcostosResponse extends BaseResponse {
  ccostos?: any[];
}

export interface AlmacenesResponse extends BaseResponse {
  almacenes?: any[];
}

export interface MovimientosResponse extends BaseResponse {
  movimientos: any[];
  total_records?: number;
  almacenes?: any[];
  anios?: string[];
  filtro_anho?: string;
  filtro_mes?: string;
}

export interface DetalleResponse extends BaseResponse {
  detalle?: any[];
}

export interface TransferenciaResponse extends BaseResponse {
  vale_salida?: string;
  vale_ingreso?: string;
}
