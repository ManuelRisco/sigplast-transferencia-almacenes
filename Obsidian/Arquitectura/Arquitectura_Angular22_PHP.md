# Arquitectura Desacoplada: Frontend Angular 22 + Backend API REST PHP

## 📐 Visión General de la Arquitectura

El sistema **SIGRIS** utiliza un patrón de arquitectura desacoplada SPA (Single Page Application) donde el cliente web y los servicios de backend operan de forma independiente:

```mermaid
graph TD
    A[Cliente Web: Angular 22] -->|HTTP GET / POST JSON| B[Backend API: PHP RESTful]
    B -->|sqlsrv_query| C[(SQL Server ERP - TECNOTEST)]
    B -->|mysqli_query| D[(MySQL Local - tf_almacen)]
    
    subgraph Frontend
        A --> E[Componentes: [[Frontend/Doc_Componentes_Angular]]]
        A --> F[Servicios y Guards: [[Frontend/Doc_Servicios_Guards]]]
        A --> G[Navegación: [[Frontend/Doc_Sidebar_Navegacion]]]
    end

    subgraph Backend
        B --> H[Endpoints JSON: [[Backend/Doc_API_Endpoints_JSON]]]
        B --> I[Seguridad BCRYPT: [[Backend/Doc_Seguridad_BCRYPT]]]
    end

    subgraph Bases de Datos
        C --> J[Esquema Híbrido: [[Base_de_Datos/Doc_Esquema_SQLServer_MySQL]]]
        D --> J
    end
```

---

## 🔗 Conexiones y Módulos Relacionados
- **Para la gestión de interfaces y pantallas:** Consultar [[Frontend/Doc_Componentes_Angular]].
- **Para el consumo HTTP y estado reactivo:** Consultar [[Frontend/Doc_Servicios_Guards]].
- **Para las especificaciones de los controladores REST:** Consultar [[Backend/Doc_API_Endpoints_JSON]].
- **Para el esquema relacional de tablas:** Consultar [[Base_de_Datos/Doc_Esquema_SQLServer_MySQL]].
- **Para la evolución cronológica del proyecto:** Consultar [[Desarrollo/Bitacora]].

---

## 🔒 Modelo de Seguridad y Hash
1. **Encriptación de Contraseñas**:
   - Algoritmo: **BCRYPT** (`PASSWORD_BCRYPT`).
   - Registro: Toda nueva cuenta encripta la clave antes de guardarla en MySQL.
   - Login: Valida con `password_verify()`. Si detecta una clave antigua en texto plano, la convierte automáticamente a Hash BCRYPT mediante `password_needs_rehash()`.
   - Más detalles en [[Backend/Doc_Seguridad_BCRYPT]].

2. **Roles y Permisos**:
   - `Administrador` (id_rol: 1): Acceso completo a ERP y Panel Admin.
   - `Usuario` (id_rol: 2): Acceso restringido únicamente a consultas y registros ERP.
   - Controlados mediante [[Frontend/Doc_Servicios_Guards]].

3. **Autoprotección de Administrador**:
   - El backend y frontend impiden que un Administrador desactive su propia cuenta si tiene la sesión activa.
