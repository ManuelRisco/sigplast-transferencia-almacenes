import { Injectable, signal } from '@angular/core';

import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment';

export interface User {
  id_usuario: string | number;
  username: string;
  nombre_completo: string;
  id_rol: number;
  rol_nombre: string;
  usr_codigo?: string;
  usr_nombre?: string;
  pus_codigo?: string;
  emp_codigo?: string;
  usr_correo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'sigris_user';
  private readonly TOKEN_KEY = 'sigris_token';
  private readonly secretKey = environment.aesSecretKey;

  currentUser = signal<User | null>(this.getUserFromStorage());

  private getUserFromStorage(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      // Desencriptar usando AES
      const bytes = CryptoJS.AES.decrypt(data, this.secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Fallo de desencriptación (posible llave incorrecta)');
      }
      
      return JSON.parse(decrypted);
    } catch (e) {
      // Si falla la desencriptación, limpiar la sesión
      this.clearSession();
      return null;
    }
  }

  saveSession(user: User, token: string) {
    // Encriptar el JSON con AES
    const encryptedUser = CryptoJS.AES.encrypt(JSON.stringify(user), this.secretKey).toString();
    
    localStorage.setItem(this.USER_KEY, encryptedUser);
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
}
