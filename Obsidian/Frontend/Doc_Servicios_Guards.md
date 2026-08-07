# Servicios y Guards - Frontend Angular 22

Este documento detalla la capa de comunicación HTTP, manejo reactivo del estado de sesión y protección de rutas del frontend.

---

## 📌 Relaciones y Dependencias
- **Consumido por Componentes:** [[Frontend/Doc_Componentes_Angular]].
- **Utilizado en Navegación:** [[Frontend/Doc_Sidebar_Navegacion]].
- **Endpoints de Conexión:** [[Backend/Doc_API_Endpoints_JSON]].
- **Políticas de Seguridad y Token:** [[Backend/Doc_Seguridad_BCRYPT]].

---

## ⚙️ Servicios

### 1. `ApiService` (`src/app/services/api.service.ts`)
Encargado de centralizar todas las peticiones hacia la API REST en PHP.
- **Mecanismo de Fallback:** Si la URL primaria (`/sigris/backend/api`) falla, conmuta automáticamente a la secundaria (`/prueba/sigris/backend/api`) mediante operadores `RxJS` (`catchError`).
- **Métodos Principales:**
  - `login(payload)`: Envío de credenciales a `api/auth/login.php`.
  - `registro(payload)`: Creación de cuentas en `api/auth/registro.php`.
  - `getMovimientos(alm, anho, mes)`: Consulta a `api/erp/movimientos.php`.
  - `getDetalle(emp_codigo, mov_id)`: Consulta a `api/erp/detalle.php`.
  - `getTiposMovimiento()`: Consulta tipos a `api/erp/articulos.php?accion=tipos_mov`.
  - `buscarArticulos(alm, query)`: Búsqueda paginada en `api/erp/articulos.php`.
  - `getUsuarios()` y `procesarUsuario()`: Gestión de cuentas en `api/admin/usuarios.php`.

---

### 2. `AuthService` (`src/app/services/auth.service.ts`)
Gestiona el estado reactivo del usuario conectado utilizando **Angular Signals** y `localStorage`:
- **Signal `usuarioActual`**: Señal reactiva que almacena `{ id, username, rol, id_rol, nombre_completo }`.
- **Signal `estaAutenticado`**: Estado booleano computado en tiempo real.
- **Signal `esAdmin`**: Verifica si `id_rol === 1` para habilitar accesos de administración.
- **`cerrarSesion()`**: Limpia el almacenamiento local y redirige a `/login`.

---

## 🛡️ Guards de Enrutamiento

### 1. `userGuard` (`src/app/guards/auth.guard.ts`)
- **Protege:** `/erp`, `/nuevo-registro` y rutas protegidas generales.
- **Regla:** Verifica que `authService.estaAutenticado()` sea `true`. Si no lo está, redirige inmediatamente a `/login`.

### 2. `adminGuard` (`src/app/guards/admin.guard.ts`)
- **Protege:** `/admin` (Panel de Usuarios).
- **Regla:** Verifica que el usuario autenticado tenga `id_rol === 1`. Si no es administrador, bloquea el acceso y redirige a `/erp`.
