<?php
// Configuración global de CORS y JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responder inmediatamente a las peticiones OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Suprimir advertencias del driver ODBC SQL Server
if (function_exists('sqlsrv_configure')) {
    sqlsrv_configure("WarningsReturnAsErrors", 0);
}
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// --- CONEXIÓN SQL SERVER (ERP) ---
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

// --- CONEXIÓN MYSQL (XAMPP LOCAL - tf_almacen) ---
$mysqlHost = "localhost";
$mysqlUser = "root";
$mysqlPass = "";
$mysqlDB   = "tf_almacen";

$connMysql = new mysqli($mysqlHost, $mysqlUser, $mysqlPass, $mysqlDB);
if ($connMysql->connect_error) {
    echo json_encode(["success" => false, "error" => "Error al conectar con MySQL local: " . $connMysql->connect_error]);
    exit;
}
$connMysql->set_charset("utf8mb4");

function getSqlServerConn() {
    global $conn;
    return $conn;
}

// Helper para leer body JSON en peticiones POST
function getJsonInput() {
    $input = file_get_contents("php://input");
    return json_decode($input, true) ?? $_POST;
}
?>
