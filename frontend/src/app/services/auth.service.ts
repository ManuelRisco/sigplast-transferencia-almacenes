import { Injectable, signal } from '@angular/core';

export interface User {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  id_rol: number;
  rol_nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'sigris_user';
  private readonly TOKEN_KEY = 'sigris_token';

  currentUser = signal<User | null>(this.getUserFromStorage());

  private getUserFromStorage(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveSession(user: User, token: string) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUser.set(user);
  }

  clearSession() {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.id_rol === 1 || user.rol_nombre.toLowerCase() === 'administrador';
  }
}
