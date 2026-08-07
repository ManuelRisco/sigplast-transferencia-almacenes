import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { MovimientosComponent } from './components/movimientos/movimientos.component';
import { NuevoRegistroComponent } from './components/nuevo-registro/nuevo-registro.component';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';
import { userGuard, adminGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'erp', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [guestGuard] },
  { path: 'erp', component: MovimientosComponent, canActivate: [userGuard] },
  { path: 'nuevo-registro', component: NuevoRegistroComponent, canActivate: [userGuard] },
  { path: 'admin', component: AdminUsuariosComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'erp' }
];
