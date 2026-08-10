# Servicios y Guards - Frontend Angular 22

Este documento detalla la capa de comunicación HTTP, manejo reactivo del estado de sesión con encriptación AES y protección de rutas del frontend.

---

## 📌 Relaciones y Dependencias
- **Consumido por Componentes:** [[Frontend/Doc_Componentes_Angular]].
- **Utilizado en Navegación:** [[Frontend/Doc_Sidebar_Navegacion]].
- **Endpoints de Conexión:** [[Backend/Doc_API_Endpoints_JSON]].
- **Políticas de Seguridad y Hash:** [[Backend/Doc_Seguridad_BCRYPT]].

---

## ⚙️ Servicios

### 1. `ApiService` (`src/app/services/api.service.ts`)
Encargado de centralizar todas las peticiones hacia la API REST en PHP.
- **Mecanismo de Fallback:** Si la URL primaria (`/sigris/backend/api`) falla, conmuta automáticamente a la secundaria (`/prueba/sigris/backend/api`) mediante operadores `RxJS` (`catchError`).
- **Métodos Principales:**
  - `login(payload)`: Envío de credenciales a `api/auth/login.php`.
  - `registro(payload)`: Creación de cuentas en `api/auth/registro.php`.
  - `getMovimientos(alm, anho, mes, page, limit)`: Consulta paginada a `api/erp/movimientos.php`.
  - `getDetalle(emp_codigo, mov_id)`: Consulta a `api/erp/detalle.php`.
  - `getTiposMovimiento()`: Consulta tipos a `api/erp/articulos.php?accion=tipos_mov`.
  - `buscarArticulos(alm, query, page, limit)`: Búsqueda paginada en `api/erp/articulos.php`.
  - `getLotes(alm, art)`: Consulta en tiempo real de lotes disponibles con stock en `api/erp/articulos.php?accion=lotes`.
  - `getUsuarios()` y `procesarUsuario()`: Gestión de cuentas en `api/admin/usuarios.php`.

---

### 2. `AuthService` (`src/app/services/auth.service.ts`)
Gestiona el estado reactivo del usuario conectado utilizando **Angular Signals** y **Encriptación Criptográfica AES**:
- **Encriptación AES (CryptoJS):**
  - Los datos del usuario en `localStorage` (`sigris_user`) se almacenan encriptados bajo el algoritmo militar **AES** usando `crypto-js`.
  - La clave secreta privada reside en las variables de entorno de Angular (`src/environments/environment.ts`), archivo que se encuentra protegido y excluido de GitHub mediante `.gitignore`.
  - En el almacenamiento local del navegador, la sesión se observa como un hash indescifrable (`U2FsdGVkX19...`).
- **Signals y Métodos:**
  - `currentUser = signal<User | null>`: Almacena la sesión activa del usuario desencriptada en memoria.
  - `isLoggedIn()`: Comprueba si el usuario tiene una sesión válida.
  - `isAdmin()`: Verifica si `id_rol === 1` o rol 'Administrador'.
  - `saveSession(user, token)`: Encripta y persiste la sesión y el token.
  - `clearSession()`: Destruye las llaves de sesión y resetea la señal reactiva.

---

### 3. `AccessibilityService` (`src/app/services/accessibility.service.ts`)
Controla de forma reactiva y centralizada todos los ajustes de accesibilidad de la aplicación:
- **Signals y Estado:**
  - `fontSize = signal<number>(100)`: Tamaño relativo de fuente (`90%` a `140%`).
  - `colorFilter = signal<ColorFilterType>('none')`: Filtro de daltonismo o contraste activo.
  - `dyslexicFont = signal<boolean>(false)`: Indicador de fuente adaptada para dislexia (Lexend).
  - `enhancedSpacing = signal<boolean>(false)`: Mayor separación de líneas y caracteres.
  - `isMenuOpen = signal<boolean>(false)`: Estado de apertura del panel emergente.
- **Efectos DOM Reactivos (`effect`):**
  - Aplica dinámicamente las clases de filtros (`filter-protanopia`, `filter-deuteranopia`, etc.) y fuentes al elemento raíz `<html>`.
- **Persistencia:**
  - Guarda y restaura automáticamente las preferencias desde `localStorage` bajo la clave `sigris_accessibility`.

---

## 🛡️ Guards de Enrutamiento

### 1. `userGuard` (`src/app/guards/auth.guard.ts`)
- **Protege:** `/erp`, `/nuevo-registro` y rutas del sistema.
- **Regla:** Verifica que `authService.isLoggedIn()` sea `true`. Si no lo está, redirige a `/login`.

### 2. `adminGuard` (`src/app/guards/admin.guard.ts`)
- **Protege:** `/admin` (Panel de Usuarios).
- **Regla:** Verifica que el usuario autenticado tenga permisos de administrador con `authService.isAdmin()`. Si no lo es, redirige a `/erp`.

### 3. `guestGuard` (`src/app/guards/guest.guard.ts`)
- **Protege:** `/login`, `/registro`.
- **Regla:** Impide que usuarios ya autenticados vuelvan a ingresar al login, redirigiéndolos al `/erp`.
