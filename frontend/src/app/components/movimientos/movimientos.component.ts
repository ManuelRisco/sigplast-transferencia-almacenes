import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './movimientos.component.html'
})
export class MovimientosComponent implements OnInit {
  apiService = inject(ApiService);
  cdr = inject(ChangeDetectorRef);

  filtroAlmacen = localStorage.getItem('sigris_mov_almacen') || '001';
  filtroAnho = localStorage.getItem('sigris_mov_anho') || '2026';
  filtroMes = localStorage.getItem('sigris_mov_mes') || '01';

  almacenes = [
    { alm_codigo: '001', alm_nombre: 'ALMACEN VERDE MP' },
    { alm_codigo: '002', alm_nombre: 'ALMACEN MP 02' },
    { alm_codigo: '016', alm_nombre: 'ALMACEN 016' }
  ];

  anios: string[] = ['2026', '2025'];

  meses = [
    { codigo: '01', nombre: 'ENERO' },
    { codigo: '02', nombre: 'FEBRERO' },
    { codigo: '03', nombre: 'MARZO' },
    { codigo: '04', nombre: 'ABRIL' },
    { codigo: '05', nombre: 'MAYO' },
    { codigo: '06', nombre: 'JUNIO' },
    { codigo: '07', nombre: 'JULIO' },
    { codigo: '08', nombre: 'AGOSTO' },
    { codigo: '09', nombre: 'SETIEMBRE' },
    { codigo: '10', nombre: 'OCTUBRE' },
    { codigo: '11', nombre: 'NOVIEMBRE' },
    { codigo: '12', nombre: 'DICIEMBRE' }
  ];

  movimientos: any[] = [];
  totalRegistros = 0;
  loading = false;

  // Paginación con persistencia
  paginaActual = Number(localStorage.getItem('sigris_mov_pagina')) || 1;
  itemsPorPagina = Number(localStorage.getItem('sigris_mov_filas')) || 20;

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.itemsPorPagina) || 1;
  }

  get inicioRegistro(): number {
    return this.totalRegistros === 0 ? 0 : (this.paginaActual - 1) * this.itemsPorPagina + 1;
  }

  get finRegistro(): number {
    return Math.min(this.paginaActual * this.itemsPorPagina, this.totalRegistros);
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      localStorage.setItem('sigris_mov_pagina', this.paginaActual.toString());
      this.cargarDatos();
    }
  }

  cambiarItemsPorPagina(cantidad: any) {
    this.itemsPorPagina = Number(cantidad);
    this.paginaActual = 1;
    localStorage.setItem('sigris_mov_filas', this.itemsPorPagina.toString());
    localStorage.setItem('sigris_mov_pagina', '1');
    this.cargarDatos();
  }

  alCambiarFiltro() {
    localStorage.setItem('sigris_mov_almacen', this.filtroAlmacen);
    localStorage.setItem('sigris_mov_anho', this.filtroAnho);
    localStorage.setItem('sigris_mov_mes', this.filtroMes);
    this.paginaActual = 1;
    localStorage.setItem('sigris_mov_pagina', '1');
    this.cargarDatos();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.getMovimientos(this.filtroAlmacen, this.filtroAnho, this.filtroMes, this.paginaActual, this.itemsPorPagina).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          if (res.almacenes && res.almacenes.length > 0) {
            this.almacenes = res.almacenes;
          }
          if (res.anios && res.anios.length > 0) {
            this.anios = res.anios;
          }
          if (!localStorage.getItem('sigris_mov_anho') && res.filtro_anho) {
            this.filtroAnho = res.filtro_anho;
            localStorage.setItem('sigris_mov_anho', this.filtroAnho);
          }
          if (!localStorage.getItem('sigris_mov_mes') && res.filtro_mes) {
            this.filtroMes = res.filtro_mes;
            localStorage.setItem('sigris_mov_mes', this.filtroMes);
          }
          
          this.totalRegistros = res.total_records || 0;
          this.movimientos = res.movimientos.map((m: any) => ({ ...m, expanded: false, detalles: [] }));
          
          if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
            this.paginaActual = 1;
            localStorage.setItem('sigris_mov_pagina', '1');
            this.cargarDatos(); // Recargar con página válida
            return;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleDetail(mov: any) {
    mov.expanded = !mov.expanded;
    if (mov.expanded && (!mov.detalles || mov.detalles.length === 0)) {
      mov.loadingDetail = true;
      this.cdr.detectChanges();

      this.apiService.getDetalle(mov.emp_codigo, mov.raw_mov_id).subscribe({
        next: (res) => {
          mov.loadingDetail = false;
          if (res.success) {
            mov.detalles = res.detalle;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          mov.loadingDetail = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }

  copiarDatosExcel() {
    let tsv = "Nro. ID\tNo.Vale\tFec.Emi.\tFec-Trasl\tTipo de Movimiento\tDoc_Ref\tEst\tDst\tDoc.Venta\tN.Pedido\tCliente/Proveedor\tUsuario\n";
    this.movimientos.forEach(m => {
      tsv += `${m.nro_id}\t${m.no_vale || '-'}\t${m.fec_emi || '-'}\t${m.fec_trasl || '-'}\t${m.tipo_movimiento || '-'}\t${m.doc_ref || '-'}\t${m.est || '-'}\t${m.dst || '-'}\t${m.doc_venta || '-'}\t${m.n_pedido || '-'}\t${m.cliente_proveedor || '-'}\t${m.usuario || '-'}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => {
      alert('¡Datos copiados al portapapeles en formato Excel!');
    });
  }
}
