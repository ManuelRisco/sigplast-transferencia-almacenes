<?php
require_once "../../config/conexion.php";

$data = getJsonInput();

$nombres          = trim($data['nombres'] ?? '');
$apellido_paterno = trim($data['apellido_paterno'] ?? '');
$apellido_materno = trim($data['apellido_materno'] ?? '');
$correo           = trim($data['correo'] ?? '');
$telefono         = trim($data['telefono'] ?? '');
$username         = trim($data['username'] ?? '');
$password         = $data['password'] ?? '';

if (empty($nombres) || empty($apellido_paterno) || empty($apellido_materno) || empty($correo) || empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Por favor completa todos los campos obligatorios."]);
    exit;
}

$stmt_check = $connMysql->prepare("SELECT id_usuario FROM usuarios WHERE username = ? LIMIT 1");
$stmt_check->bind_param("s", $username);
$stmt_check->execute();
if ($stmt_check->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "El nombre de usuario '$username' ya se encuentra registrado."]);
    exit;
}

// Asignar rol Usuario automáticamente
$id_rol = 2;
$res_rol = $connMysql->query("SELECT id_rol FROM roles WHERE LOWER(nombre) = 'usuario' LIMIT 1");
if ($res_rol && $row_rol = $res_rol->fetch_assoc()) {
    $id_rol = (int)$row_rol['id_rol'];
} else {
    $connMysql->query("INSERT INTO roles (nombre, descripcion) VALUES ('Usuario', 'Usuario Estándar del Sistema')");
    $id_rol = $connMysql->insert_id;
}

$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$connMysql->begin_transaction();

try {
    $stmt_p = $connMysql->prepare("INSERT INTO personas (nombres, apellido_paterno, apellido_materno, correo, telefono) VALUES (?, ?, ?, ?, ?)");
    $stmt_p->bind_param("sssss", $nombres, $apellido_paterno, $apellido_materno, $correo, $telefono);
    $stmt_p->execute();
    $id_persona = $connMysql->insert_id;

    $stmt_u = $connMysql->prepare("INSERT INTO usuarios (id_persona, id_rol, username, password, estado) VALUES (?, ?, ?, ?, 1)");
    $stmt_u->bind_param("iiss", $id_persona, $id_rol, $username, $passwordHash);
    $stmt_u->execute();

    $connMysql->commit();

    echo json_encode(["success" => true, "message" => "Cuenta creada exitosamente."]);
    exit;

} catch (Exception $e) {
    $connMysql->rollback();
    echo json_encode(["success" => false, "message" => "Error al registrar la cuenta: " . $e->getMessage()]);
    exit;
}
?>
