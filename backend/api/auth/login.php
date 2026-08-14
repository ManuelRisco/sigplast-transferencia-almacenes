<?php
require_once __DIR__ . '/../../config/conexion.php';
require_once __DIR__ . '/../../config/seguridad.php';

$data = getJsonInput();
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Por favor ingresa tu usuario y contraseña."]);
    exit;
}

$conn = getSqlServerConn();

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Error de conexión con el servidor de base de datos TECNOTEST."]);
    exit;
}

$sql = "SELECT emp_codigo, usr_codigo, pus_codigo, usr_nombre, usr_clave, usr_status,
               user_, date, time, tra_codigo, adm_tesore, usr_rescom, adm_aprreq,
               adm_mparte, usr_correo, adm_ingmp, adm_cred, adm_vta
        FROM TECNOTEST.dbo.adm_usuario
        WHERE UPPER(RTRIM(usr_codigo)) = UPPER(?)";

$stmt = sqlsrv_query($conn, $sql, array($username));

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error al consultar la base de datos.", "error" => sqlsrv_errors()]);
    exit;
}

$user = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

if ($user) {
    // Validar estado del usuario (1 = Activo, 0 = Inactivo)
    if ((int)$user['usr_status'] !== 1) {
        echo json_encode(["success" => false, "message" => "El usuario se encuentra inactivo."]);
        exit;
    }

    if (verifyPassword($password, $user['usr_clave'])) {
        $token = bin2hex(random_bytes(16));
        $pus = trim($user['pus_codigo'] ?? '');
        $usrCodigo = trim($user['usr_codigo']);
        $usrNombre = trim($user['usr_nombre']);
        
        $isAdmin = (strtoupper($pus) === 'SISTEMAS' || strtoupper($usrCodigo) === 'ADMINISTRA');
        $idRol = $isAdmin ? 1 : 2;
        $rolNombre = !empty($pus) ? $pus : ($isAdmin ? 'ADMINISTRADOR' : 'USUARIO');

        echo json_encode([
            "success" => true,
            "message" => "Autenticación exitosa",
            "token"   => $token,
            "user"    => [
                "id_usuario"      => $usrCodigo,
                "username"        => $usrCodigo,
                "usr_codigo"      => $usrCodigo,
                "nombre_completo" => $usrNombre,
                "usr_nombre"      => $usrNombre,
                "id_rol"          => $idRol,
                "rol_nombre"      => $rolNombre,
                "pus_codigo"      => $pus,
                "emp_codigo"      => trim($user['emp_codigo'] ?? ''),
                "usr_correo"      => trim($user['usr_correo'] ?? '')
            ]
        ]);
        exit;
    } else {
        echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
        exit;
    }
} else {
    echo json_encode(["success" => false, "message" => "El usuario ingresado no existe."]);
    exit;
}
?>
