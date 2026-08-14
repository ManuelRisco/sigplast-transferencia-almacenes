<?php
/**
 * Módulo de Seguridad y Codificación de Contraseñas TECNOTEST
 * Algoritmo por desplazamiento de bytes (Windows-1252 / CP1252).
 */

/**
 * Codifica una contraseña en texto plano al formato binario/byte-shift de TECNOTEST.
 * 
 * @param string $text Contraseña en texto plano
 * @return string Contraseña codificada en bytes Windows-1252
 */
function encodePassword($text) {
    if ($text === '' || $text === null) {
        return '';
    }
    $raw = mb_convert_encoding($text, 'Windows-1252', 'UTF-8');
    $len = strlen($raw);
    if ($len === 0) return '';
    
    $firstByte = ord($raw[0]);
    $shift = intdiv($firstByte, 2);
    
    $encoded = '';
    for ($i = 0; $i < $len; $i++) {
        $b = ord($raw[$i]);
        $encoded .= chr(($b + $shift) % 256);
    }
    return $encoded;
}

/**
 * Valida si una contraseña en texto plano coincide con la clave guardada en adm_usuario.
 * 
 * @param string $plainPassword Contraseña ingresada por el usuario
 * @param string $storedPassword Clave almacenada en adm_usuario.usr_clave
 * @return bool True si es válida, False en caso contrario
 */
function verifyPassword($plainPassword, $storedPassword) {
    $dbClaveRaw = rtrim((string)$storedPassword);
    $inputClaveRaw = encodePassword($plainPassword);
    $inputClaveUtf8 = mb_convert_encoding($inputClaveRaw, 'UTF-8', 'Windows-1252');

    return ($dbClaveRaw === $inputClaveRaw || $dbClaveRaw === $inputClaveUtf8);
}
?>
