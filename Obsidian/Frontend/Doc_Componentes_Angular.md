# Documentación de Componentes - Frontend Angular 22

Los componentes en **SIGRIS** están construidos siguiendo el estándar **Standalone Components** de Angular 22, con inyección moderna `inject()`, Signals reactivas, plantillas físicas separadas (`templateUrl`), alertas estandarizadas con **SweetAlert2** y persistencia de estado con `localStorage`.

---

## 📌 Relaciones y Dependencias
- **Inyección de Servicios:** Utilizan `ApiService` y `AuthService` descritos en [[Frontend/Doc_Servicios_Guards]].
- **Estructura de Navegación:** Integrados dentro del contenedor maestro [[Frontend/Doc_Sidebar_Navegacion]].
- **Consumo de APIs Backend:** Se comunican con los endpoints de [[Backend/Doc_API_Endpoints_JSON]].
- **Visión Global:** Ver arquitectura general en [[Arquitectura/Arquitectura_Angular22_PHP]].

---

## 🧱 Arquitectura de Vistas (Separación de Responsabilidades)
Todos los componentes del sistema tienen sus vistas desacopladas en archivos HTML físicos independientes (`.component.html`) vinculados mediante la propiedad `templateUrl` en el decorador `@Component`. Esto asegura legibilidad, facilidad de mantenimiento y desacoplamiento limpio entre lógica y presentación.

---

## 🧩 Catálogo de Componentes

### 1. `MovimientosComponent` (Notas de Salidas)
- **Ruta:** `/erp` (Protegida con `userGuard`)
- **Archivos:** `movimientos.component.ts`, `movimientos.component.html`
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
- **Archivos:** `nuevo-registro.component.ts`, `nuevo-registro.component.html`
- **Propósito:** Creación de guías de salida y transferencias entre almacenes con selección de lotes y validaciones de negocio.
- **Características Clave:**
  - **Selector de Almacén Dinámico:** Almacén de origen seleccionable mediante `<select>`. Si el usuario cambia de almacén con artículos ya agregados, el sistema advierte mediante SweetAlert2 y limpia la grilla para prevenir inconsistencias de stock.
  - **Restricción de Tipo de Movimiento:** Valida que solo se ejecuten transferencias entre almacenes (`102 - TRANSFERENCIA ENTRE ALMACENES`). Si se elige otro tipo de salida, SweetAlert2 cancela la acción y revierte la selección automáticamente.
  - **Modal de Búsqueda de Artículos Inteligente:** 
    - Buscador con **RxJS Subject y `debounceTime(300)`**, que envía la petición al backend solo tras 300ms de inactividad.
    - **Server-Side Pagination** unificada para navegar entre cientos de resultados de artículos.
    - Agregado directo e inmediato del artículo a la grilla con valores iniciales (`-`), permitiendo agregar productos incluso antes de definir su lote.
  - **Modal de Selección de Lotes (Estilo ERP):**
    - Las celdas `ID.Lote` y `Lote` en la tabla principal son interactivas (cliqueables con cursor y subrayado).
    - Al hacer clic en el lote de cualquier fila, consulta `log_lote` en tiempo real para ese artículo y almacén.
    - Si cuenta con lotes, despliega el modal estilo ERP con columnas: `ID-Lote`, `Lote-O/T` y `Stock` (3 decimales), soporte de selección con resalte azul, doble clic y filtro de texto inferior.
    - Si no tiene lotes registrados, notifica al usuario con SweetAlert2.
  - **Persistencia en LocalStorage:** La grilla de artículos agregados, cantidades, glosa, almacén y tipo de movimiento se guardan automáticamente, resistiendo recargas (F5).
  - **Botón Limpiar Todo:** Confirmación interactiva con SweetAlert2 para vaciar el formulario.
  - **Rendimiento OnPush:** `ChangeDetectionStrategy.OnPush` para máxima velocidad de respuesta.

---

### 3. `AdminUsuariosComponent` (Panel de Administración)
- **Ruta:** `/admin` (Protegida con `adminGuard`)
- **Archivos:** `admin-usuarios.component.ts`, `admin-usuarios.component.html`
- **Propósito:** Gestión de cuentas de usuario, asignación de roles y estados.
- **Características Clave:**
  - **Reseteo Seguro de Clave:** Encriptación con BCRYPT mediante [[Backend/Doc_Seguridad_BCRYPT]].
  - **Bloqueo de Autodesactivación:** Impide que el administrador conectado desactive su propia cuenta.
  - **Modal de Edición:** Actualización reactiva de nombre, apellidos, usuario y rol.

---

### 4. `SidebarComponent` (Layout Maestro)
- **Archivos:** `sidebar.component.ts`, `sidebar.component.html`
- **Propósito:** Envoltorio maestro del layout con navegación push deslizante. Detalles en [[Frontend/Doc_Sidebar_Navegacion]].

---

### 5. `LoginComponent` y `RegistroComponent`
- **Rutas:** `/login` y `/registro`
- **Archivos:** `login.component.ts`, `login.component.html`, `registro.component.ts`, `registro.component.html`
- **Propósito:** Autenticación y registro de nuevos usuarios en el sistema.
- **Seguridad:** Asignación automática del rol `Usuario` (id: 2) y validación de hash BCRYPT.
