# Documentación de Endpoints RESTful JSON - Backend PHP

El backend de **SIGPLAST** opera como un conjunto de endpoints REST independientes en PHP que retornan datos formateados exclusivamente en JSON con cabeceras CORS (`Access-Control-Allow-Origin: *`).

---

## 📌 Relaciones y Dependencias
- **Bases de Datos que Consulta:** [[Base_de_Datos/Doc_Esquema_SQLServer_MySQL]].
- **Políticas de Autenticación y Hash:** [[Backend/Doc_Seguridad_BCRYPT]].
- **Consumo desde el Cliente:** [[Frontend/Doc_Servicios_Guards]] y [[Frontend/Doc_Componentes_Angular]].
- **Arquitectura Global:** [[Arquitectura/Arquitectura_Angular22_PHP]].

---

## 🌐 Catálogo de Endpoints

### 1. `api/erp/movimientos.php`
- **Método:** `GET`
- **Parámetros:** `alm_codigo`, `mov_anho`, `mov_nmes`, `page`, `limit`.
- **Comportamiento:**
  - Auto-detección del último año y mes disponible en `log_cabmov` si no se pasan parámetros.
  - Retorna `almacenes` desde `mae_almacen`, lista de `anios` y el array `movimientos` con los 13 campos principales.
  - Implementa **Server-Side Pagination** (`OFFSET` y `FETCH NEXT`), retornando únicamente la página actual y el total de registros en `total_records`.
- **Tablas consultadas:** `log_cabmov`, `mae_almacen`, `mae_tpomov`.

---

### 2. `api/erp/detalle.php`
- **Método:** `GET`
- **Parámetros:** `emp_codigo`, `mov_id`.
- **Comportamiento:**
  - Retorna el detalle de artículos de un movimiento en `log_detmov`.
  - Mapea: `Item`, `Codigo`, `Descripcion`, `UM`, `IDLote` (`lot_codigo`), `Lote` (`art_codref`), `Cantidad` (`mov_ctdmov`), `NoOT` (`no_ord_tra`).
  - Reemplaza automáticamente valores vacíos o nulos por `-`.
- **Tablas consultadas:** `log_detmov`, `mae_articulo`.

---

### 3. `api/erp/articulos.php`
- **Método:** `GET`
- **Acciones:**
  - `accion=tipos_mov`: Retorna todos los 34 tipos de movimiento desde `mae_tpomov` ordenados `DESC` (priorizando `102 - TRANSFERENCIA ENTRE ALMACENES`).
  - `accion=buscar` (Admite `page` y `limit`): Filtra artículos por almacén usando `mae_almtpoart` (`mta.alm_codigo = ?`), catálogo general y stock en `log_stkart`. Usa **Server-Side Pagination** retornando `total_records`.
  - `accion=lotes`: Consulta lotes activos en `log_lote`.
- **Tablas consultadas:** `mae_tpomov`, `mae_articulo`, `mae_almtpoart`, `log_stkart`, `log_lote`.

---

### 4. `api/auth/login.php` y `api/auth/registro.php`
- **Método:** `POST`
- **Seguridad:** Encriptación y verificación con **BCRYPT**.
- **Tablas consultadas:** `tbl_usuarios`, `tbl_personas`, `tbl_roles`.
- **Detalle de seguridad:** Ver [[Backend/Doc_Seguridad_BCRYPT]].

---

### 5. `api/admin/usuarios.php`
- **Método:** `GET` (listar usuarios) / `POST` (editar, toggle estado, resetear contraseña).
- **Protección:** Prohibición de autodesactivación de la cuenta del administrador conectado.
- **Tablas consultadas:** `tbl_usuarios`, `tbl_personas`, `tbl_roles`.

---

## ⚡ Optimizaciones Globales
- **Compresión de Red (GZIP):** El directorio `/backend` contiene un `.htaccess` que habilita `mod_deflate` en Apache. Esto comprime automáticamente todas las respuestas JSON, reduciendo el ancho de banda consumido en un 70%.
- **Server-Side Pagination:** Los endpoints masivos de lectura calculan `COUNT(*)` en tiempo real y devuelven ráfagas de datos en lugar de tablas enteras.
