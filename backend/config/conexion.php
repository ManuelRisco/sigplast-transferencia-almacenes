<?php
// Configuración global de CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responder inmediatamente a las peticiones OPTIONS (preflight)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Suprimir advertencias del driver ODBC SQL Server
if (function_exists('sqlsrv_configure')) {
    sqlsrv_configure("WarningsReturnAsErrors", 0);
}
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// --- CONEXIÓN SQL SERVER (TECNOTEST ERP & AUTH) ---
$conn = null;
if (function_exists('sqlsrv_connect')) {
    $serverName = "192.168.1.3\\SQLEXPRESS";
    $connectionInfo = array(
        "Database" => "TECNOTEST",
        "UID" => "sig",
        "PWD" => "Sig2025$$",
        "CharacterSet" => "UTF-8",
        "TrustServerCertificate" => true
    );
    $conn = sqlsrv_connect($serverName, $connectionInfo);
}

function getSqlServerConn() {
    global $conn;
    return $conn;
}

// Helper para leer body JSON en peticiones POST
function getJsonInput() {
    $input = file_get_contents("php://input");
    if (empty($input) && php_sapi_name() === 'cli') {
        $input = file_get_contents("php://stdin");
    }
    $data = json_decode($input, true);
    if (is_array($data)) {
        return $data;
    }
    return !empty($_POST) ? $_POST : [];
}
?>
