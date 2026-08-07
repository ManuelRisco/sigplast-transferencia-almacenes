# Bitácora de Desarrollo - Proyecto SIGRIS ERP

## 📌 Índice de Documentación (Map of Content)
- **Arquitectura Desacoplada:**
  - [[Arquitectura/Arquitectura_Angular22_PHP]]
- **Frontend (Angular 22):**
  - [[Frontend/Doc_Componentes_Angular]]
  - [[Frontend/Doc_Servicios_Guards]]
  - [[Frontend/Doc_Sidebar_Navegacion]]
- **Backend (API REST PHP):**
  - [[Backend/Doc_API_Endpoints_JSON]]
  - [[Backend/Doc_Seguridad_BCRYPT]]
- **Bases de Datos:**
  - [[Base_de_Datos/Doc_Esquema_SQLServer_MySQL]]

---

## 📅 Historial de Hitos y Desarrollo

### 🔹 Fase 1: Fundamentos y Maquetación Inicial (PHP Tradicional + SQL Server ERP)
- **Implementación Maestro-Detalle AJAX**: Se diseñó la carga perezosa (Lazy Loading) de las líneas de ítem de movimientos leyendo `log_cabmov` y `log_detmov` en SQL Server (`TECNOTEST`).
- **Diseño Estilo Hoja de Cálculo**: Maquetación con densidad de datos, fijación de cabeceras (`sticky`) y visualización clara para +100 columnas.
- **Botón Copiar Tabla a Excel**: Exportación limpia a hojas de cálculo formateando datos como texto para evitar pérdida de ceros a la izquierda y notaciones científicas.
- **Filtros de Almacén, Año y Mes**: Filtrado interactivo restringido a almacenes principales (`001 ALMACEN VERDE MP`, `002`, `016`) y llenado dinámico de periodos.
- **Módulo Nuevo Registro**: Pantalla interactiva con modal de búsqueda de artículos por código EAN o descripción, además de selección modal de lotes activos.

---

### 🔹 Fase 2: Autenticación, Seguridad y Segunda Base de Datos (MySQL `tf_almacen`)
- **Doble Conexión Híbrida**: Configuración simultánea en PHP para consultar **SQL Server** (ERP) y **MySQL local** (`tf_almacen`).
- **Seguridad BCRYPT**:
  - Implementación de `password_hash()` BCRYPT durante el registro.
  - Validación de contraseña con `password_verify()`.
  - Migración y rehash automático transparente en el inicio de sesión para cuentas legadas que tuvieran contraseñas en texto plano.
- **Auto-asignación de Rol**: Eliminación del campo de rol en el registro público, garantizando la asignación automática del rol **"Usuario"**.
- **Panel de Administración**: Vista para listar cuentas, editar información personal, cambiar roles, resetear contraseñas con Hash BCRYPT y activar/desactivar usuarios (**bloqueando la autodesactivación de la cuenta del administrador conectado**).
- **Invalidador de Sesiones**: Verificación en tiempo real en la base de datos que expulsa a un usuario activo de forma inmediata si se cambia su contraseña, rol o estado.
- **Sidebar Vertical Izquierdo Deslizante**: Menú responsivo con botón hamburguesa, overlay con desenfoque de fondo (`backdrop-blur`) y animación suave `translateX`.

---

### 🔹 Fase 3: Cambio Masivo de Arquitectura a SIGRIS (Backend API REST + Frontend Angular 22)
Se realizó la reestructuración y migración completa del sistema a la ruta del cliente:
`C:\Users\manue\OneDrive\Desktop\TRABAJO\PAGINAS\SIGRIS\`

#### 🟢 Backend REST API (`SIGRIS/backend/`)
Los scripts PHP se reescribieron como controladores de API puramente RESTful que devuelven JSON e incorporan cabeceras CORS (`Access-Control-Allow-Origin: *`):
- `config/conexion.php`: Inicialización dual de conexiones MySQL y SQL Server con tratamiento de errores JSON.
- `api/auth/login.php`: Endpoint POST de autenticación JSON con emisión de token de sesión.
- `api/auth/registro.php`: Endpoint POST de creación de cuentas con Hash BCRYPT.
- `api/erp/movimientos.php`: Endpoint GET para lista de notas de salida con filtros de almacén, año y mes.
- `api/erp/detalle.php`: Endpoint GET maestro-detalle de ítems de una nota.
- `api/erp/articulos.php`: Endpoint GET de búsqueda de catálogo y lotes disponibles.
- `api/admin/usuarios.php`: Endpoint POST/GET para administración de cuentas de usuario.

#### 🅰️ Frontend Angular 22 (`SIGRIS/frontend/`)
Proyecto cliente independiente construido con el cliente de Angular 22, utilizando componentes standalone, señales (`Signals`), servicios y Tailwind CSS:
- **`SidebarComponent`**: Menú de navegación vertical con botón hamburguesa, estado desplegable y perfil del usuario autenticado.
- **`LoginComponent`**: Formulario de inicio de sesión con alertas y toggle de contraseña.
- **`RegistroComponent`**: Registro de usuarios con validaciones del cliente.
- **`MovimientosComponent`**: Notas de Salida ERP con filtros, maestro-detalle expansible y botón de copiado a Excel.
- **`NuevoRegistroComponent`**: Formulario de nuevos movimientos con modales de búsqueda de productos ERP y lotes.
- **`AdminUsuariosComponent`**: Panel de usuarios con modales de edición, reseteo de clave BCRYPT y toggle de estado.
- **Servicios e Inyección**:
  - `AuthService`: Manejo de estado de usuario con Signals y almacenamiento local.
  - `ApiService`: Inyección de `HttpClient` con `provideHttpClient(withFetch())`.
  - `userGuard` & `adminGuard`: Protección de rutas y permisos por rol.

---

### 🔹 Fase 4: Perfeccionamiento de Salidas, Nuevo Registro y Paginación Unificada
- **Sincronización Dinámica de Almacenes**: Consulta directa a `mae_almacen` para que los nombres de los almacenes (`ALMACEN VERDE MP`, `ALMACEN PRODUCTOS TERMINADOS`, `ALMACEN PLANTA ROJA MP`) coincidan al 100% entre *Notas de Salidas* y *Nuevo Registro*.
- **Orden de Tipos de Movimiento**: Consulta a `mae_tpomov` ordenada con `ORDER BY tmo_nombre DESC` para situar **`102 - TRANSFERENCIA ENTRE ALMACENES`** en primer lugar.
- **Búsqueda Robusta por Almacén**:
  - Conexión con `mae_almtpoart` (`mta.alm_codigo = ?`) y `log_stkart`.
  - Carga inmediata del catálogo del almacén seleccionado al abrir el modal con el botón **"<u>N</u>uevo"**.
  - Soporte de búsqueda por texto y lector de código de barras (`art_codean`).
- **Paginación Unificada y Consistente**:
  - Diseño unificado de barra inferior simple con selector de filas (`10, 20, 50, 100`), rango visible (`Mostrando X - Y de Z registros`) y navegación (`‹ Anterior`, `Pág X / Y`, `Siguiente ›`).
  - Aplicada de forma idéntica en la tabla de **Notas de Salidas** y en el modal de **Artículos de Nuevo Registro**.

---

### 🔹 Fase 5: Persistencia Integral con LocalStorage (Resistencia a F5 / Recarga)
- **Persistencia en Notas de Salida (`MovimientosComponent`)**:
  - Almacén seleccionado (`sigris_mov_almacen`).
  - Periodo activo: Año (`sigris_mov_anho`) y Mes (`sigris_mov_mes`).
  - Filas por página (`sigris_mov_filas`) y Número de página actual (`sigris_mov_pagina`).
  - Al presionar **F5**, la vista se restaura de inmediato con el filtro, página y datos intactos.
- **Persistencia en Nuevo Registro (`NuevoRegistroComponent`)**:
  - Almacén origen (`sigris_nr_almacen`) y Almacén destino (`sigris_nr_alm_destino`).
  - Tipo de movimiento (`sigris_nr_tipo_mov`) y Fecha de emisión (`sigris_nr_fecha_emision`).
  - Glosa / Observación (`sigris_nr_glosa`).
  - **Grilla de Artículos Agregados (`sigris_nr_items`)**: Guarda todos los artículos seleccionados, cantidades editadas y selecciones. Al dar F5, no se pierde ningún ítem cargado.
  - Paginación del modal de artículos (`sigris_modal_art_filas`).
  - Botón **"🗑️ Limpiar Todo"** para reiniciar el formulario cuando se desee iniciar un nuevo registro en blanco.

---

### 🔹 Fase 6: Protección de Rutas y Sesión
- **Manejo de Sesión Local**: Se almacena un token y la información del usuario de manera segura en `localStorage` desde `AuthService`.
- **Guards Funcionales (Angular 22)**:
  - `userGuard`: Verifica que el usuario tenga sesión activa, si no, lo expulsa hacia `/login`. Protege `/erp` y `/nuevo-registro`.
  - `adminGuard`: Extiende `userGuard` verificando también el rol de Administrador. Protege `/admin`.
  - `guestGuard`: Bloquea acceso a `/login` y `/registro` para usuarios que ya tienen sesión, redirigiéndolos al `/erp`.
- **Destrucción de Sesión**: Al hacer click en *Cerrar Sesión* (`SidebarComponent`), se llama a `clearSession()`, que elimina de inmediato las variables del almacenamiento local. El navegador automáticamente previene regresar hacia las rutas protegidas, forzando un nuevo inicio de sesión.

---

### 🔹 Fase 7: Optimización de Rendimiento Frontend y Backend
- **Server-Side Pagination (SQL Server):**
  - Se modificaron los endpoints de lectura masiva (`movimientos.php` y `articulos.php`) para reemplazar la técnica de envío completo o masivo `TOP(1000)` por la lectura paginada.
  - Implementación de `COUNT(*)` en tiempo real y lectura de bloques con sentencias modernas de SQL Server: `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`.
  - El frontend ahora arma su paginador usando la cantidad `total_records` real y solicitando únicamente la página visible actual, ahorrando megabytes en transferencia.
- **Renderizado Reactivo OnPush:**
  - `MovimientosComponent` y `NuevoRegistroComponent` ahora utilizan `ChangeDetectionStrategy.OnPush`, reduciendo en gran medida el tiempo de renderización y liberando carga del CPU en el navegador al impedir escaneos inútiles del DOM.
- **Buscador Inteligente con Debounce (RxJS):**
  - El modal del catálogo de artículos sustituyó la búsqueda instantánea manual por un `Subject` de `RxJS` con `debounceTime(300)`. Angular escucha el tipeo, pero espera 300 milisegundos tras la última tecla pulsada para realizar el disparo real a la API, brindando la sensación de un buscador automático pero sin ahogar el servidor.
- **Compresión de Red (GZIP):**
  - Implementación de un `.htaccess` con `mod_deflate` a nivel de API para comprimir los pesados arrays en formato JSON antes de viajar hacia el navegador, reduciendo el peso de la petición en más de un 70%.

> [!WARNING] **Troubleshooting: Sincronización XAMPP**
> Si el frontend de Angular (al consultar la API en `localhost/sigris` o `localhost/prueba/sigris`) recibe datos masivos ignorando la paginación, asegúrese de que los archivos PHP modificados en el entorno de desarrollo (ej. `Desktop`) hayan sido copiados/sincronizados al directorio activo de XAMPP (`c:\xampp\htdocs\sigris` o `c:\xampp\htdocs\prueba\sigris`). La falta de sincronización provoca que el frontend nuevo reciba la respuesta de la API antigua (sin `total_records`), rompiendo la tabla y mostrando todos los registros en una sola vista.
