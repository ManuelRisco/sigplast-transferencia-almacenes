<?php
require_once "../../config/conexion.php";

$data = getJsonInput();
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Por favor ingresa tu usuario y contraseña."]);
    exit;
}

$sql = "SELECT u.id_usuario, u.username, u.password, u.estado, u.id_rol, 
               p.nombres, p.apellido_paterno, p.apellido_materno,
               r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN personas p ON u.id_persona = p.id_persona
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.username = ?
        LIMIT 1";

$stmt = $connMysql->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error al consultar la base de datos."]);
    exit;
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    if ((int)$user['estado'] !== 1) {
        echo json_encode(["success" => false, "message" => "El usuario se encuentra inactivo."]);
        exit;
    }

    $passwordValida = password_verify($password, $user['password']);
    $esTextoPlano = false;

    if (!$passwordValida && $password === $user['password']) {
        $passwordValida = true;
        $esTextoPlano = true;
    }

    if ($passwordValida) {
        if ($esTextoPlano || password_needs_rehash($user['password'], PASSWORD_BCRYPT)) {
            $nuevoHash = password_hash($password, PASSWORD_BCRYPT);
            $stmtRehash = $connMysql->prepare("UPDATE usuarios SET password = ? WHERE id_usuario = ?");
            if ($stmtRehash) {
                $stmtRehash->bind_param("si", $nuevoHash, $user['id_usuario']);
                $stmtRehash->execute();
            }
        }

        $token = bin2hex(random_bytes(16));

        echo json_encode([
            "success" => true,
            "message" => "Autenticación exitosa",
            "token"   => $token,
            "user"    => [
                "id_usuario"      => (int)$user['id_usuario'],
                "username"        => $user['username'],
                "nombre_completo" => trim($user['nombres'] . ' ' . $user['apellido_paterno']),
                "id_rol"          => (int)$user['id_rol'],
                "rol_nombre"      => $user['rol_nombre']
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
