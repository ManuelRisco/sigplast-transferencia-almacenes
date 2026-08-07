<?php
require_once "../../config/conexion.php";

$filtro_almacen = $_GET['alm_codigo'] ?? '001';

$conn = getSqlServerConn();

// 1. Obtener Almacenes
$almacenes = [];
if ($conn) {
    $sql_alm = "SELECT alm_codigo, alm_nombre FROM mae_almacen WHERE alm_codigo IN ('001', '002', '016') ORDER BY alm_codigo";
    $stmt_alm = sqlsrv_query($conn, $sql_alm);
    if ($stmt_alm) {
        while ($r = sqlsrv_fetch_array($stmt_alm, SQLSRV_FETCH_ASSOC)) {
            $r['alm_codigo'] = trim($r['alm_codigo']);
            if ($r['alm_codigo'] === '001') {
                $r['alm_nombre'] = 'ALMACEN VERDE MP';
            } else {
                $r['alm_nombre'] = trim($r['alm_nombre']);
            }
            $almacenes[] = $r;
        }
    }
}
if (empty($almacenes)) {
    $almacenes = [
        ["alm_codigo" => "001", "alm_nombre" => "ALMACEN VERDE MP"],
        ["alm_codigo" => "002", "alm_nombre" => "ALMACEN MP 02"],
        ["alm_codigo" => "016", "alm_nombre" => "ALMACEN 016"]
    ];
}

// 2. Obtener Años
$anios = [];
if ($conn) {
    $sql_anhos = "SELECT DISTINCT mov_anho FROM log_cabmov WHERE mov_anho IS NOT NULL AND mov_anho <> '' ORDER BY mov_anho DESC";
    $stmt_anhos = sqlsrv_query($conn, $sql_anhos);
    if ($stmt_anhos) {
        while ($r = sqlsrv_fetch_array($stmt_anhos, SQLSRV_FETCH_ASSOC)) {
            $val_anho = trim($r['mov_anho']);
            if (!empty($val_anho)) {
                $anios[] = $val_anho;
            }
        }
    }
}
if (empty($anios)) $anios = [date('Y')];

// 3. Determinar Año y Mes por defecto leyendo la base de datos si no vienen especificados
$latest_anho = $anios[0] ?? date('Y');
$latest_mes = date('m');

if ($conn) {
    $sql_latest = "SELECT TOP 1 mov_anho, mov_nmes FROM log_cabmov WHERE alm_codigo = ? AND mov_anho IS NOT NULL AND mov_nmes IS NOT NULL ORDER BY mov_anho DESC, mov_nmes DESC";
    $stmt_l = sqlsrv_query($conn, $sql_latest, array($filtro_almacen));
    if ($stmt_l && $row_l = sqlsrv_fetch_array($stmt_l, SQLSRV_FETCH_ASSOC)) {
        $latest_anho = trim($row_l['mov_anho']);
        $latest_mes = trim($row_l['mov_nmes']);
    }
}

$filtro_anho = $_GET['mov_anho'] ?? $latest_anho;
$filtro_mes = $_GET['mov_nmes'] ?? $latest_mes;

if (strlen($filtro_mes) === 1) {
    $filtro_mes = str_pad($filtro_mes, 2, '0', STR_PAD_LEFT);
}

// 4. Meses
$meses = [
    ["codigo" => "01", "nombre" => "ENERO"],
    ["codigo" => "02", "nombre" => "FEBRERO"],
    ["codigo" => "03", "nombre" => "MARZO"],
    ["codigo" => "04", "nombre" => "ABRIL"],
    ["codigo" => "05", "nombre" => "MAYO"],
    ["codigo" => "06", "nombre" => "JUNIO"],
    ["codigo" => "07", "nombre" => "JULIO"],
    ["codigo" => "08", "nombre" => "AGOSTO"],
    ["codigo" => "09", "nombre" => "SETIEMBRE"],
    ["codigo" => "10", "nombre" => "OCTUBRE"],
    ["codigo" => "11", "nombre" => "NOVIEMBRE"],
    ["codigo" => "12", "nombre" => "DICIEMBRE"]
];

// 5. Paginación
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
if ($page < 1) $page = 1;
if ($limit < 1) $limit = 20;
$offset = ($page - 1) * $limit;

$movimientos = [];
$total_records = 0;

if ($conn) {
    // Total Records
    $sql_count = "SELECT COUNT(*) as total 
                  FROM log_cabmov c
                  WHERE c.alm_codigo = ? AND c.mov_anho = ? AND c.mov_nmes = ?";
    $params_count = array($filtro_almacen, $filtro_anho, $filtro_mes);
    $stmt_count = sqlsrv_query($conn, $sql_count, $params_count);
    if ($stmt_count && $row = sqlsrv_fetch_array($stmt_count, SQLSRV_FETCH_ASSOC)) {
        $total_records = (int)$row['total'];
    }

    // Records Pagination
    $sql = "SELECT 
                c.mov_id AS nro_id,
                c.mov_codigo AS no_vale,
                CONVERT(VARCHAR(10), c.mov_fecemi, 103) AS fec_emi,
                CONVERT(VARCHAR(10), c.mov_fectras, 103) AS fec_trasl,
                t.tmo_nombre AS tipo_movimiento,
                CASE WHEN c.mov_tpdoc IS NOT NULL AND c.mov_tpdoc <> '-' THEN c.mov_tpdoc + '-' + c.mov_nrodoc ELSE '-' END AS doc_ref,
                c.mov_flag AS est,
                c.mov_almdes AS dst,
                c.id_venta AS doc_venta,
                c.numped AS ped_numero,
                cl.cli_razsoc AS cliente_proveedor,
                (LTRIM(RTRIM(c.user_)) + '-' + CONVERT(VARCHAR, c.date, 103) + '-' + ISNULL(c.time, '')) AS usuario,
                c.emp_codigo,
                c.mov_id AS raw_mov_id
            FROM log_cabmov c
            LEFT JOIN mae_tpomov t ON c.tmo_codigo = t.tmo_codigo 
            LEFT JOIN mae_clientes cl ON c.cli_codigo = cl.cli_codigo AND c.emp_codigo = cl.emp_codigo
            WHERE c.alm_codigo = ? AND c.mov_anho = ? AND c.mov_nmes = ?
            ORDER BY c.mov_fecemi DESC, c.mov_id DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";

    $params = array($filtro_almacen, $filtro_anho, $filtro_mes, $offset, $limit);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt) {
        while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $movimientos[] = $r;
        }
    }
}

echo json_encode([
    "success"        => true,
    "filtro_almacen" => $filtro_almacen,
    "filtro_anho"    => $filtro_anho,
    "filtro_mes"     => $filtro_mes,
    "almacenes"      => $almacenes,
    "anios"          => $anios,
    "meses"          => $meses,
    "movimientos"    => $movimientos,
    "total_records"  => $total_records
]);
?>
