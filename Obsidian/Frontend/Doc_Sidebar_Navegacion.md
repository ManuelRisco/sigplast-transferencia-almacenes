# Sidebar y Sistema de Navegación - Frontend Angular 22

El componente **`SidebarComponent`** (`src/app/components/sidebar/sidebar.component.ts` y `sidebar.component.html`) provee el layout maestro y la navegación responsiva de la plataforma **SIGRIS**.

---

## 📌 Relaciones y Dependencias
- **Layout Contenedor:** Envuelve mediante `<ng-content>` las vistas principales de [[Frontend/Doc_Componentes_Angular]].
- **Estado de Usuario:** Lee la sesión encriptada y permisos desde `AuthService` en [[Frontend/Doc_Servicios_Guards]].
- **Roles y Permisos:** Control de visibilidad de módulos para Administradores vs Usuarios según [[Backend/Doc_Seguridad_BCRYPT]].

---

## 📐 Diseño y Arquitectura de Layout (Push Layout)

1. **Patrón Wrapper (Contenedor Maestro):**
   - El `SidebarComponent` actúa como un layout Flexbox de envoltura para la aplicación.
   - Aloja el Header superior y el área de contenido principal (`<main>`), proyectando el contenido de las vistas mediante `<ng-content>`.

2. **Comportamiento Push (Desplazamiento Dinámico):**
   - A diferencia de los menús flotantes tradicionales que se superponen tapando la pantalla, este sidebar **empuja el contenido hacia la derecha**.
   - El elemento `<aside>` transiciona suavemente de `w-0` a `w-72` (`288px`), adaptando el ancho del contenido principal sin tapar tablas ni formularios.
   - El borde lateral derecho se oculta automáticamente al cerrarse (`[class.border-r]="isOpen"`) para evitar artefactos visuales o líneas residuales.

3. **Persistencia de Posición (LocalStorage):**
   - El estado abierto/cerrado se almacena bajo la clave `sigris_sidebar_open` en `localStorage`.
   - Al recargar la página (F5) o cambiar de módulo, el sidebar recuerda y conserva exactamente la posición en la que el usuario lo dejó.
   - La navegación entre enlaces de escritorio no fuerza el cierre automático del menú, permitiendo trabajar cómodamente con el panel lateral abierto.

4. **Enlaces y Menús Dinámicos:**
   - **Notas de Salidas:** Acceso directo a `/erp`.
   - **Nuevo Registro:** Acceso a `/nuevo-registro`.
   - **Panel de Usuarios:** Visible **únicamente** si `authService.isAdmin()` es verdadero.
   - **Cerrar Sesión:** Llama a `authService.clearSession()`, destruyendo las variables encriptadas en `localStorage` y redirigiendo a `/login`.

5. **Perfil del Usuario:**
   - Muestra el nombre completo, inicial del avatar y badge del rol (`Administrador` o `Usuario`) en la parte inferior del menú lateral.
