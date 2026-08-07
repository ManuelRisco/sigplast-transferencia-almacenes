# Documentación de Componentes - Frontend Angular 22

Los componentes en **SIGRIS** están construidos siguiendo el estándar **Standalone Components** de Angular 22, con inyección moderna `inject()`, Signals reactivas y persistencia de estado con `localStorage`.

---

## 📌 Relaciones y Dependencias
- **Inyección de Servicios:** Utilizan `ApiService` y `AuthService` descritos en [[Frontend/Doc_Servicios_Guards]].
- **Estructura de Navegación:** Integrados con el menú lateral de [[Frontend/Doc_Sidebar_Navegacion]].
- **Consumo de APIs Backend:** Se comunican con los endpoints de [[Backend/Doc_API_Endpoints_JSON]].
- **Visión Global:** Ver arquitectura general en [[Arquitectura/Arquitectura_Angular22_PHP]].

---

## 🧩 Catálogo de Componentes

### 1. `MovimientosComponent` (Notas de Salidas)
- **Ruta:** `/erp` (Protegida con `userGuard`)
- **Propósito:** Visualización masiva de movimientos de almacén, filtros por periodo y maestro-detalle dinámico.
- **Características Clave:**
  - **Filtros Reactivos:** Almacén (consultado de `mae_almacen`), Año y Mes.
  - **Paginación Unificada (Server-Side):** Solicita lotes de datos limitados al backend y lee `total_records` para construir los botones de cambio de página.
  - **Persistencia LocalStorage:** Conserva el almacén, año, mes, filas y página seleccionada al presionar F5.
  - **Subtabla Maestro-Detalle:** Carga bajo demanda (`Lazy Loading`) de los 8 campos de detalle mediante [[Backend/Doc_API_Endpoints_JSON#detallephp]].
  - **Exportar a Excel:** Copia en formato TSV al portapapeles conservando ceros a la izquierda (copia la página visible actual).
  - **Rendimiento OnPush:** Utiliza `ChangeDetectionStrategy.OnPush` para evitar recálculos en el navegador, redibujando solo cuando cambian las dependencias o el usuario interactúa.

---

### 2. `NuevoRegistroComponent` (Registro de Salidas y Transferencias)
- **Ruta:** `/nuevo-registro` (Protegida con `userGuard`)
- **Propósito:** Creación de guías de salida y transferencias entre almacenes.
- **Características Clave:**
  - **Sincronización de Almacén:** Nombre oficial idéntico al seleccionado en Notas de Salida.
  - **Tipos de Movimiento:** Lista dinámica desde `mae_tpomov` con orden `DESC` para priorizar `102 - TRANSFERENCIA ENTRE ALMACENES`.
  - **Modal de Búsqueda de Artículos Inteligente:** 
    - Implementa un buscador con **RxJS Subject y `debounceTime(300)`**, que envía la petición al backend solo tras 300ms de inactividad, logrando una búsqueda en tiempo real eficiente.
    - Utiliza **Server-Side Pagination** para navegar entre cientos de resultados de artículos de manera ultra fluida.
  - **Persistencia en LocalStorage:** La grilla de artículos agregados, cantidades, glosa y tipo de movimiento se guardan automáticamente, evitando pérdidas de datos por recarga accidental (F5).
  - **Botón Limpiar Todo:** Permite reiniciar el formulario a estado en blanco.
  - **Rendimiento OnPush:** Utiliza `ChangeDetectionStrategy.OnPush` que en un formulario gigante reduce drásticamente el uso de CPU.

---

### 3. `AdminUsuariosComponent` (Panel de Administración)
- **Ruta:** `/admin` (Protegida con `adminGuard`)
- **Propósito:** Gestión de cuentas de usuario, asignación de roles y estados.
- **Características Clave:**
  - **Reseteo Seguro de Clave:** Encriptación con BCRYPT mediante [[Backend/Doc_Seguridad_BCRYPT]].
  - **Bloqueo de Autodesactivación:** Impide que el administrador conectado desactive su propia cuenta.
  - **Modal de Edición:** Actualización reactiva de nombre, apellidos, usuario y rol.

---

### 4. `LoginComponent` y `RegistroComponent`
- **Rutas:** `/login` y `/registro`
- **Propósito:** Autenticación y registro de nuevos usuarios en el sistema.
- **Seguridad:** Asignación automática del rol `Usuario` (id: 2) y validación de hash BCRYPT.
