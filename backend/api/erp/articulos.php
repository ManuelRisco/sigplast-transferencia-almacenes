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

        // Subconsulta para obtener el stock más reciente de log_stkarticulo
        $subquery_stock = "(SELECT art_codigo, alm_codigo, SUM(stk_stkart) as stk_stkart 
                            FROM log_stkarticulo 
                            WHERE stk_anho = (SELECT MAX(stk_anho) FROM log_stkarticulo) 
                              AND stk_nmes = (SELECT MAX(stk_nmes) FROM log_stkarticulo WHERE stk_anho = (SELECT MAX(stk_anho) FROM log_stkarticulo))
                            GROUP BY art_codigo, alm_codigo)";

        // 1. Intento por asociación de Almacén en mae_almtpoart (para 001 y almacenes configurados)
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
                        LEFT JOIN $subquery_stock s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = RTRIM(LTRIM(mta.alm_codigo))
                        WHERE RTRIM(LTRIM(mta.alm_codigo)) = ? AND (a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?)
                        ORDER BY s.stk_stkart DESC, a.art_nombre ASC
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
                        LEFT JOIN $subquery_stock s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = RTRIM(LTRIM(mta.alm_codigo))
                        WHERE RTRIM(LTRIM(mta.alm_codigo)) = ?
                        ORDER BY s.stk_stkart DESC, a.art_nombre ASC
                        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                $params = array($alm, $offset, $limit);
            }

            $stmt = sqlsrv_query($conn, $sql, $params);
            if ($stmt) {
                while ($r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $r['art_codigo'] = trim((string)$r['art_codigo']);
                    $r['art_nombre'] = trim((string)$r['art_nombre']);
                    $r['art_codean'] = trim((string)$r['art_codean']);
                    $r['stock_actual'] = number_format((float)$r['stock_actual'], 2, '.', '');
                    $articulos[] = $r;
                }
            }
        }

        // 2. Si el almacén no tiene mapeo en mae_almtpoart (ej. Almacenes de planta), catálogo general
        if ($total_records === 0) {
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
                                LEFT JOIN $subquery_stock s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = ?
                                WHERE a.art_codigo LIKE ? OR a.art_codean LIKE ? OR a.art_nombre LIKE ?
                                ORDER BY s.stk_stkart DESC, a.art_nombre ASC
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
                                LEFT JOIN $subquery_stock s ON a.art_codigo = s.art_codigo AND RTRIM(LTRIM(s.alm_codigo)) = ?
                                ORDER BY s.stk_stkart DESC, a.art_nombre ASC
                                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
                    $params_alt = array($alm, $offset, $limit);
                }

                $stmt_alt = sqlsrv_query($conn, $sql_alt, $params_alt);
                if ($stmt_alt) {
                    while ($r = sqlsrv_fetch_array($stmt_alt, SQLSRV_FETCH_ASSOC)) {
                        $r['art_codigo'] = trim((string)$r['art_codigo']);
                        $r['art_nombre'] = trim((string)$r['art_nombre']);
                        $r['art_codean'] = trim((string)$r['art_codean']);
                        $r['stock_actual'] = number_format((float)$r['stock_actual'], 2, '.', '');
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
    if ($conn && !empty($art)) {
        // 1. Calcular el stock real activo de cada lote según movimientos de entrada/salida
        $sql_mov = "SELECT 
                        d.lot_codigo AS lot_id,
                        COALESCE(l.lot_real, d.lot_codigo) AS lot_numlote,
                        SUM(CASE WHEN t.tmo_tipo = 'I' THEN d.mov_ctdmov ELSE -d.mov_ctdmov END) as lot_cantid
                    FROM log_detmov d
                    INNER JOIN log_cabmov c ON d.emp_codigo = c.emp_codigo AND d.mov_id = c.mov_id
                    LEFT JOIN mae_tpomov t ON c.tmo_codigo = t.tmo_codigo
                    LEFT JOIN log_lote l ON d.art_codigo = l.art_codigo AND d.lot_codigo = l.lot_codigo
                    WHERE RTRIM(LTRIM(d.art_codigo)) = ?
                      AND RTRIM(LTRIM(c.alm_codigo)) = ?
                      AND d.lot_codigo IS NOT NULL 
                      AND RTRIM(LTRIM(d.lot_codigo)) <> ''
                    GROUP BY d.lot_codigo, l.lot_real
                    HAVING SUM(CASE WHEN t.tmo_tipo = 'I' THEN d.mov_ctdmov ELSE -d.mov_ctdmov END) > 0
                    ORDER BY lot_cantid DESC, d.lot_codigo DESC";

        $stmt_mov = sqlsrv_query($conn, $sql_mov, array($art, $alm));
        if ($stmt_mov) {
            while ($r = sqlsrv_fetch_array($stmt_mov, SQLSRV_FETCH_ASSOC)) {
                $r['lot_id'] = trim((string)$r['lot_id']);
                $r['lot_numlote'] = trim((string)$r['lot_numlote']);
                $r['lot_cantid'] = number_format((float)$r['lot_cantid'], 2, '.', '');
                $lotes[] = $r;
            }
        }

        // 2. Si no hay registros calculados por movimientos, mostrar el catálogo maestro de log_lote
        if (empty($lotes)) {
            $sql_fallback = "SELECT l.lot_codigo AS lot_id, 
                                    l.lot_real AS lot_numlote, 
                                    0.00 AS lot_cantid 
                             FROM log_lote l 
                             WHERE RTRIM(LTRIM(l.art_codigo)) = ? 
                             ORDER BY l.lot_codigo DESC";

            $stmt_fb = sqlsrv_query($conn, $sql_fallback, array($art));
            if ($stmt_fb) {
                while ($r = sqlsrv_fetch_array($stmt_fb, SQLSRV_FETCH_ASSOC)) {
                    $r['lot_id'] = trim((string)$r['lot_id']);
                    $r['lot_numlote'] = trim((string)$r['lot_numlote']);
                    $r['lot_cantid'] = '0.00';
                    $lotes[] = $r;
                }
            }
        }
    }

    echo json_encode(["success" => true, "lotes" => $lotes]);
    exit;
}
?>
