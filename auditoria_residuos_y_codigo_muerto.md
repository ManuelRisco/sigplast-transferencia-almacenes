# Auditoría de Código: Residuos, Código Muerto y Elementos Obsoletos

**Fecha de Auditoría:** 14 de Agosto de 2026  
**Proyecto:** SIGRIS ERP (Frontend Angular + Backend PHP + SQL Server TECNOTEST)

---

## 1. Archivos Residuales y Huérfanos

| Archivo / Ruta | Tipo | Descripción | Estado / Recomendación |
| :--- | :--- | :--- | :--- |
| `backend/decodificador.py` | Script Python | Script temporal utilizado inicialmente para analizar el algoritmo de cifrado por desplazamiento de bytes de `adm_usuario`. | **Obsoleto.** La lógica ya está portada de forma nativa en PHP en `backend/config/seguridad.php`. Puede eliminarse de forma segura. |
| `scratch/*.php` (en directorio de trabajo temporal) | Scripts de prueba | Scripts temporales generados durante las pruebas de conexión y ejecución del SP `stock_articulo`. | **No afecta producción.** Están aislados en el entorno de pruebas. |

---

## 2. Código Muerto en el Frontend (Angular)

### A. Servicio de Autenticación (`frontend/src/app/services/auth.service.ts`)
1. **Método `isAdmin()` (Líneas 68–74)**:
   - **Situación:** Ningún componente ni guarda de navegación invoca `isAdmin()` tras la eliminación del panel de administración `/admin`.
   - **Recomendación:** Se puede remover o simplificar si ya no se usarán roles jerárquicos de administración interna.

2. **Propiedades heredadas en la interfaz `User` (Líneas 6–17)**:
   - **Situación:** Campos como `id_usuario`, `username`, `id_rol` y `rol_nombre` fueron campos heredados del modelo anterior (MySQL).
   - **Campos reales de TECNOTEST:** `usr_codigo`, `usr_nombre`, `pus_codigo`, `emp_codigo`, `usr_correo`.
   - **Recomendación:** Mantener la compatibilidad actual o renombrar formalmente a las propiedades oficiales de TECNOTEST.

---

## 3. Estado de Limpieza en el Backend (PHP)

### A. Archivos Activos y su Estado:
- **`backend/config/conexion.php`**: ✅ **Limpio**. Toda dependencia de MySQL (`tf_almacen`) fue removida. Conexión 100% directa a SQL Server `TECNOTEST`.
- **`backend/config/seguridad.php`**: ✅ **Limpio**. Módulo desacoplado con `encodePassword`, `decodePassword` y `verifyPassword`.
- **`backend/api/auth/login.php`**: ✅ **Limpio**. Valida contra `[TECNOTEST].[dbo].[adm_usuario]`.
- **`backend/api/erp/articulos.php`**: ✅ **Limpio**. Utiliza exclusivamente el procedimiento almacenado `[dbo].[stock_articulo]` para stock consolidado (`lot=0`) y desglose de lotes (`lot=1`).
- **`backend/api/erp/movimientos.php`**: ✅ **Limpio**. Consulta notas de salida y filtros de cabecera de `log_cabmov`.
- **`backend/api/erp/detalle.php`**: ✅ **Limpio**. Consulta el detalle de movimientos de `log_detmov`.

### B. Elementos ya eliminados con éxito:
- `backend/api/auth/registro.php` (Eliminado).
- `backend/api/admin/usuarios.php` (Eliminado).
- `frontend/src/app/components/registro/` (Eliminado).
- `frontend/src/app/components/admin-usuarios/` (Eliminado).

---

## 4. Documentación Histórica Desactualizada (`Obsidian/`)

Los siguientes documentos en la carpeta `Obsidian/` contienen notas de versiones previas cuando existía MySQL y panel de registro/administración:

1. **`Obsidian/Base_de_Datos/Doc_Esquema_SQLServer_MySQL.md`**:
   - Menciona la base de datos MySQL `tf_almacen` y tablas `usuarios`/`roles` que ya no existen en el sistema.
2. **`Obsidian/Backend/Doc_Seguridad_BCRYPT.md`**:
   - Describe el hashing BCRYPT de MySQL. La seguridad actual utiliza el cifrado de TECNOTEST con `Windows-1252`.
3. **`Obsidian/Frontend/Doc_Componentes_Angular.md` y `Doc_Sidebar_Navegacion.md`**:
   - Hacen referencia a las rutas `/registro` y `/admin` que ya fueron eliminadas.

---

## 5. Resumen de Recomendaciones

1. **Eliminar `backend/decodificador.py`**: No tiene uso en la ejecución de la aplicación.
2. **Limpiar método `isAdmin()` en `auth.service.ts`**: Código muerto que ya no se utiliza en ninguna vista.
3. **Actualizar notas en `Obsidian`**: Si se utiliza Obsidian para documentación viva, sincronizar los archivos para reflejar la arquitectura independiente sobre SQL Server TECNOTEST.
