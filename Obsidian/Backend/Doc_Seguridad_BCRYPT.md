# Seguridad, Autenticación y Criptografía BCRYPT

Este documento describe la arquitectura criptográfica, el ciclo de vida de las contraseñas y las políticas de acceso implementadas en **SIGPLAST**.

---

## 📌 Relaciones y Dependencias
- **Persistencia de Credenciales:** [[Base_de_Datos/Doc_Esquema_SQLServer_MySQL#tablas-mysql-tf_almacen]].
- **Endpoints de Autenticación:** [[Backend/Doc_API_Endpoints_JSON#4-apiauthloginphp-y-apiauthregistrophp]].
- **Guards y Estado del Cliente:** [[Frontend/Doc_Servicios_Guards]].
- **Contexto Arquitectónico:** [[Arquitectura/Arquitectura_Angular22_PHP]].

---

## 🔒 Mecanismo de Encriptación BCRYPT

1. **Creación de Cuentas (`registro.php`):**
   - Se utiliza `password_hash($password, PASSWORD_BCRYPT, ['cost' => 10])`.
   - Genera un hash unidireccional de 60 caracteres resistente a ataques de fuerza bruta y rainbow tables.

2. **Validación y Rehash Transparente (`login.php`):**
   - Se comprueba con `password_verify($password, $hashGuardado)`.
   - **Compatibilidad con Legado:** Si el hash guardado era texto plano heredado, el sistema valida la contraseña y ejecuta automáticamente `password_needs_rehash()`, actualizando el campo a BCRYPT en la base de datos sin fricción para el usuario.

3. **Invalidador de Sesión en Tiempo Real:**
   - Si un administrador cambia el rol, estado o contraseña de un usuario en [[Frontend/Doc_Componentes_Angular#3-adminusuarioscomponent-panel-de-administración]], la siguiente petición del usuario rechazará el token y cerrará su sesión de inmediato.

4. **Regla de No Autodesactivación:**
   - La API de administración valida que `id_usuario !== $usuario_sesion_id` antes de procesar una desactivación de cuenta, evitando bloqueos accidentales del administrador.
