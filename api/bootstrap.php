<?php
declare(strict_types=1);

const VF_SESSION_COOKIE = 'vf_sudoku_session';
const VF_CODE_TTL = 600;
const VF_SESSION_TTL = 2592000;

function vf_config(): array {
    static $config = null;
    if ($config !== null) return $config;
    $config = [];
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $loaded = require $local;
        if (is_array($loaded)) $config = $loaded;
    }
    return $config;
}

function vf_config_value(string $key, string $default = ''): string {
    $env = getenv($key);
    if (is_string($env) && $env !== '') return $env;
    $config = vf_config();
    return isset($config[$key]) && is_string($config[$key]) ? $config[$key] : $default;
}

function vf_json(array $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function vf_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function vf_email(string $email): string {
    $email = strtolower(trim($email));
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function vf_data_dir(): string {
    $dir = dirname(__DIR__) . '/data';
    if (!is_dir($dir)) mkdir($dir, 0750, true);
    return $dir;
}

function vf_store_path(string $name): string {
    return vf_data_dir() . '/' . preg_replace('/[^a-z0-9_-]/i', '', $name) . '.json';
}

function vf_read_store(string $name): array {
    $path = vf_store_path($name);
    if (!is_file($path)) return [];
    $json = file_get_contents($path);
    $data = json_decode($json ?: '{}', true);
    return is_array($data) ? $data : [];
}

function vf_write_store(string $name, array $data): void {
    $path = vf_store_path($name);
    $handle = fopen($path, 'c+');
    if (!$handle) vf_json(['ok' => false, 'message' => 'No se pudo abrir almacenamiento.'], 500);
    flock($handle, LOCK_EX);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    chmod($path, 0640);
}

function vf_secret(): string {
    return vf_config_value('VF_AUTH_SECRET', vf_config_value('RESEND_API_KEY', 'viking-fitness-local-secret'));
}

function vf_hash(string $value): string {
    return hash_hmac('sha256', $value, vf_secret());
}

function vf_user_key(string $email): string {
    return hash('sha256', $email);
}

function vf_set_session(string $email): array {
    $token = bin2hex(random_bytes(32));
    $sessions = vf_read_store('sessions');
    $sessions[vf_hash($token)] = [
        'email' => $email,
        'expires' => time() + VF_SESSION_TTL,
    ];
    vf_write_store('sessions', $sessions);
    setcookie(VF_SESSION_COOKIE, $token, [
        'expires' => time() + VF_SESSION_TTL,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    return ['email' => $email];
}

function vf_current_user(): ?array {
    $token = $_COOKIE[VF_SESSION_COOKIE] ?? '';
    if (!is_string($token) || $token === '') return null;
    $sessions = vf_read_store('sessions');
    $key = vf_hash($token);
    if (!isset($sessions[$key]) || !is_array($sessions[$key])) return null;
    if (($sessions[$key]['expires'] ?? 0) < time()) return null;
    return ['email' => (string) $sessions[$key]['email']];
}

function vf_clear_session(): void {
    $token = $_COOKIE[VF_SESSION_COOKIE] ?? '';
    if (is_string($token) && $token !== '') {
        $sessions = vf_read_store('sessions');
        unset($sessions[vf_hash($token)]);
        vf_write_store('sessions', $sessions);
    }
    setcookie(VF_SESSION_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function vf_send_login_code(string $email, string $code, string $idempotency): array {
    $apiKey = vf_config_value('RESEND_API_KEY');
    if ($apiKey === '') return ['ok' => false, 'message' => 'Resend no está configurado en el servidor.'];
    if (!function_exists('curl_init')) return ['ok' => false, 'message' => 'PHP cURL no está activo en el servidor.'];
    $from = vf_config_value('RESEND_FROM', 'Viking Fitness <onboarding@resend.dev>');
    $payload = [
        'from' => $from,
        'to' => [$email],
        'subject' => 'Tu código de acceso a Sudoku Vikingo',
        'html' => '<p>Tu código de acceso es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">' . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') . '</p><p>Caduca en 10 minutos.</p>',
        'text' => "Tu código de acceso a Sudoku Vikingo es {$code}. Caduca en 10 minutos.",
        'tags' => [
            ['name' => 'email_type', 'value' => 'sudoku_login'],
        ],
    ];
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
            'Idempotency-Key: ' . $idempotency,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 12,
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($response === false || $status < 200 || $status >= 300) {
        return ['ok' => false, 'message' => $error ?: 'Resend rechazó el envío.', 'status' => $status];
    }
    return ['ok' => true];
}
