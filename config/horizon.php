<?php

return [
    'use' => 'default',

    'prefix' => env('HORIZON_PREFIX', 'warehouse-isp_horizon:'),

    'defaults' => [
        'supervisor-1' => [
            'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
            'queue' => ['default', 'broadcasts', 'evidence', 'maintenance', 'stats'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 10,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 256,
            'tries' => 3,
            'timeout' => 120,
            'nice' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'maxProcesses' => 20,
                'balanceMaxShift' => 2,
                'balanceCooldown' => 3,
            ],
        ],

        'local' => [
            'supervisor-1' => [
                'maxProcesses' => 5,
            ],
        ],
    ],
];
