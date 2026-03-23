<?php

return [
    'cache_store' => env('OPERATIONS_CACHE_STORE', env('CACHE_STORE', 'redis')),

    'cache_ttl' => [
        'ticket_counters' => (int) env('OPERATIONS_TICKET_COUNTER_TTL', 5),
        'area_summaries' => (int) env('OPERATIONS_AREA_SUMMARY_TTL', 10),
        'technician_stats' => (int) env('OPERATIONS_TECHNICIAN_STATS_TTL', 15),
    ],

    'audit_retention_days' => (int) env('OPERATIONS_AUDIT_RETENTION_DAYS', 90),

    'rate_limits' => [
        'api_per_minute' => (int) env('OPERATIONS_API_RATE_LIMIT', 120),
        'uploads_per_minute' => (int) env('OPERATIONS_UPLOAD_RATE_LIMIT', 20),
    ],

    'incident_detection' => [
        'ticket_threshold' => (int) env('OPERATIONS_INCIDENT_TICKET_THRESHOLD', 6),
        'escalation_threshold' => (int) env('OPERATIONS_INCIDENT_ESCALATION_THRESHOLD', 3),
        'lookback_minutes' => (int) env('OPERATIONS_INCIDENT_LOOKBACK_MINUTES', 30),
    ],

    'evidence' => [
        'disk' => env('OPERATIONS_EVIDENCE_DISK', 'evidence-private'),
        'temporary_disk' => env('OPERATIONS_EVIDENCE_TEMP_DISK', 'local'),
        'target_kb' => (int) env('OPERATIONS_EVIDENCE_TARGET_KB', 60),
        'max_kb' => (int) env('OPERATIONS_EVIDENCE_MAX_KB', 80),
        'max_upload_mb' => (int) env('OPERATIONS_EVIDENCE_MAX_UPLOAD_MB', 8),
        'max_width' => (int) env('OPERATIONS_EVIDENCE_MAX_WIDTH', 1280),
        'allowed_mime_types' => ['image/jpeg', 'image/png', 'image/webp'],
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    ],
];
