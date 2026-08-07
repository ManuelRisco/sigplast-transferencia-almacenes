<?php
require_once "../../config/conexion.php";

$accion = $_GET['accion'] ?? 'buscar';
$conn = getSqlServerConn();

if ($accion === 'tipos_mov') {
    $tipos = [];
    if ($conn) {
        $sql_tmo = "SELECT tmo_codigo, tmo_nombre FROM mae_tpomov ORDER BY tmo_nombre DESC";
        $stmt_tmo = sqlsrv_query($conn, $sql_tmo);
        if ($stmt_tmo) {
            while ($r = sqlsrv_fetch_array($stmt_tmo, SQLSRV_FETCH_ASSOC)) {
                $r['tmo_codigo'] = trim((string)$r['tmo_codigo']);
                $r['tmo_nombre'] = trim((string)$r['tmo_nombre']);
                $tipos[] = $r;
            }
        }
    }
    echo json_encode(["success" => true, "tipos_mov" => $tipos]);
    exit;

} elseif ($accion === 'buscar') {
    $alm = trim($_GET['alm_codigo'] ?? '001');
    $q   = trim($_GET['q'] ?? '');

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 10;
    $offset = ($page - 1) * $limit;

    $articulos = [];
    $total_records = 0;

    if ($conn) {
        $searchPattern = !empty($q) ? "%" . $q . "%" : "";

        // 1. Intento por asociación de Almacén en mae_almtpoart (para 001 y almacenes configurados)
        // Count Query
        if (!empty($q)) {
            $sql_count = "SELECT COUNT(*) as total
                          FROM mae_articulo a
                          INNER JOIN mae_almtpoart mta ON a.tar_codigo = mta.tar_codigo
                          WHERE RTRIM(LTRIM(mta.alm_codigo)) = ? AND (a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?)";
            $params_count = array($alm, $searchPattern, $searchPattern, $searchPattern);
        } else {
            $sql_count = "SELECT COUNT(*) as total
                          FROM mae_articulo a
                          INNER JOIN mae_almtpoart mta ON a.tar_codigo = mta.tar_codigo
                          WHERE RTRIM(LTRIM(mta.alm_codigo)) = ?";
            $params_count = array($alm);
        }

        $stmt_count = sqlsrv_query($conn, $sql_count, $params_count);
        if ($stmt_count && $row = sqlsrv_fetch_array($stmt_count, SQLSRV_FETCH_ASSOC)) {
            $total_records = (int)$row['total'];
        }

        if ($total_records > 0) {
            if (!empty($q)) {
                $sql = "SELECT 
                            a.art_codigo, 
                            a.art_nombre, 
                            CASE WHEN a.ume_codigo = '001' THEN 'KGS' ELSE ISNULL(a.ume_codigo, '-') END AS art_uniing, 
                            ISNULL(a.art_codean, '') AS art_codean,
                            COALESCE(s.stk_stkart, 0) AS stock_actual
                        FROM mae_articulo a
                        INNER JOIN mae_almtpoart mta ON a.tar_codigo = mta.tar_codigo
                        LEFT JOIN log_stkart s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = RTRIM(LTRIM(mta.alm_codigo))
                        WHERE RTRIM(LTRIM(mta.alm_codigo)) = ? AND (a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?)
                        ORDER BY a.art_nombre ASC
                        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                $params = array($alm, $searchPattern, $searchPattern, $searchPattern, $offset, $limit);
            } else {
                $sql = "SELECT 
                            a.art_codigo, 
                            a.art_nombre, 
                            CASE WHEN a.ume_codigo = '001' THEN 'KGS' ELSE ISNULL(a.ume_codigo, '-') END AS art_uniing, 
                            ISNULL(a.art_codean, '') AS art_codean,
                            COALESCE(s.stk_stkart, 0) AS stock_actual
                        FROM mae_articulo a
                        INNER JOIN mae_almtpoart mta ON a.tar_codigo = mta.tar_codigo
                        LEFT JOIN log_stkart s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = RTRIM(LTRIM(mta.alm_codigo))
                        WHERE RTRIM(LTRIM(mta.alm_codigo)) = ?
                        ORDER BY a.art_nombre ASC
                        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                $params = array($alm, $offset, $limit);
            }

            $stmt = sqlsrv_query($conn, $sql, $params);
            if ($stmt) {
                while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $r['art_codigo'] = trim((string)$r['art_codigo']);
                    $r['art_nombre'] = trim((string)$r['art_nombre']);
                    $r['art_codean'] = trim((string)$r['art_codean']);
                    $r['stock_actual'] = number_format((float)$r['stock_actual'], 5, '.', '');
                    $articulos[] = $r;
                }
            }
        }

        // 2. Si el almacén no tiene mapeo en mae_almtpoart (ej. Almacén 002 Productos Terminados o 016), consultar catálogo general con stock del almacén
        if ($total_records === 0) {
            // Count Query Alt
            if (!empty($q)) {
                $sql_count_alt = "SELECT COUNT(*) as total
                                  FROM mae_articulo a
                                  WHERE a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?";
                $params_count_alt = array($searchPattern, $searchPattern, $searchPattern);
            } else {
                $sql_count_alt = "SELECT COUNT(*) as total FROM mae_articulo a";
                $params_count_alt = array();
            }

            $stmt_count_alt = sqlsrv_query($conn, $sql_count_alt, $params_count_alt);
            if ($stmt_count_alt && $row_alt = sqlsrv_fetch_array($stmt_count_alt, SQLSRV_FETCH_ASSOC)) {
                $total_records = (int)$row_alt['total'];
            }

            if ($total_records > 0) {
                if (!empty($q)) {
                    $sql_alt = "SELECT 
                                    a.art_codigo, 
                                    a.art_nombre, 
                                    CASE WHEN a.ume_codigo = '001' THEN 'KGS' ELSE ISNULL(a.ume_codigo, '-') END AS art_uniing, 
                                    ISNULL(a.art_codean, '') AS art_codean,
                                    COALESCE(s.stk_stkart, 0) AS stock_actual
                                FROM mae_articulo a
                                LEFT JOIN log_stkart s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = ?
                                WHERE a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?
                                ORDER BY a.art_nombre ASC
                                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                    $params_alt = array($alm, $searchPattern, $searchPattern, $searchPattern, $offset, $limit);
                } else {
                    $sql_alt = "SELECT 
                                    a.art_codigo, 
                                    a.art_nombre, 
                                    CASE WHEN a.ume_codigo = '001' THEN 'KGS' ELSE ISNULL(a.ume_codigo, '-') END AS art_uniing, 
                                    ISNULL(a.art_codean, '') AS art_codean,
                                    COALESCE(s.stk_stkart, 0) AS stock_actual
                                FROM mae_articulo a
                                LEFT JOIN log_stkart s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = ?
                                ORDER BY a.art_nombre ASC
                                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                    $params_alt = array($alm, $offset, $limit);
                }

                $stmt_alt = sqlsrv_query($conn, $sql_alt, $params_alt);
                if ($stmt_alt) {
                    while ($r = sqlsrv_fetch_array($stmt_alt, SQLSRV_FETCH_ASSOC)) {
                        $r['art_codigo'] = trim((string)$r['art_codigo']);
                        $r['art_nombre'] = trim((string)$r['art_nombre']);
                        $r['art_codean'] = trim((string)$r['art_codean']);
                        $r['stock_actual'] = number_format((float)$r['stock_actual'], 5, '.', '');
                        $articulos[] = $r;
                    }
                }
            }
        }
    }

    echo json_encode([
        "success"       => true, 
        "articulos"     => $articulos,
        "total_records" => $total_records
    ]);
    exit;

} elseif ($accion === 'lotes') {
    $alm = trim($_GET['alm'] ?? '001');
    $art = trim($_GET['art'] ?? '');

    $lotes = [];
    if ($conn) {
        $sql = "SELECT lot_codigo AS lot_id, art_codref AS lot_numlote, mov_ctdmov AS lot_cantid 
                FROM log_lote 
                WHERE RTRIM(LTRIM(alm_codigo)) = ? AND RTRIM(LTRIM(art_codigo)) = ? 
                ORDER BY lot_codigo DESC";

        $stmt = sqlsrv_query($conn, $sql, array($alm, $art));
        if ($stmt) {
            while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                $lotes[] = $r;
            }
        }
    }

    echo json_encode(["success" => true, "lotes" => $lotes]);
    exit;
}
?>
