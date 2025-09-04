<?php

namespace App\Config;

/**
 * Lightweight Supabase REST client used by system checks and simple queries.
 */
class SupabaseClient
{
    private string $baseUrl;   // e.g. https://<project>.supabase.co
    private string $apiKey;    // service role or anon key

    public function __construct(?string $baseUrl = null, ?string $apiKey = null)
    {
        $envBase = $_ENV['SUPABASE_URL'] ?? '';
        $envKey  = $_ENV['SUPABASE_ANON_KEY'] ?? '';

        $baseUrl = $baseUrl ?? $envBase;
        $apiKey  = $apiKey ?? $envKey;

        if (!$baseUrl || !$apiKey) {
            throw new \InvalidArgumentException('SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment.');
        }

        // Normalize base URL (no trailing slash)
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey  = $apiKey;
    }

    /**
     * Perform a raw HTTP request to a Supabase endpoint.
     * Returns array { success, status, headers, body, json }
     */
    private function request(string $endpoint, string $method = 'GET', ?array $query = null, $body = null, array $extraHeaders = []): array
    {
        $url = $this->baseUrl . $endpoint;
        if (!empty($query)) {
            $qs = http_build_query($query);
            $url .= (str_contains($url, '?') ? '&' : '?') . $qs;
        }

        $headers = array_merge([
            "apikey: {$this->apiKey}",
            "Authorization: Bearer {$this->apiKey}",
            'Content-Type: application/json',
            'Accept: application/json',
        ], $extraHeaders);

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_HEADER => true, // capture headers
            CURLOPT_TIMEOUT => 30,
        ];

        if ($body !== null) {
            $options[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body);
        }

        $ch = curl_init();
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        if ($errno) {
            return [
                'success' => false,
                'status' => 0,
                'headers' => [],
                'body' => null,
                'json' => null,
                'error' => $error,
            ];
        }

        $rawHeaders = substr($response, 0, $headerSize) ?: '';
        $bodyStr = substr($response, $headerSize) ?: '';
        $json = null;
        if ($bodyStr !== '') {
            $decoded = json_decode($bodyStr, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $json = $decoded;
            }
        }

        return [
            'success' => $status >= 200 && $status < 300,
            'status' => $status,
            'headers' => $rawHeaders,
            'body' => $bodyStr,
            'json' => $json,
        ];
    }

    /**
     * Simple health check for Supabase: ping the auth health endpoint.
     */
    public function testConnection(): bool
    {
        // /auth/v1/health is a lightweight health endpoint
        $res = $this->request('/auth/v1/health', 'GET');
        if ($res['success']) {
            return true;
        }

        // Fallback: try listing schemas via PostgREST root (may return 200/404 depending on config)
        $res2 = $this->request('/rest/v1/', 'GET');
        return $res2['status'] >= 200 && $res2['status'] < 500; // treat network issues as failure only
    }

    /**
     * Select helper over PostgREST.
     * - $filters: [ 'column' => ['op' => 'eq', 'value' => 'foo'] ] or [ 'col' => 'eq.value' ]
     */
    public function select(string $table, string $columns = '*', array $filters = [], ?int $limit = null): array
    {
        $query = [ 'select' => $columns ];
        // Build filters as query params: col=op.value
        foreach ($filters as $col => $def) {
            if (is_array($def) && isset($def['op'], $def['value'])) {
                $query[$col] = $def['op'] . '.' . $this->toScalar($def['value']);
            } else {
                // allow direct string like 'eq.value'
                $query[$col] = is_string($def) ? $def : $this->toScalar($def);
            }
        }
        if ($limit !== null) {
            $query['limit'] = $limit;
        }

        $res = $this->request('/rest/v1/' . rawurlencode($table), 'GET', $query, null, [
            'Prefer: count=exact',
        ]);

        if (!$res['success']) {
            return [
                'success' => false,
                'status' => $res['status'],
                'error' => $res['body'] ?? 'Unknown error',
            ];
        }

        return [
            'success' => true,
            'status' => $res['status'],
            'data' => $res['json'] ?? [],
        ];
    }

    private function toScalar($value): string
    {
        if (is_bool($value)) return $value ? 'true' : 'false';
        if (is_null($value)) return 'null';
        return (string)$value;
    }
}