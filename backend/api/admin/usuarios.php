<?php
require_once "../../config/conexion.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT u.id_usuario, u.username, u.estado, u.id_rol, u.id_persona, u.fecha_creacion,
                   p.nombres, p.apellido_paterno, p.apellido_materno, p.correo, p.telefono,
                   r.nombre AS rol_nombre
            FROM usuarios u
            INNER JOIN personas p ON u.id_persona = p.id_persona
            INNER JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario DESC";

    $res_u = $connMysql->query($sql);
    $usuarios = [];
    if ($res_u) {
        while ($r = $res_u->fetch_assoc()) {
            $usuarios[] = $r;
        }
    }

    $res_r = $connMysql->query("SELECT id_rol, nombre FROM roles ORDER BY id_rol ASC");
    $roles = [];
    if ($res_r) {
        while ($r = $res_r->fetch_assoc()) {
            $roles[] = $r;
        }
    }

    echo json_encode(["success" => true, "usuarios" => $usuarios, "roles" => $roles]);
    exit;

} elseif ($method === 'POST') {
    $data   = getJsonInput();
    $accion = $data['accion'] ?? '';

    if ($accion === 'editar_datos') {
        $id_usuario       = (int)($data['id_usuario'] ?? 0);
        $id_persona       = (int)($data['id_persona'] ?? 0);
        $nombres          = trim($data['nombres'] ?? '');
        $apellido_paterno = trim($data['apellido_paterno'] ?? '');
        $apellido_materno = trim($data['apellido_materno'] ?? '');
        $correo           = trim($data['correo'] ?? '');
        $telefono         = trim($data['telefono'] ?? '');
        $username         = trim($data['username'] ?? '');
        $id_rol           = (int)($data['id_rol'] ?? 1);

        $connMysql->begin_transaction();
        try {
            $stmt_p = $connMysql->prepare("UPDATE personas SET nombres = ?, apellido_paterno = ?, apellido_materno = ?, correo = ?, telefono = ? WHERE id_persona = ?");
            $stmt_p->bind_param("sssssi", $nombres, $apellido_paterno, $apellido_materno, $correo, $telefono, $id_persona);
            $stmt_p->execute();

            $stmt_u = $connMysql->prepare("UPDATE usuarios SET username = ?, id_rol = ? WHERE id_usuario = ?");
            $stmt_u->bind_param("sii", $username, $id_rol, $id_usuario);
            $stmt_u->execute();

            $connMysql->commit();
            echo json_encode(["success" => true, "message" => "Datos actualizados correctamente."]);
            exit;
        } catch (Exception $e) {
            $connMysql->rollback();
            echo json_encode(["success" => false, "message" => "Error al actualizar: " . $e->getMessage()]);
            exit;
        }

    } elseif ($accion === 'cambiar_password') {
        $id_usuario     = (int)($data['id_usuario'] ?? 0);
        $nueva_password = $data['nueva_password'] ?? '';

        if (empty($nueva_password) || strlen($nueva_password) < 4) {
            echo json_encode(["success" => false, "message" => "La contraseña debe tener al menos 4 caracteres."]);
            exit;
        }

        $hashPassword = password_hash($nueva_password, PASSWORD_BCRYPT);
        $stmt = $connMysql->prepare("UPDATE usuarios SET password = ? WHERE id_usuario = ?");
        $stmt->bind_param("si", $hashPassword, $id_usuario);
        $stmt->execute();

        echo json_encode(["success" => true, "message" => "Contraseña encriptada (Hash BCRYPT) y actualizada correctamente."]);
        exit;

    } elseif ($accion === 'cambiar_estado') {
        $id_usuario   = (int)($data['id_usuario'] ?? 0);
        $nuevo_estado = (int)($data['nuevo_estado'] ?? 1);

        $stmt = $connMysql->prepare("UPDATE usuarios SET estado = ? WHERE id_usuario = ?");
        $stmt->bind_param("ii", $nuevo_estado, $id_usuario);
        $stmt->execute();

        echo json_encode(["success" => true, "message" => "Estado de usuario actualizado correctamente."]);
        exit;
    }
}
?>
