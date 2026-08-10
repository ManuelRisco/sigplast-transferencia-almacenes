# Sidebar y Sistema de Navegación - Frontend Angular 22

La arquitectura de navegación y maquetación de **SIGRIS** se organiza en componentes modulares e independientes sincronizados mediante **Angular Signals**:

---

## 📌 Componentes y Servicios del Layout
- **`SidebarComponent`** (`src/app/components/sidebar/`): Provee el menú lateral deslizable (`<aside>`) y el layout Flexbox contenedor.
- **`NavbarComponent`** (`src/app/components/navbar/`): Provee el encabezado superior (`<header>`) con el botón hamburguesa, logo institucional, módulo de accesibilidad y acciones de usuario.
- **`SidebarService`** (`src/app/services/sidebar.service.ts`): Servicio reactivo con Signal `isOpen` que sincroniza el estado entre el Navbar y el Sidebar, persistiendo en `localStorage`.

---

## 📐 Diseño y Arquitectura de Layout (Push Layout)

1. **Patrón Wrapper y Componentes Separados:**
   - `SidebarComponent` actúa como contenedor Flexbox maestro que proyecta las vistas mediante `<ng-content>`.
   - Incorpora el componente independiente `<app-navbar></app-navbar>` en la parte superior.

2. **Comportamiento Push (Desplazamiento Dinámico):**
   - El sidebar lateral transiciona suavemente de `w-0` a `w-72` (`288px`), empujando el contenido hacia la derecha sin superponerse sobre tablas ni formularios.
   - El estado es gobernado reactivamente por `sidebarService.isOpen()`.

3. **Persistencia de Posición (LocalStorage):**
   - El estado abierto/cerrado se almacena bajo la clave `sigris_sidebar_open` en `localStorage`.
   - Al recargar la página (F5) o cambiar de módulo, el sidebar recuerda y conserva exactamente la posición en la que el usuario lo dejó.

4. **Enlaces y Menús Dinámicos (Sidebar):**
   - **Notas de Salidas:** Acceso directo a `/erp`.
   - **Nuevo Registro:** Acceso a `/nuevo-registro`.
   - **Panel de Usuarios:** Visible **únicamente** si `authService.isAdmin()` es verdadero.
   - **Cerrar Sesión:** Llama a `authService.clearSession()`, destruyendo las variables encriptadas en `localStorage` y redirigiendo a `/login`.

5. **Módulo de Accesibilidad Integrado en Navbar:**
   - El componente `NavbarComponent` aloja el widget de accesibilidad universal (`AccessibilityWidgetComponent`), manteniendo el menú limpio, minimalista y con tema Dark Slate.
