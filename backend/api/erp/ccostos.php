<?php
require_once __DIR__ . '/../../config/conexion.php';

$conn = getSqlServerConn();

if (!$conn) {
    echo json_encode(["success" => false, "message" => "No se pudo conectar a la base de datos."]);
    exit;
}

$ccostos = [];
// Obtener centros de costo donde cco_status = 1
$sql = "SELECT cco_codigo, cco_nombre FROM mae_ccostomae WHERE cco_status = 1 ORDER BY cco_nombre ASC";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt) {
    while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $ccostos[] = [
            "cco_codigo" => trim((string)$r['cco_codigo']),
            "cco_nombre" => trim((string)$r['cco_nombre'])
        ];
    }
}

echo json_encode(["success" => true, "ccostos" => $ccostos]);
?>
