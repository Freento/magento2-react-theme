<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: public, max-age=300');

function fail(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

function readInput(): array
{
    $prefix    = isset($_GET['prefix']) ? (string)$_GET['prefix'] : '';
    $limit     = isset($_GET['limit'])  ? min(200, max(1, (int)$_GET['limit'])) : 50;
    $storeCode = isset($_SERVER['HTTP_STORE']) ? (string)$_SERVER['HTTP_STORE'] : '';

    if ($storeCode !== '' && !preg_match('/^[a-z0-9_]{1,32}$/i', $storeCode)) {
        fail(400, 'invalid Store header');
    }
    if ($prefix === '' || strlen($prefix) > 200) {
        fail(400, 'prefix is required and must be ≤ 200 chars');
    }
    if (!preg_match('/^[a-zA-Z0-9._\-\/]+$/', $prefix)) {
        fail(400, 'prefix contains invalid characters');
    }

    return [$prefix, $limit, $storeCode];
}

function openDb(): array
{
    $envPath = __DIR__ . '/../app/etc/env.php';
    if (!is_file($envPath)) {
        fail(500, 'env.php not found');
    }
    $env  = require $envPath;
    $conn = $env['db']['connection']['default'] ?? null;
    if (!$conn) {
        fail(500, 'db.default connection missing in env.php');
    }
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $conn['host'],
        $conn['dbname']
    );
    $pdo = new PDO($dsn, $conn['username'], $conn['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_PERSISTENT         => true,
    ]);
    return [$pdo, (string)($env['db']['table_prefix'] ?? '')];
}

function lookupUrlRewrites(
    PDO $pdo,
    string $tablePrefix,
    string $storeCode,
    string $prefix,
    int $limit
): array {
    $urlRewrite = $tablePrefix . 'url_rewrite';
    $store      = $tablePrefix . 'store';

    $sql = "SELECT ur.request_path, ur.target_path, ur.entity_type, ur.entity_id, ur.redirect_type, ur.store_id
            FROM {$urlRewrite} ur
            WHERE ur.store_id = (
                SELECT store_id FROM {$store}
                WHERE is_active = 1 AND store_id > 0
                  AND (:code1 = '' OR code = :code2)
                ORDER BY (code = :code3) DESC, sort_order ASC, store_id ASC
                LIMIT 1
            )
            AND ur.request_path LIKE :pattern
            ORDER BY LENGTH(ur.request_path) ASC
            LIMIT :lim";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':code1',   $storeCode,    PDO::PARAM_STR);
    $stmt->bindValue(':code2',   $storeCode,    PDO::PARAM_STR);
    $stmt->bindValue(':code3',   $storeCode,    PDO::PARAM_STR);
    $stmt->bindValue(':pattern', $prefix . '%', PDO::PARAM_STR);
    $stmt->bindValue(':lim',     $limit,        PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

[$prefix, $limit, $storeCode] = readInput();

try {
    [$pdo, $tablePrefix] = openDb();
    $rows = lookupUrlRewrites($pdo, $tablePrefix, $storeCode, $prefix, $limit);
} catch (Throwable $e) {
    error_log('[getReactResolveUrl] ' . $e->getMessage());
    fail(500, 'db error');
}

echo json_encode(['matches' => $rows]);
