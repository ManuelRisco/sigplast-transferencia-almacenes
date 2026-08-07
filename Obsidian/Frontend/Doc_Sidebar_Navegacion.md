# Sidebar y Sistema de Navegación - Frontend Angular 22

El componente **`SidebarComponent`** (`src/app/components/sidebar/sidebar.component.ts`) provee la navegación principal, responsiva y adaptable de la plataforma **SIGRIS**.

---

## 📌 Relaciones y Dependencias
- **Integrado en Vistas:** Utilizado como cabecera/sidebar en todos los componentes de [[Frontend/Doc_Componentes_Angular]].
- **Estado de Usuario:** Lee la sesión y permisos desde `AuthService` en [[Frontend/Doc_Servicios_Guards]].
- **Roles y Permisos:** Control de visibilidad para Administradores vs Usuarios según [[Backend/Doc_Seguridad_BCRYPT]].

---

## 📐 Diseño y Comportamiento

1. **Ubicación y Despliegue:**
   - Barra lateral anclada a la izquierda de la pantalla (`left: 0`).
   - Botón hamburguesa accesible en la barra superior con animación suave.
   - Panel desplegable con transición `translateX` y efecto de desenfoque de fondo (`backdrop-blur`).

2. **Enlaces y Menús Dinámicos:**
   - **Notas de Salidas:** Acceso directo a `/erp`.
   - **Nuevo Registro:** Acceso a `/nuevo-registro`.
   - **Panel de Usuarios:** Visible **únicamente** si `authService.esAdmin()` es verdadero.
   - **Cerrar Sesión:** Llama a `authService.cerrarSesion()`, limpiando `localStorage` y redirigiendo a `/login`.

3. **Perfil del Usuario:**
   - Muestra el nombre completo, nombre de usuario y badge del rol (`Administrador` o `Usuario`) en la parte inferior del menú.
