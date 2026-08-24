<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$body = vf_body();
$email = vf_email((string)($body['email'] ?? ''));
if ($email === '') vf_json(['ok' => false, 'message' => 'Email no válido.'], 422);

$codes = vf_read_store('login_codes');
$key = vf_user_key($email);
$last = $codes[$key]['sent_at'] ?? 0;
if ($last && time() - (int)$last < 45) {
    vf_json(['ok' => false, 'message' => 'Espera unos segundos antes de pedir otro código.'], 429);
}

$code = (string) random_int(100000, 999999);
$codes[$key] = [
    'email' => $email,
    'code_hash' => vf_hash($email . ':' . $code),
    'expires' => time() + VF_CODE_TTL,
    'sent_at' => time(),
];

$sent = vf_send_login_code($email, $code, 'sudoku-login/' . $key . '/' . (string) floor(time() / 60));
if (!$sent['ok']) vf_json(['ok' => false, 'message' => $sent['message']], 503);

vf_write_store('login_codes', $codes);
vf_json(['ok' => true, 'message' => 'Código enviado.']);
