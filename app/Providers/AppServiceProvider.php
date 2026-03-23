<?php

namespace App\Providers;

use App\Models\LossReport;
use App\Observers\LossReportObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        LossReport::observe(LossReportObserver::class);

        RateLimiter::for('api', function (Request $request) {
            $signature = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) config('operations.rate_limits.api_per_minute', 120))
                ->by($signature);
        });

        RateLimiter::for('evidence-uploads', function (Request $request) {
            $signature = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) config('operations.rate_limits.uploads_per_minute', 20))
                ->by($signature);
        });

        if (app()->environment('production') && (bool) env('APP_FORCE_HTTPS', false)) {
            URL::forceScheme('https');
        }
    }
}
