<?php
require_once __DIR__ . '/../../config/conexion.php';

$emp = $_GET["emp_codigo"] ?? '';
$mov = $_GET["mov_id"] ?? '';

if (empty($emp) || empty($mov)) {
    echo json_encode(["success" => false, "detalle" => []]);
    exit;
}

$conn = getSqlServerConn();
$detalle = [];

if ($conn) {
    $sql = "SELECT 
                d.mov_item AS Item,
                d.art_codigo AS Codigo,
                a.art_nombre AS Descripcion,
                CASE WHEN a.ume_codigo = '001' THEN 'KGS' ELSE ISNULL(a.ume_codigo, '-') END AS UM,
                ISNULL(d.lot_codigo, '-') AS IDLote,
                ISNULL(d.art_codref, '-') AS Lote,
                CAST(d.mov_ctdmov AS float) AS Cantidad,
                ISNULL(d.no_ord_tra, '-') AS NoOT
            FROM log_detmov d
            LEFT JOIN mae_articulo a ON d.art_codigo = a.art_codigo
            WHERE d.emp_codigo = ? AND d.mov_id = ?
            ORDER BY d.mov_item ASC";

    $stmt = sqlsrv_query($conn, $sql, array($emp, $mov));
    if ($stmt) {
        while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if (isset($r['Cantidad'])) {
                $r['Cantidad'] = number_format((float)$r['Cantidad'], 3, '.', ',');
            }
            foreach ($r as $k => $v) {
                $clean = trim((string)$v);
                $r[$k] = ($clean === '' || $clean === '01/01/1900') ? '-' : $clean;
            }
            $detalle[] = $r;
        }
    }
}

echo json_encode([
    "success" => true,
    "detalle" => $detalle
]);
?>
