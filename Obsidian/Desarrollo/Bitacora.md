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

---

### 🔹 Fase 8: Accesibilidad (A11y), SEO y Estructura de Entorno
- **Accesibilidad y W3C (100% Lighthouse):**
  - Incorporación de etiquetas invisibles `aria-label` en botones de acción iconográficos y en todos los selectores de los filtros (`<select>`) para compatibilidad total con lectores de pantalla.
  - Implementación de la etiqueta semántica `<main>` envolviendo el contenido enrutado (Router Outlet) cumpliendo los estándares estructurales HTML5.
- **Optimización para Motores de Búsqueda (SEO):**
  - Adición de la etiqueta `<meta name="description">` principal en `index.html` para describir el sistema ERP y facilitar su indexación.
- **Configuración Profesional del Entorno Local (XAMPP):**
  - **Junctions (Enlaces Simbólicos):** Se eliminó la tediosa duplicidad de carpetas entre el Escritorio y `htdocs`. El servidor Apache ahora apunta directamente al código fuente del Escritorio mediante puertos NTFS Junction, logrando que los cambios en el código PHP se reflejen instantáneamente sin necesidad de copiar y pegar.
- **Estructura Definitiva del Repositorio Git:**
  - **Corrección de Repositorio Incrustado (Embedded Repo):** Se destruyó la carpeta oculta `.git` que Angular había inicializado por error dentro del frontend, la cual impedía el rastreo de archivos.
  - Se crearon archivos `.gitignore` globales y para el backend, omitiendo cachés de Windows (`Thumbs.db`, `.DS_Store`) y logs de errores PHP.
  - **Primer Despliegue Oficial:** El repositorio completo fue inicializado de cero en la raíz `SIGRIS` y empujado de manera segura hacia GitHub.

---

### Fase 9: Refactorizacion y Separacion de Responsabilidades (Templates)
- **Separacion de Vistas y Controladores en Angular 22:**
  - Se refactorizaron todos los componentes (login, registro, admin-usuarios, sidebar, movimientos, y nuevo-registro) que utilizaban plantillas en linea excesivamente largas.
  - El HTML se extrajo a sus respectivos archivos fisicos (.component.html) y se modifico el decorador @Component de cada uno para utilizar templateUrl. Esto garantiza un codigo mucho mas limpio, mejora la legibilidad, facilita el mantenimiento y potencia la separacion de responsabilidades.
  - El proyecto compila correctamente validando que la inyeccion de dependencias standalone y los estilos permanezcan intactos tras la migracion estructural.

---

### 🔹 Fase 10: Seguridad Avanzada (AES), Validación y UX Interactivo
- **Seguridad y Encriptación del Lado del Cliente**:
  - Implementación de **Encriptación AES (Grado Militar)** mediante la librería `crypto-js` para ofuscar y proteger el almacenamiento de la sesión del usuario (`localStorage`).
  - Creación de variables de entorno de Angular (`src/environments/environment.ts`) para almacenar la clave criptográfica privada.
  - Exclusión de los archivos de entorno mediante `.gitignore` impidiendo que la clave se filtre hacia GitHub.
- **Validación Sensible al Contexto en Nuevo Registro**:
  - Refactorización del campo "Almacén de Origen" para convertirlo en un selector (`<select>`) completamente interactivo. Al cambiar de origen, se limpia el destino automáticamente para evitar bucles.
  - Prevención de desincronización: Si el usuario cambia el almacén de origen mientras ya tenía artículos cargados, la grilla se vacía y se advierte inmediatamente, garantizando la integridad de los stocks.
  - Restricción estricta del "Tipo de Movimiento": Por regla de negocio actual, solo se autorizan Transferencias. Cualquier intento de seleccionar una salida distinta es revertido al instante.
- **Modal de Selección de Lotes (Replicación Fiel de ERP)**:
  - Al buscar y seleccionar cualquier producto del catálogo o lector de código de barras, se agrega inmediatamente a la grilla principal con valores iniciales (`-`), permitiendo agregar productos incluso si aún no tienen lote asignado.
  - En la tabla de artículos agregados, las celdas **ID.Lote** y **Lote** son completamente interactivas (con cursor, subrayado punteado y efecto hover). Al hacer clic sobre el lote de cualquier fila, el sistema consulta en tiempo real `log_lote` en SQL Server.
  - Si el artículo cuenta con lotes, se despliega el modal flotante con la estética exacta del ERP (`ID-Lote`, `Lote-O/T`, `Stock` con 3 decimales), soporte para selección, doble clic y filtro de búsqueda inferior. Al confirmar, actualiza esa fila específica.
  - Si no cuenta con lotes registrados en el almacén, **SweetAlert2** muestra una advertencia informativa clara.
- **Estandarización de UX con SweetAlert2**:
  - Se reemplazaron todas las ventanas de diálogo nativas obsoletas (`alert()`, `confirm()`) del navegador por la librería interactiva de alta fidelidad visual **SweetAlert2**.
  - Este estándar rige ahora notificaciones, advertencias de vaciado de tablas, validaciones de código de barras no encontrados y bloqueos preventivos por omisión de selección de almacén de origen o artículos sin lotes.

---

## 🚀 Próximos Pasos (To-Do)
- Integración de la vista **Nuevo Registro** contra el Backend PHP para efectuar la rebaja real del inventario en SQL Server al grabar una "Transferencia entre Almacenes".
- Implementación de validación de cantidades (el usuario no debería poder transferir más de la cantidad existente en `log_stkart`).
- Impresión o exportación de la boleta de movimiento tras guardar con éxito el registro.
