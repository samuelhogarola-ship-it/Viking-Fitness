<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$body = vf_body();
$email = vf_email((string)($body['email'] ?? ''));
$code = preg_replace('/\D/', '', (string)($body['code'] ?? ''));
if ($email === '' || strlen($code) !== 6) vf_json(['ok' => false, 'message' => 'Código no válido.'], 422);

$codes = vf_read_store('login_codes');
$key = vf_user_key($email);
$record = $codes[$key] ?? null;
if (!is_array($record) || ($record['expires'] ?? 0) < time()) {
    vf_json(['ok' => false, 'message' => 'Código caducado. Pide uno nuevo.'], 401);
}

$expected = (string)($record['code_hash'] ?? '');
if (!hash_equals($expected, vf_hash($email . ':' . $code))) {
    vf_json(['ok' => false, 'message' => 'Código incorrecto.'], 401);
}

unset($codes[$key]);
vf_write_store('login_codes', $codes);
$user = vf_set_session($email);
vf_json(['ok' => true, 'user' => $user]);
