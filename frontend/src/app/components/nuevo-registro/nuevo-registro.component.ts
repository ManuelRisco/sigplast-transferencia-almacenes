import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nuevo-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nuevo-registro.component.html'
})
export class NuevoRegistroComponent implements OnInit, OnDestroy {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  almOrigen = localStorage.getItem('sigplast_nr_almacen') || '001';
  almNombre = 'ALMACEN VERDE MP';

  almacenesTodos: any[] = [];
  almacenesDestino: any[] = [];

  tiposMovimiento: any[] = [];
  tipoMov = localStorage.getItem('sigplast_nr_tipo_mov') || '102';
  esTransferencia = false;
  almDestino = localStorage.getItem('sigplast_nr_alm_destino') || '';
  fechaEmision = localStorage.getItem('sigplast_nr_fecha_emision') || new Date().toISOString().substring(0, 10);
  glosa = localStorage.getItem('sigplast_nr_glosa') || '';
  barcodeInput = '';
  ccostosTodos: any[] = [];

  modalCcostosVisible = false;
  filtroCcosto = '';
  itemSeleccionadoParaCcosto: any = null;

  get ccostosFiltrados(): any[] {
    if (!this.filtroCcosto.trim()) return this.ccostosTodos;
    const term = this.filtroCcosto.toLowerCase().trim();
    return this.ccostosTodos.filter(c =>
      (c.cco_codigo && c.cco_codigo.toLowerCase().includes(term)) ||
      (c.cco_nombre && c.cco_nombre.toLowerCase().includes(term))
    );
  }

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
  modalItemsPorPagina = Number(localStorage.getItem('sigplast_modal_art_filas')) || 10;

  get modalTotalPaginas(): number {
    return Math.ceil(this.modalTotalRegistros / this.modalItemsPorPagina) || 1;
  }

  get modalInicioRegistro(): number {
    return this.modalTotalRegistros === 0 ? 0 : (this.modalPaginaActual - 1) * this.modalItemsPorPagina + 1;
  }

  get modalFinRegistro(): number {
    return Math.min(this.modalPaginaActual * this.modalItemsPorPagina, this.modalTotalRegistros);
  }

  // Modal de Selección de Lotes
  modalLotesVisible = false;
  buscandoLotes = false;
  itemSeleccionadoParaLote: any = null;
  lotesEncontrados: any[] = [];
  loteSeleccionado: any = null;
  filtroLote = '';

  get lotesFiltrados(): any[] {
    if (!this.filtroLote.trim()) return this.lotesEncontrados;
    const term = this.filtroLote.toLowerCase().trim();
    return this.lotesEncontrados.filter(l =>
      (l.lot_id && l.lot_id.toString().toLowerCase().includes(term)) ||
      (l.lot_numlote && l.lot_numlote.toString().toLowerCase().includes(term))
    );
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
    localStorage.setItem('sigplast_modal_art_filas', this.modalItemsPorPagina.toString());
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
    const savedItems = localStorage.getItem('sigplast_nr_items');
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
        localStorage.setItem('sigplast_nr_almacen', this.almOrigen);
      }
      this.cargarInfoAlmacen();
    });

    // Cargar tipos de movimiento
    this.apiService.getTiposMovimiento().subscribe({
      next: (res) => {
        if (res.success && res.tipos_mov && res.tipos_mov.length > 0) {
          this.tiposMovimiento = res.tipos_mov;
          if (!this.tipoMov && this.tiposMovimiento.length > 0) {
            this.tipoMov = this.tiposMovimiento[0].tmo_codigo;
          }
          this.verificarDestino();
        }
        this.cdr.detectChanges();
      }
    });

    // Cargar C.Costos
    this.apiService.getCostCenters().subscribe({
      next: (res) => {
        if (res.success && res.ccostos) {
          this.ccostosTodos = res.ccostos;
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

  alCambiarAlmacenOrigen() {
    const actual = this.almacenesTodos.find((a: any) => a.alm_codigo === this.almOrigen);
    this.almNombre = actual ? actual.alm_nombre : '';
    this.almacenesDestino = this.almacenesTodos.filter((a: any) => a.alm_codigo !== this.almOrigen);
    if (this.almOrigen === this.almDestino) {
      this.almDestino = '';
    }

    if (this.items.length > 0) {
      Swal.fire({
        title: 'Almacén cambiado',
        text: 'Al cambiar el almacén de origen, los artículos seleccionados se han eliminado porque pertenecen a otro almacén.',
        icon: 'info',
        confirmButtonColor: '#0d9488'
      });
      this.items = [];
    }
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  alCambiarTipoMov(event?: Event) {
    const tipo = this.tiposMovimiento.find(t => t.tmo_codigo === this.tipoMov);
    const nombreTipo = tipo ? tipo.tmo_nombre.toLowerCase() : '';

    if (!nombreTipo.includes('transferencia')) {
      const transferencia = this.tiposMovimiento.find(t => t.tmo_nombre.toLowerCase().includes('transferencia'));
      const fallback = transferencia ? transferencia.tmo_codigo : (this.tiposMovimiento.length > 0 ? this.tiposMovimiento[0].tmo_codigo : '102');

      Swal.fire({
        title: 'Operación no permitida',
        text: 'Por el momento, solo se permite realizar "Transferencia entre almacenes".',
        icon: 'error',
        confirmButtonColor: '#0d9488'
      });

      setTimeout(() => {
        this.tipoMov = fallback;
        this.verificarDestino();
        this.guardarEstado();
        this.cdr.detectChanges();
      }, 0);
      return;
    }

    this.verificarDestino();
    this.guardarEstado();
  }

  verificarDestino() {
    this.esTransferencia = (this.tipoMov === 'S03' || this.tipoMov.includes('TRANSFERENCIA') || this.tipoMov === '102');
    this.cdr.detectChanges();
  }

  guardarEstado() {
    localStorage.setItem('sigplast_nr_almacen', this.almOrigen);
    localStorage.setItem('sigplast_nr_tipo_mov', this.tipoMov);
    localStorage.setItem('sigplast_nr_fecha_emision', this.fechaEmision);
    localStorage.setItem('sigplast_nr_alm_destino', this.almDestino);
    localStorage.setItem('sigplast_nr_glosa', this.glosa);
    localStorage.setItem('sigplast_nr_items', JSON.stringify(this.items));
  }

  limpiarFormulario(silent: boolean = false) {
    if (silent) {
      this.ejecutarLimpieza();
      return;
    }
    Swal.fire({
      title: '¿Limpiar formulario?',
      text: '¿Estás seguro de que deseas limpiar el formulario de nuevo registro? Se perderán los datos actuales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarLimpieza();
      }
    });
  }

  private ejecutarLimpieza() {
    this.items = [];
    this.glosa = '';
    this.barcodeInput = '';
    this.almDestino = '';
    const transferencia = this.tiposMovimiento.find(t => t.tmo_nombre.toLowerCase().includes('transferencia'));
    this.tipoMov = transferencia ? transferencia.tmo_codigo : (this.tiposMovimiento.length > 0 ? this.tiposMovimiento[0].tmo_codigo : '102');
    this.fechaEmision = new Date().toISOString().substring(0, 10);
    localStorage.removeItem('sigplast_nr_items');
    localStorage.removeItem('sigplast_nr_glosa');
    localStorage.removeItem('sigplast_nr_alm_destino');
    this.verificarDestino();
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  // Escaneo de Código de Barras (funciona directamente con lector USB / Enter)
  buscarCodigoBarras() {
    if (!this.barcodeInput.trim()) return;
    const term = this.barcodeInput.trim();

    this.apiService.buscarArticulos(this.almOrigen, term).subscribe({
      next: (res) => {
        if (res.success && res.articulos && res.articulos.length > 0) {
          const art = res.articulos[0];
          this.seleccionarArticulo(art);
          this.barcodeInput = '';
        } else {
          Swal.fire({
            title: 'No encontrado',
            text: `Artículo no encontrado con el código "${term}" en este almacén.`,
            icon: 'warning',
            confirmButtonColor: '#0d9488'
          });
          this.barcodeInput = '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'Error al buscar el código de barras.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalArticulos() {
    if (!this.almOrigen) {
      Swal.fire({
        title: 'Almacén requerido',
        text: 'Debes seleccionar un almacén de origen antes de agregar artículos.',
        icon: 'error',
        confirmButtonColor: '#0d9488'
      });
      return;
    }
    this.modalArticulosVisible = true;
    this.searchQuery = '';
    this.modalPaginaActual = 1;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.buscarArticulos();
  }

  buscarArticulos() {
    this.buscando = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    this.apiService.buscarArticulos(this.almOrigen, this.searchQuery, this.modalPaginaActual, this.modalItemsPorPagina).subscribe({
      next: (res) => {
        this.buscando = false;
        if (res && res.success) {
          this.articulosEncontrados = res.articulos || [];
          this.modalTotalRegistros = res.total_records || 0;

          if (this.modalPaginaActual > this.modalTotalPaginas && this.modalTotalPaginas > 0) {
            this.modalPaginaActual = 1;
            this.buscarArticulos();
            return;
          }
        } else {
          this.articulosEncontrados = [];
          this.modalTotalRegistros = 0;
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscando = false;
        this.articulosEncontrados = [];
        this.modalTotalRegistros = 0;
        this.cdr.markForCheck();
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
      cco_codigo: '',
      stock_disponible: art.stock_actual || 0,
      cantidad: 1.000
    });
    this.modalArticulosVisible = false;
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  abrirModalLotesParaItem(item: any) {
    this.buscandoLotes = true;
    this.itemSeleccionadoParaLote = item;
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    this.apiService.getLotes(this.almOrigen, item.art_codigo, this.fechaEmision).subscribe({
      next: (res) => {
        this.buscandoLotes = false;
        if (res && res.success && res.lotes && res.lotes.length > 0) {
          this.lotesEncontrados = res.lotes;
          const actualLote = res.lotes.find((l: any) => l.lot_id === item.lot_id);
          this.loteSeleccionado = actualLote || res.lotes[0];
          this.filtroLote = '';
          this.modalLotesVisible = true;
        } else {
          Swal.fire({
            title: 'Sin Lotes Disponibles',
            text: `El artículo "${item.art_nombre}" (${item.art_codigo}) no cuenta con lotes con stock en el almacén ${this.almOrigen}.`,
            icon: 'warning',
            confirmButtonColor: '#0d9488'
          });
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoLotes = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron consultar los lotes del artículo.',
          icon: 'error',
          confirmButtonColor: '#0d9488'
        });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarLote(lote: any) {
    this.loteSeleccionado = lote;
    this.cdr.detectChanges();
  }

  confirmarLote() {
    if (!this.loteSeleccionado || !this.itemSeleccionadoParaLote) {
      Swal.fire({
        title: 'Seleccione un Lote',
        text: 'Debe seleccionar un lote de la lista para continuar.',
        icon: 'info',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

    this.itemSeleccionadoParaLote.lot_id = this.loteSeleccionado.lot_id || '-';
    this.itemSeleccionadoParaLote.lot_numlote = this.loteSeleccionado.lot_numlote || '-';
    this.itemSeleccionadoParaLote.stock_disponible = this.loteSeleccionado.lot_cantid;

    this.modalLotesVisible = false;
    this.itemSeleccionadoParaLote = null;
    this.loteSeleccionado = null;
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  cerrarModalLotes() {
    this.modalLotesVisible = false;
    this.itemSeleccionadoParaLote = null;
    this.loteSeleccionado = null;
    this.cdr.detectChanges();
  }

  eliminarSeleccionados() {
    this.items = this.items.filter(item => !item.selected);
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  abrirModalCcostosParaItem(item: any) {
    this.itemSeleccionadoParaCcosto = item;
    this.modalCcostosVisible = true;
    this.filtroCcosto = '';
    this.cdr.detectChanges();
  }

  cerrarModalCcostos() {
    this.modalCcostosVisible = false;
    this.itemSeleccionadoParaCcosto = null;
    this.cdr.detectChanges();
  }

  seleccionarCcosto(c: any) {
    if (this.itemSeleccionadoParaCcosto) {
      this.itemSeleccionadoParaCcosto.cco_codigo = c.cco_codigo;
    }
    this.modalCcostosVisible = false;
    this.itemSeleccionadoParaCcosto = null;
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  guardarMovimiento() {
    if (!this.almOrigen) {
      Swal.fire('Atención', 'Debe seleccionar un almacén de origen.', 'warning');
      return;
    }
    if (this.esTransferencia && !this.almDestino) {
      Swal.fire('Atención', 'Para transferencias debe seleccionar un almacén destino.', 'warning');
      return;
    }
    const itemsSinCcosto = this.items.filter(i => !i.cco_codigo);
    if (itemsSinCcosto.length > 0) {
      Swal.fire('Atención', 'Todos los artículos deben tener asignado un Centro de Costo.', 'warning');
      return;
    }

    const itemsSinLote = this.items.filter(i => !i.lot_id || i.lot_id === '-' || i.lot_id === '');
    if (itemsSinLote.length > 0) {
      Swal.fire('Atención', 'Todos los artículos deben tener asignado un Lote válido.', 'warning');
      return;
    }

    // Validar que las cantidades sean mayores a 0
    const itemsSinCantidad = this.items.filter(i => !i.cantidad || Number(i.cantidad) <= 0);
    if (itemsSinCantidad.length > 0) {
      Swal.fire('Atención', 'Todos los artículos deben tener una cantidad mayor a 0.', 'warning');
      return;
    }

    const detalles = this.items.map(i => ({
      art_codigo: i.art_codigo,
      art_nombre: i.art_nombre,
      lot_codigo: (i.lot_id && i.lot_id !== '-') ? i.lot_id : '',
      cantidad: Number(i.cantidad),
      cco_codigo: i.cco_codigo
    }));

    const payload = {
      emp_codigo: '001',
      suc_codigo: '001',
      alm_origen: this.almOrigen,
      alm_destino: this.almDestino,
      fec_emi: this.fechaEmision,
      usuario: this.authService.currentUser()?.usr_codigo || this.authService.currentUser()?.username || 'ADMINISTRA',
      detalles: detalles,
      glosa: this.glosa
    };

    Swal.fire({
      title: 'Guardando transferencia...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.apiService.guardarTransferencia(payload).subscribe({
      next: (res) => {
        if (res.success) {
          Swal.fire({
            title: '¡Transferencia Exitosa!',
            html: `Se ha registrado correctamente.<br><br><b>Salida:</b> ${res.vale_salida} <br><b>Ingreso:</b> ${res.vale_ingreso}`,
            icon: 'success',
            confirmButtonColor: '#0d9488'
          }).then(() => {
            this.limpiarFormulario(true); // Resetear el form despues de guardar
          });
        } else {
          Swal.fire('Error', res.message || 'No se pudo guardar la transferencia', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error de conexión', 'Ocurrió un error al conectar con el servidor', 'error');
      }
    });
  }
}
