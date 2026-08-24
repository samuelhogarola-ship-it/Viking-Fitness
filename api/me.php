<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$user = vf_current_user();
vf_json(['ok' => true, 'user' => $user]);
