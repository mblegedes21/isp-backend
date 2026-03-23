<?php

use App\Jobs\DeleteAuditLogs;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auth:debug-users {email?} {--password=password123}', function (?string $email = null) {
    $password = (string) $this->option('password');
    $query = User::query()->select(['id', 'name', 'email', 'role', 'branch_id', 'area_id', 'password']);

    if ($email) {
        $query->where('email', $email);
    }

    $users = $query->orderBy('id')->get();

    if ($users->isEmpty()) {
        $this->warn('Tidak ada user yang ditemukan.');
        return self::SUCCESS;
    }

    $this->table(
        ['ID', 'Nama', 'Email', 'Role', 'Branch', 'Area', 'Password OK'],
        $users->map(function (User $user) use ($password) {
            return [
                $user->id,
                $user->name,
                $user->email,
                $user->role,
                $user->branch_id,
                $user->area_id,
                Hash::check($password, $user->password) ? 'YES' : 'NO',
            ];
        })->all()
    );
})->purpose('List user auth seed dan verifikasi password hash');

Schedule::job(new DeleteAuditLogs())
    ->dailyAt('01:00')
    ->name('delete-audit-logs')
    ->withoutOverlapping();
