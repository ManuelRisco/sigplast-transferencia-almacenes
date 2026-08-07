import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-nuevo-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sidebar></app-sidebar>

    <div class="max-w-screen-2xl mx-auto px-2 sm:px-4 bg-white border border-gray-400 shadow-lg rounded-lg overflow-hidden flex flex-col min-h-[80vh] h-auto mb-12">
      <!-- Header Window -->
      <div class="bg-[#eef5fa] p-3 border-b-2 border-brandDark flex justify-between items-center">
        <div class="flex items-center gap-3">
          <h2 class="m-0 text-base font-bold text-[#002d5a]">Nuevo Registro</h2>
          <span class="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded border border-green-300">
            💾 Autoguardado activo
          </span>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" (click)="limpiarFormulario()" title="Limpiar y reiniciar formulario" class="text-xs text-red-600 hover:text-red-800 font-bold border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-colors">
            🗑️ Limpiar Todo
          </button>
          <a routerLink="/erp" [queryParams]="{ alm_codigo: almOrigen }" class="text-brandDark font-bold hover:text-blue-900">✕ Cerrar</a>
        </div>
      </div>

      <!-- Header General -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 p-3 md:px-4 bg-gray-50 border-b border-gray-400 items-start sm:items-center shadow-sm">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="font-bold text-brandDark text-sm w-16 sm:w-auto">Almacen</label>
          <input type="text" [value]="almOrigen + ' - ' + almNombre" readonly class="form-input flex-1 sm:w-80 bg-gray-200 border-gray-400 cursor-not-allowed text-gray-900 border rounded px-2 py-1 text-sm font-semibold">
        </div>
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="font-bold text-brandDark text-sm w-16 sm:w-auto">Año</label>
          <select class="form-input flex-1 sm:w-24 bg-white border-gray-400 border rounded px-2 py-1 text-sm font-semibold">
            <option>{{ anhoActual }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="font-bold text-brandDark text-sm w-16 sm:w-auto">Mes</label>
          <select class="form-input flex-1 sm:w-32 bg-white border-gray-400 border rounded px-2 py-1 text-sm font-semibold">
            <option>{{ mesActualNombre }}</option>
          </select>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-1 overflow-y-auto">
        <!-- Formulario Cabecera -->
        <div class="p-3 md:p-4 border-b border-gray-400 space-y-3">
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
            <div class="flex items-center gap-2 w-full md:w-auto">
              <label class="w-24 font-bold text-gray-900 text-sm text-left sm:text-right">Tipo Mov.</label>
              <select [(ngModel)]="tipoMov" (ngModelChange)="alCambiarTipoMov()" class="form-input flex-1 md:w-80 bg-white border border-gray-400 text-gray-900 rounded px-2 py-1.5 text-sm font-medium">
                <option value="">-- Seleccione Tipo de Movimiento --</option>
                @for (t of tiposMovimiento; track t.tmo_codigo) {
                  <option [value]="t.tmo_codigo">{{ t.tmo_codigo }} - {{ t.tmo_nombre }}</option>
                }
              </select>
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto">
              <label class="w-24 font-bold text-gray-900 text-sm text-left sm:text-right">Fec.Emisión</label>
              <input type="date" [(ngModel)]="fechaEmision" (ngModelChange)="guardarEstado()" class="form-input flex-1 md:w-36 bg-white border border-gray-400 text-gray-900 rounded px-2 py-1 text-sm">
            </div>
          </div>

          <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
            <div class="flex items-center gap-2 w-full md:w-auto">
              <label class="w-24 font-bold text-gray-900 text-sm text-left sm:text-right">C.Costos</label>
              <input type="text" class="form-input w-16 bg-gray-100 border border-gray-400 text-gray-900 cursor-not-allowed rounded px-2 py-1 text-xs" readonly>
              <input type="text" class="form-input flex-1 sm:w-48 bg-gray-100 border border-gray-400 text-gray-900 cursor-not-allowed rounded px-2 py-1 text-xs" readonly>
            </div>
            @if (esTransferencia) {
              <div class="flex items-center gap-2 w-full md:w-auto">
                <label class="w-32 font-bold text-gray-900 text-sm text-left sm:text-right">Almacen Destino</label>
                <select [(ngModel)]="almDestino" (ngModelChange)="guardarEstado()" class="form-input flex-1 md:w-72 bg-white border border-gray-400 text-gray-900 rounded px-2 py-1 text-sm">
                  <option value="">-- Seleccione Destino --</option>
                  @for (d of almacenesDestino; track d.alm_codigo) {
                    <option [value]="d.alm_codigo">{{ d.alm_codigo }} - {{ d.alm_nombre }}</option>
                  }
                </select>
              </div>
            }
          </div>
          
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
            <div class="flex items-center gap-2 w-full md:w-auto">
              <label class="w-24 font-bold text-gray-900 text-sm text-left sm:text-right">Trabajador</label>
              <input type="text" class="form-input w-16 bg-gray-100 border border-gray-400 text-gray-900 cursor-not-allowed rounded px-2 py-1 text-xs" readonly>
              <input type="text" class="form-input flex-1 sm:w-48 bg-gray-100 border border-gray-400 text-gray-900 cursor-not-allowed rounded px-2 py-1 text-xs" readonly>
            </div>
          </div>
        </div>

        <!-- Pestañas -->
        <div class="flex bg-gray-200 border-b-2 border-gray-400 pt-2 px-2 gap-1">
          <div class="px-6 py-2 font-bold text-sm cursor-pointer bg-white text-brandDark border-t-2 border-brandDark border-x border-gray-400 rounded-t-sm -mb-[2px]">Detalle</div>
          <div class="px-6 py-2 font-bold text-sm cursor-pointer text-gray-600 hover:text-gray-900">Datos Adicionales</div>
          <div class="px-6 py-2 font-bold text-sm cursor-pointer text-gray-600 hover:text-gray-900">Datos de Exportación</div>
        </div>

        <!-- Detalle Grid -->
        <div class="p-0 bg-white flex flex-col border border-gray-300">
          <div class="flex flex-col md:flex-row flex-wrap gap-3 items-center justify-between py-1.5 px-3 border-b border-gray-300 bg-[#f4f4f4]">
            <div class="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
              <div class="flex items-center gap-2">
                <label class="font-bold text-[#004b87] text-sm">Stock Seguridad:</label>
                <input type="text" value="0.00000" readonly class="form-input w-24 text-right bg-[#eaf2fa] border border-[#90bced] text-[#004b87] font-semibold p-1 outline-none rounded">
              </div>
              <div class="flex items-center gap-2">
                <label class="font-bold text-[#004b87] text-sm">Codigo de Barras :</label>
                <input type="text" [(ngModel)]="barcodeInput" (keyup.enter)="buscarCodigoBarras()" class="form-input w-full sm:w-56 bg-white border border-gray-400 p-1 rounded text-sm">
              </div>
            </div>
            <div class="flex gap-2 w-full md:w-auto p-1">
              <button type="button" (click)="abrirModalArticulos()" class="px-5 py-1 text-sm text-[#004b87] bg-white border border-gray-300 shadow-sm hover:bg-gray-50 rounded-sm font-bold"><u>N</u>uevo</button>
              <button type="button" (click)="eliminarSeleccionados()" class="px-5 py-1 text-sm text-[#004b87] bg-white border border-gray-300 shadow-sm hover:bg-gray-50 rounded-sm font-bold"><u>E</u>liminar</button>
            </div>
          </div>

          <div class="flex-1 overflow-auto bg-white min-h-[300px]">
            <table class="w-full border-collapse text-xs whitespace-nowrap">
              <thead class="bg-white text-gray-800 border-b border-gray-300">
                <tr>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">Sele.</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">Item</th>
                  <th class="px-2 py-1 border-r border-gray-300 font-bold text-center">Codigo</th>
                  <th class="px-2 py-1 border-r border-gray-300 font-bold text-center">Descripción</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">U/M</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">ID.Lote</th>
                  <th class="px-2 py-1 border-r border-gray-300 font-bold text-center">Lote</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">No O/T</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">Cantidad</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold whitespace-normal w-12 leading-none">Cant.<br>Und.Vta</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">Millares</th>
                  <th class="px-2 py-1 border-r border-gray-300 text-center font-bold">C.Costo</th>
                  <th class="px-2 py-1 border-gray-300 text-center font-bold">Metraje</th>
                </tr>
              </thead>
              <tbody class="text-gray-900 divide-y divide-gray-200">
                @if (items.length === 0) {
                  <tr>
                    <td colspan="13" class="py-8 text-center text-gray-500 font-medium">No hay ítems agregados aún. Usa el campo "Código de Barras" o el botón "Nuevo" para añadir.</td>
                  </tr>
                } @else {
                  @for (item of items; track $index) {
                    <tr class="hover:bg-blue-50">
                      <td class="px-2 py-1 border-r border-gray-300 text-center">
                        <input type="checkbox" [(ngModel)]="item.selected">
                      </td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center font-mono text-gray-600">#{{ $index + 1 }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 font-bold text-brandDark text-center">{{ item.art_codigo }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 font-medium">{{ item.art_nombre }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center text-gray-600">{{ item.art_uniing }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center font-mono text-cyan-800">{{ item.lot_id || '-' }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center font-mono text-cyan-800">{{ item.lot_numlote || '-' }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center">{{ item.mov_numord || '-' }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-right">
                        <input type="number" [(ngModel)]="item.cantidad" (ngModelChange)="guardarEstado()" min="1" step="0.001" class="w-24 border border-gray-300 rounded px-1 text-right font-bold">
                      </td>
                      <td class="px-2 py-1 border-r border-gray-300 text-right">{{ item.cantidad }}</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-right">0.000</td>
                      <td class="px-2 py-1 border-r border-gray-300 text-center">-</td>
                      <td class="px-2 py-1 text-right">0.000</td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col md:flex-row flex-wrap items-center justify-between p-3 bg-gray-50 border-t border-gray-400 gap-3">
          <div class="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <label class="font-bold text-sm text-gray-900 w-24 text-left sm:text-right">Glosa</label>
              <input type="text" [(ngModel)]="glosa" (ngModelChange)="guardarEstado()" placeholder="Ingrese una glosa o comentario..." class="form-input flex-1 md:w-72 bg-white border border-gray-400 rounded px-2 py-1 text-sm">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Buscador de Artículos con Paginación Unificada -->
    @if (modalArticulosVisible) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
          <div class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shrink-0">
            <h3 class="font-bold text-base md:text-lg">Catálogo de Artículos ({{ almOrigen }} - {{ almNombre }})</h3>
            <button (click)="modalArticulosVisible = false" class="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
          </div>

          <div class="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchQueryChange($event)" (keyup.enter)="buscarArticulos()" placeholder="Buscar por código o descripción de artículo..." class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600">
              <button (click)="buscarArticulos()" class="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">Buscar</button>
            </div>

            @if (buscando) {
              <div class="py-12 text-center text-gray-500 text-sm font-medium animate-pulse">Cargando catálogo del almacén...</div>
            } @else if (articulosEncontrados.length > 0) {
              <div class="border border-gray-300 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div class="overflow-x-auto max-h-[50vh]">
                  <table class="w-full text-xs text-left whitespace-nowrap">
                    <thead class="bg-slate-100 text-slate-800 uppercase font-bold border-b border-gray-300 sticky top-0 z-10">
                      <tr>
                        <th class="py-2.5 px-4">Código</th>
                        <th class="py-2.5 px-4">Descripción</th>
                        <th class="py-2.5 px-4">U/M</th>
                        <th class="py-2.5 px-4 text-right">Stock Actual</th>
                        <th class="py-2.5 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      @for (a of articulosEncontrados; track a.art_codigo) {
                        <tr class="hover:bg-cyan-50/50 transition-colors">
                          <td class="py-2 px-4 font-bold text-brandDark font-mono">{{ a.art_codigo }}</td>
                          <td class="py-2 px-4 font-medium text-gray-900">{{ a.art_nombre }}</td>
                          <td class="py-2 px-4 text-gray-600">{{ a.art_uniing }}</td>
                          <td class="py-2 px-4 text-right font-mono font-bold text-gray-900">{{ a.stock_actual }}</td>
                          <td class="py-2 px-4 text-center">
                            <button (click)="seleccionarArticulo(a)" class="bg-brandTeal hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors shadow">
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Barra de Paginación Unificada en el Modal -->
                <div class="bg-gray-50 border-t border-gray-300 p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div class="text-xs font-semibold text-gray-700">
                    Mostrando <span class="font-bold text-brandDark">{{ modalInicioRegistro }}</span> - <span class="font-bold text-brandDark">{{ modalFinRegistro }}</span> de <span class="font-bold text-brandDark">{{ modalTotalRegistros }}</span> artículos
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1.5">
                      <label class="text-xs font-bold text-gray-700 uppercase">Filas:</label>
                      <select [ngModel]="modalItemsPorPagina" (ngModelChange)="cambiarModalItemsPorPagina($event)" class="border border-gray-400 rounded px-2 py-1 text-xs bg-white font-semibold">
                        <option [value]="10">10</option>
                        <option [value]="20">20</option>
                        <option [value]="50">50</option>
                      </select>
                    </div>

                    <div class="flex items-center gap-1">
                      <button (click)="cambiarModalPagina(modalPaginaActual - 1)" [disabled]="modalPaginaActual === 1" class="px-3 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                        ‹ Anterior
                      </button>
                      <span class="px-2.5 py-1 text-xs font-bold text-brandDark bg-blue-50 border border-blue-200 rounded">
                        {{ modalPaginaActual }} / {{ modalTotalPaginas }}
                      </span>
                      <button (click)="cambiarModalPagina(modalPaginaActual + 1)" [disabled]="modalPaginaActual === modalTotalPaginas" class="px-3 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                        Siguiente ›
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            } @else {
              <div class="py-12 text-center text-gray-500 text-sm font-medium">No se encontraron artículos para este almacén.</div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class NuevoRegistroComponent implements OnInit, OnDestroy {
  apiService = inject(ApiService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  almOrigen = localStorage.getItem('sigris_nr_almacen') || '001';
  almNombre = 'ALMACEN VERDE MP';
  anhoActual = new Date().getFullYear().toString();
  mesActualNombre = 'AGOSTO';

  almacenesTodos: any[] = [];
  almacenesDestino: any[] = [];

  tiposMovimiento: any[] = [];
  tipoMov = localStorage.getItem('sigris_nr_tipo_mov') || '102';
  esTransferencia = false;
  almDestino = localStorage.getItem('sigris_nr_alm_destino') || '';
  fechaEmision = localStorage.getItem('sigris_nr_fecha_emision') || new Date().toISOString().substring(0, 10);
  glosa = localStorage.getItem('sigris_nr_glosa') || '';
  barcodeInput = '';

  items: any[] = [];

  // Buscador y Paginación Modal con persistencia
  modalArticulosVisible = false;
  searchQuery = '';
  buscando = false;
  articulosEncontrados: any[] = [];
  modalTotalRegistros = 0;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  modalPaginaActual = 1;
  modalItemsPorPagina = Number(localStorage.getItem('sigris_modal_art_filas')) || 10;

  get modalTotalPaginas(): number {
    return Math.ceil(this.modalTotalRegistros / this.modalItemsPorPagina) || 1;
  }

  get modalInicioRegistro(): number {
    return this.modalTotalRegistros === 0 ? 0 : (this.modalPaginaActual - 1) * this.modalItemsPorPagina + 1;
  }

  get modalFinRegistro(): number {
    return Math.min(this.modalPaginaActual * this.modalItemsPorPagina, this.modalTotalRegistros);
  }

  onSearchQueryChange(query: string) {
    this.searchSubject.next(query);
  }

  cambiarModalPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.modalTotalPaginas) {
      this.modalPaginaActual = nuevaPagina;
      this.buscarArticulos();
    }
  }

  cambiarModalItemsPorPagina(cantidad: any) {
    this.modalItemsPorPagina = Number(cantidad);
    this.modalPaginaActual = 1;
    localStorage.setItem('sigris_modal_art_filas', this.modalItemsPorPagina.toString());
    this.buscarArticulos();
  }

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.modalPaginaActual = 1;
      this.buscarArticulos();
    });
    // Restaurar items de localStorage si existen
    const savedItems = localStorage.getItem('sigris_nr_items');
    if (savedItems) {
      try {
        this.items = JSON.parse(savedItems);
      } catch (e) {
        this.items = [];
      }
    }

    this.route.queryParams.subscribe(params => {
      if (params['alm_codigo']) {
        this.almOrigen = params['alm_codigo'];
        localStorage.setItem('sigris_nr_almacen', this.almOrigen);
      }
      this.cargarInfoAlmacen();
    });

    const mesesArray = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    this.mesActualNombre = mesesArray[new Date().getMonth()];

    // Cargar tipos de movimiento
    this.apiService.getTiposMovimiento().subscribe({
      next: (res) => {
        if (res.success && res.tipos_mov && res.tipos_mov.length > 0) {
          this.tiposMovimiento = res.tipos_mov;
          // Si no hay tipo guardado, asignar el primero por defecto
          if (!this.tipoMov && this.tiposMovimiento.length > 0) {
            this.tipoMov = this.tiposMovimiento[0].tmo_codigo;
          }
          this.verificarDestino();
        }
        this.cdr.detectChanges();
      }
    });
  }

  cargarInfoAlmacen() {
    this.apiService.getMovimientos(this.almOrigen, '', '').subscribe({
      next: (res) => {
        if (res.success && res.almacenes) {
          this.almacenesTodos = res.almacenes;
          const actual = this.almacenesTodos.find((a: any) => a.alm_codigo === this.almOrigen);
          if (actual) {
            this.almNombre = actual.alm_nombre;
          }
          this.almacenesDestino = this.almacenesTodos.filter((a: any) => a.alm_codigo !== this.almOrigen);
        }
        this.cdr.detectChanges();
      }
    });
  }

  alCambiarTipoMov() {
    this.verificarDestino();
    this.guardarEstado();
  }

  verificarDestino() {
    this.esTransferencia = (this.tipoMov === 'S03' || this.tipoMov.includes('TRANSFERENCIA') || this.tipoMov === '102');
    this.cdr.detectChanges();
  }

  guardarEstado() {
    localStorage.setItem('sigris_nr_almacen', this.almOrigen);
    localStorage.setItem('sigris_nr_tipo_mov', this.tipoMov);
    localStorage.setItem('sigris_nr_fecha_emision', this.fechaEmision);
    localStorage.setItem('sigris_nr_alm_destino', this.almDestino);
    localStorage.setItem('sigris_nr_glosa', this.glosa);
    localStorage.setItem('sigris_nr_items', JSON.stringify(this.items));
  }

  limpiarFormulario() {
    if (confirm('¿Estás seguro de que deseas limpiar el formulario de nuevo registro?')) {
      this.items = [];
      this.glosa = '';
      this.barcodeInput = '';
      this.almDestino = '';
      this.tipoMov = this.tiposMovimiento.length > 0 ? this.tiposMovimiento[0].tmo_codigo : '102';
      this.fechaEmision = new Date().toISOString().substring(0, 10);
      localStorage.removeItem('sigris_nr_items');
      localStorage.removeItem('sigris_nr_glosa');
      localStorage.removeItem('sigris_nr_alm_destino');
      this.verificarDestino();
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  buscarCodigoBarras() {
    if (!this.barcodeInput.trim()) return;
    this.apiService.buscarArticulos(this.almOrigen, this.barcodeInput).subscribe({
      next: (res) => {
        if (res.success && res.articulos.length > 0) {
          this.seleccionarArticulo(res.articulos[0]);
          this.barcodeInput = '';
        } else {
          alert('Artículo no encontrado con el código de barras ingresado.');
        }
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalArticulos() {
    this.modalArticulosVisible = true;
    this.searchQuery = '';
    this.modalPaginaActual = 1;
    this.buscarArticulos();
  }

  buscarArticulos() {
    this.buscando = true;
    this.cdr.detectChanges();

    this.apiService.buscarArticulos(this.almOrigen, this.searchQuery, this.modalPaginaActual, this.modalItemsPorPagina).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res.success) {
          this.articulosEncontrados = res.articulos;
          this.modalTotalRegistros = res.total_records || 0;
          
          if (this.modalPaginaActual > this.modalTotalPaginas && this.modalTotalPaginas > 0) {
            this.modalPaginaActual = 1;
            this.buscarArticulos(); // Recargar a la primera página válida
            return;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscando = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  seleccionarArticulo(art: any) {
    this.items.push({
      selected: false,
      art_codigo: art.art_codigo,
      art_nombre: art.art_nombre,
      art_uniing: art.art_uniing,
      lot_id: '-',
      lot_numlote: '-',
      mov_numord: '-',
      cantidad: 1.000
    });
    this.modalArticulosVisible = false;
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  eliminarSeleccionados() {
    this.items = this.items.filter(item => !item.selected);
    this.guardarEstado();
    this.cdr.detectChanges();
  }
}
