<?php
require_once __DIR__ . '/../../config/conexion.php';

$conn = getSqlServerConn();
$accion = $_GET['accion'] ?? 'stock';

$alm = trim($_GET['alm'] ?? $_GET['alm_codigo'] ?? '001');
$art = trim($_GET['art'] ?? $_GET['art_codigo'] ?? '');
$lot = isset($_GET['lot']) ? (int)$_GET['lot'] : 0;

// Sanitizar y validar fecha de corte
$fecRaw = trim($_GET['fec'] ?? '');
if (empty($fecRaw) || $fecRaw === 'undefined' || $fecRaw === 'null' || !strtotime($fecRaw)) {
    $fec = date('Ymd');
} else {
    $fec = date('Ymd', strtotime($fecRaw));
}

/**
 * Llama al procedimiento almacenado [dbo].[stock_articulo]
 */
function consultarStockSP($conn, $alm, $art, $fec = null, $lot = 0) {
    if (!$conn || empty($art)) return [];
    if (!$fec || $fec === 'undefined' || !strtotime($fec)) {
        $fec = date('Ymd');
    } else {
        $fec = date('Ymd', strtotime($fec));
    }
    
    $sql = "SET NOCOUNT ON; EXEC [dbo].[stock_articulo] @alm=?, @fec=?, @lot=?, @art=?";
    $stmt = sqlsrv_query($conn, $sql, array(trim($alm), trim($fec), (int)$lot, trim($art)));
    $res = [];
    if ($stmt) {
        do {
            while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                $res[] = $r;
            }
        } while (sqlsrv_next_result($stmt));
    }
    return $res;
}

// 1. Tipos de movimiento
if ($accion === 'tipos_mov') {
    $tipos = [];
    if ($conn) {
        $stmt = sqlsrv_query($conn, "SELECT tmo_codigo, tmo_nombre FROM mae_tpomov ORDER BY tmo_nombre DESC");
        if ($stmt) {
            while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                $tipos[] = [
                    "tmo_codigo" => trim((string)$r['tmo_codigo']),
                    "tmo_nombre" => trim((string)$r['tmo_nombre'])
                ];
            }
        }
    }
    echo json_encode(["success" => true, "tipos_mov" => $tipos]);
    exit;
}

// 2. Búsqueda y Catálogo de Artículos con Stock calculado por el Stored Procedure
if ($accion === 'buscar') {
    $q = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, (int)($_GET['limit'] ?? 10));
    $offset = ($page - 1) * $limit;

    $articulos = [];
    $total = 0;

    if ($conn) {
        $filtro = "%$q%";
        // Subquery para validar que tenga stock positivo
        $stockSubquery = "(SELECT ISNULL(SUM(CASE WHEN b.mov_tipo = 'I' THEN a.mov_ctdmov ELSE 0 END) - SUM(CASE WHEN b.mov_tipo = 'S' THEN a.mov_ctdmov ELSE 0 END), 0) FROM log_detmov a INNER JOIN log_cabmov b ON a.mov_id = b.mov_id WHERE b.mov_flag <> 'A' AND b.alm_codigo = ? AND a.art_codigo = mae_articulo.art_codigo) > 0";

        $sqlCount = "SELECT COUNT(*) as total FROM mae_articulo WHERE (art_codigo LIKE ? OR art_nombre LIKE ?) AND $stockSubquery";
        $stmtC = sqlsrv_query($conn, $sqlCount, array($filtro, $filtro, $alm));
        if ($stmtC && $row = sqlsrv_fetch_array($stmtC, SQLSRV_FETCH_ASSOC)) {
            $total = (int)$row['total'];
        }

        $sql = "SELECT art_codigo, art_nombre, art_codean, ume_codigo 
                FROM mae_articulo 
                WHERE (art_codigo LIKE ? OR art_nombre LIKE ?) AND $stockSubquery
                ORDER BY art_nombre ASC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        $stmt = sqlsrv_query($conn, $sql, array($filtro, $filtro, $alm, $offset, $limit));
        if ($stmt) {
            while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                $cod = trim((string)$r['art_codigo']);
                $nom = trim((string)$r['art_nombre']);
                $ean = trim((string)$r['art_codean']);
                $umeDefault = trim((string)$r['ume_codigo']) === '001' ? 'KGS' : trim((string)$r['ume_codigo']);

                // Consultar stock en tiempo real con el Stored Procedure
                $stkInfo = consultarStockSP($conn, $alm, $cod, $fec, 0);
                $stockVal = 0.00;
                $ume = $umeDefault;
                if (!empty($stkInfo)) {
                    $stockVal = (float)($stkInfo[0]['stk_stktra'] ?? 0.0);
                    if (!empty($stkInfo[0]['ume_abrv'])) {
                        $ume = trim((string)$stkInfo[0]['ume_abrv']);
                    }
                }

                $articulos[] = [
                    "art_codigo"   => $cod,
                    "art_nombre"   => $nom,
                    "art_codean"   => $ean,
                    "art_uniing"   => $ume,
                    "stock_actual" => number_format($stockVal, 2, '.', '')
                ];
            }
        }
    }

    echo json_encode([
        "success"       => true, 
        "articulos"     => $articulos, 
        "total_records" => $total
    ]);
    exit;
}

// 3. Consulta de Lotes mediante Stored Procedure [dbo].[stock_articulo] con @lot = 1
if ($accion === 'lotes') {
    $lotes = [];
    if ($conn && !empty($art)) {
        $rows = consultarStockSP($conn, $alm, $art, $fec, 1);
        foreach ($rows as $r) {
            $cant = isset($r['stk_stktra']) ? (float)$r['stk_stktra'] : 0.0;
            $lotes[] = [
                "lot_id"      => trim((string)($r['lot_codigo'] ?? '')),
                "lot_numlote" => trim((string)($r['lot_real'] ?? '')),
                "lot_cantid"  => number_format($cant, 2, '.', ''),
                "stk_stktra"  => $cant,
                "art_nombre"  => trim((string)($r['art_nombre'] ?? '')),
                "ume_abrv"    => trim((string)($r['ume_abrv'] ?? '')),
                "fam_nombre"  => trim((string)($r['fam_nombre'] ?? '')),
                "tfa_nombre"  => trim((string)($r['tfa_nombre'] ?? ''))
            ];
        }
    }
    echo json_encode(["success" => true, "lotes" => $lotes]);
    exit;
}

// 4. Consulta de Stock General mediante Stored Procedure [dbo].[stock_articulo]
$stockData = [];
if ($conn && !empty($art)) {
    $rows = consultarStockSP($conn, $alm, $art, $fec, $lot);
    foreach ($rows as $r) {
        $cant = isset($r['stk_stktra']) ? (float)$r['stk_stktra'] : 0.0;
        $stockData[] = [
            "alm_codigo" => trim((string)($r['alm_codigo'] ?? $alm)),
            "art_codigo" => trim((string)($r['art_codigo'] ?? $art)),
            "art_nombre" => trim((string)($r['art_nombre'] ?? '')),
            "ume_abrv"   => trim((string)($r['ume_abrv'] ?? '')),
            "lot_codigo" => trim((string)($r['lot_codigo'] ?? '')),
            "lot_real"   => trim((string)($r['lot_real'] ?? '')),
            "ingresos"   => isset($r['ingresos']) ? (float)$r['ingresos'] : 0.0,
            "salidas"    => isset($r['salidas']) ? (float)$r['salidas'] : 0.0,
            "stk_stktra" => $cant,
            "stock_actual" => number_format($cant, 2, '.', ''),
            "fam_nombre" => trim((string)($r['fam_nombre'] ?? '')),
            "tfa_nombre" => trim((string)($r['tfa_nombre'] ?? ''))
        ];
    }
}

echo json_encode(["success" => true, "stock" => $stockData]);
?>
