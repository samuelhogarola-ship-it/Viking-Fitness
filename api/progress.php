<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$user = vf_current_user();
if (!$user) vf_json(['ok' => false, 'message' => 'Sesión requerida.'], 401);

$store = vf_read_store('progress');
$key = vf_user_key($user['email']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    vf_json(['ok' => true, 'progress' => $store[$key]['progress'] ?? null]);
}

$body = vf_body();
$progress = $body['progress'] ?? null;
if (!is_array($progress)) vf_json(['ok' => false, 'message' => 'Progreso no válido.'], 422);

$store[$key] = [
    'email' => $user['email'],
    'updated_at' => gmdate('c'),
    'progress' => $progress,
];
vf_write_store('progress', $store);
vf_json(['ok' => true]);
