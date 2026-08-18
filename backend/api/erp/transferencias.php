<?php
require_once __DIR__ . '/../../config/conexion.php';

// Asegurar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$input = getJsonInput();

$emp_codigo = $input['emp_codigo'] ?? '001';
$suc_codigo = $input['suc_codigo'] ?? '001';
$alm_origen = $input['alm_origen'] ?? '';
$alm_destino = $input['alm_destino'] ?? '';
$fec_emi = $input['fec_emi'] ?? date('Ymd');
$usuario = $input['usuario'] ?? 'ADMINISTRA';
$detalles = $input['detalles'] ?? [];
$glosa = $input['glosa'] ?? '';

// Validaciones básicas
if (empty($alm_origen) || empty($alm_destino)) {
    echo json_encode(["success" => false, "message" => "Debe especificar almacén origen y destino"]);
    exit;
}
if (empty($detalles) || !is_array($detalles)) {
    echo json_encode(["success" => false, "message" => "Debe incluir al menos un artículo"]);
    exit;
}

$conn = getSqlServerConn();
if (!$conn) {
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos"]);
    exit;
}

// Convertir detalles a JSON string para enviarlo al SP
$detalles_json = json_encode($detalles, JSON_UNESCAPED_UNICODE);

// Ejecutar Procedimiento Almacenado
$sql = "{CALL sp_registrar_transferencia_almacen(?, ?, ?, ?, ?, ?, ?, ?)}";
$params = array(
    array($emp_codigo, SQLSRV_PARAM_IN),
    array($suc_codigo, SQLSRV_PARAM_IN),
    array($alm_origen, SQLSRV_PARAM_IN),
    array($alm_destino, SQLSRV_PARAM_IN),
    array($fec_emi, SQLSRV_PARAM_IN),
    array($usuario, SQLSRV_PARAM_IN),
    array($detalles_json, SQLSRV_PARAM_IN),
    array($glosa, SQLSRV_PARAM_IN)
);

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    // Si falla a nivel de ejecución SQL
    $errors = sqlsrv_errors();
    $errorMsg = $errors[0]['message'] ?? 'Error desconocido al ejecutar el procedimiento';
    echo json_encode(["success" => false, "message" => "Error SQL: " . $errorMsg]);
    exit;
}

// El SP retorna un resultset con success, message, mov_id_salida, etc.
$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

if ($row) {
    // Convertir el valor 'success' a booleano real en JSON
    $row['success'] = (bool)$row['success'];
    echo json_encode($row);
} else {
    echo json_encode(["success" => false, "message" => "No se recibió respuesta del procedimiento"]);
}

sqlsrv_free_stmt($stmt);
?>
