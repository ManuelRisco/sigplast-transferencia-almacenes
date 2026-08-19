import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { NuevoRegistroComponent } from './components/nuevo-registro/nuevo-registro.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { userGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'erp', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Iniciar Sesión | SIGPLAST ERP'
  },
  {
    path: 'erp',
    component: MovimientosComponent,
    canActivate: [userGuard],
    title: 'Notas de Salidas | SIGPLAST ERP'
  },
  {
    path: 'nuevo-registro',
    component: NuevoRegistroComponent,
    canActivate: [userGuard],
    title: 'Nuevo Registro | SIGPLAST ERP'
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Página No Encontrada | SIGPLAST ERP'
  }
];
