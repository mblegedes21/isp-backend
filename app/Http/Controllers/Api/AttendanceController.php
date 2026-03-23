<?php

namespace App\Http\Controllers\Api;

use App\Events\AttendanceFlagged;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceFlag;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with('user:id,name,email')->latest('date');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('flagged')) {
            $query->where('flagged', $request->boolean('flagged'));
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance list loaded.',
            'data' => $query->paginate(30),
        ]);
    }

    public function checkIn(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_without:location'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_without:location'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:190'],
            'timestamp' => ['nullable', 'date'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $userId = $data['user_id'] ?? optional($request->user())->id;
        abort_if(!$userId, 422, 'user_id is required.');
        $user = User::query()->findOrFail($userId);

        $record = Attendance::firstOrNew([
            'user_id' => $userId,
            'date' => $this->resolveTimestamp($data['timestamp'] ?? null)->toDateString(),
        ]);

        if (!$record->check_in) {
            $record->check_in = $this->resolveTimestamp($data['timestamp'] ?? null);
        }

        $record->branch_id = $record->branch_id ?? $user->branch_id;
        $record->area_id = $record->area_id ?? $user->area_id;
        $record->latitude = $data['latitude'] ?? $record->latitude;
        $record->longitude = $data['longitude'] ?? $record->longitude;
        $record->accuracy = $data['accuracy'] ?? $record->accuracy ?? 0;
        $record->gps = $data['location'] ?? $this->buildLocationString(
            $data['latitude'] ?? $record->latitude,
            $data['longitude'] ?? $record->longitude
        );
        $record->photo_path = $this->storePhoto($request, $record->photo_path, 'attendance/check-in');
        $record->photo = $record->photo_path;
        $flaggedNow = now()->format('H:i:s') > '09:00:00';
        $record->flagged = $record->flagged || $flaggedNow;
        $record->save();

        if ($flaggedNow) {
            AttendanceFlag::create([
                'attendance_id' => $record->id,
                'user_id' => $record->user_id,
                'branch_id' => $record->branch_id,
                'area_id' => $record->area_id,
                'flag_type' => 'TERLAMBAT',
                'context' => ['check_in' => $record->check_in?->toIso8601String()],
            ]);

            AttendanceFlagged::dispatch($record->fresh(), 'TERLAMBAT');
        }

        $auditLogger->write(
            action: 'attendance.check_in',
            module: 'attendance',
            entityType: Attendance::class,
            entityId: $record->id,
            afterState: $record->toArray(),
            userId: $userId,
            branchId: $record->branch_id,
            areaId: $record->area_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Check-in berhasil.',
            'data' => array_merge(
                $record->fresh(['user:id,name,email', 'branch:id,name'])->toArray(),
                [
                    'type' => 'check_in',
                    'location' => $record->gps,
                    'timestamp' => $record->check_in?->toIso8601String(),
                ]
            ),
        ]);
    }

    public function checkOut(Request $request, AuditLogger $auditLogger)
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_without:location'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_without:location'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:190'],
            'timestamp' => ['nullable', 'date'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $userId = $data['user_id'] ?? optional($request->user())->id;
        abort_if(!$userId, 422, 'user_id is required.');

        $record = Attendance::where('user_id', $userId)
            ->whereDate('date', $this->resolveTimestamp($data['timestamp'] ?? null)->toDateString())
            ->firstOrFail();

        $record->check_out = $this->resolveTimestamp($data['timestamp'] ?? null);
        $record->latitude = $data['latitude'] ?? $record->latitude;
        $record->longitude = $data['longitude'] ?? $record->longitude;
        $record->accuracy = $data['accuracy'] ?? $record->accuracy ?? 0;
        $record->gps = $data['location'] ?? $this->buildLocationString(
            $data['latitude'] ?? $record->latitude,
            $data['longitude'] ?? $record->longitude
        );
        $record->photo_path = $this->storePhoto($request, $record->photo_path, 'attendance/check-out');
        $record->photo = $record->photo_path;
        $flaggedNow = now()->format('H:i:s') < '17:00:00';
        $record->flagged = $record->flagged || $flaggedNow;
        $record->save();

        if ($flaggedNow) {
            AttendanceFlag::create([
                'attendance_id' => $record->id,
                'user_id' => $record->user_id,
                'branch_id' => $record->branch_id,
                'area_id' => $record->area_id,
                'flag_type' => 'TIDAK_CHECK_OUT',
                'context' => ['check_out' => $record->check_out?->toIso8601String()],
            ]);

            AttendanceFlagged::dispatch($record->fresh(), 'TIDAK_CHECK_OUT');
        }

        $auditLogger->write(
            action: 'attendance.check_out',
            module: 'attendance',
            entityType: Attendance::class,
            entityId: $record->id,
            afterState: $record->toArray(),
            userId: $userId,
            branchId: $record->branch_id,
            areaId: $record->area_id,
            request: $request,
        );

        return response()->json([
            'success' => true,
            'message' => 'Check-out berhasil.',
            'data' => array_merge(
                $record->fresh(['user:id,name,email', 'branch:id,name'])->toArray(),
                [
                    'type' => 'check_out',
                    'location' => $record->gps,
                    'timestamp' => $record->check_out?->toIso8601String(),
                ]
            ),
        ]);
    }

    private function resolveTimestamp(?string $timestamp): Carbon
    {
        return $timestamp ? Carbon::parse($timestamp) : now();
    }

    private function buildLocationString(float|int|string|null $latitude, float|int|string|null $longitude): string
    {
        if ($latitude === null || $longitude === null) {
            return '-';
        }

        return $latitude.', '.$longitude;
    }

    private function storePhoto(Request $request, ?string $existingPath, string $directory): ?string
    {
        if (!$request->hasFile('photo')) {
            return $existingPath;
        }

        if ($existingPath) {
            Storage::disk('public')->delete($existingPath);
        }

        return $request->file('photo')->storeAs(
            $directory,
            Str::uuid()->toString().'.'.$request->file('photo')->getClientOriginalExtension(),
            'public',
        );
    }
}
