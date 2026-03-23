<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    public const ROLE_NOC = 'NOC';
    public const ROLE_LEADER = 'LEADER';
    public const ROLE_ADMIN_GUDANG = 'ADMIN_GUDANG';
    public const ROLE_TEKNISI = 'TEKNISI';
    public const ROLE_MANAGER = 'MANAGER';
    public const ROLE_MITRA = 'MITRA';

    public const ROLES = [
        self::ROLE_NOC,
        self::ROLE_LEADER,
        self::ROLE_ADMIN_GUDANG,
        self::ROLE_TEKNISI,
        self::ROLE_MANAGER,
        self::ROLE_MITRA,
    ];

    public const ROLE_STORAGE_MAP = [
        'NOC' => self::ROLE_NOC,
        'LEADER' => self::ROLE_LEADER,
        'MANAGER' => self::ROLE_MANAGER,
        'MITRA' => self::ROLE_MITRA,
        'TEKNISI' => self::ROLE_TEKNISI,
        'TECHNICIAN' => self::ROLE_TEKNISI,
        'WAREHOUSE' => self::ROLE_ADMIN_GUDANG,
        'ADMIN_GUDANG' => self::ROLE_ADMIN_GUDANG,
        'ADMINGUDANG' => self::ROLE_ADMIN_GUDANG,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'area_id',
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getRoleAttribute($value): string
    {
        return self::databaseRole((string) $value);
    }

    public function setRoleAttribute($value): void
    {
        $normalized = strtoupper(trim((string) $value));
        $this->attributes['role'] = self::ROLE_STORAGE_MAP[$normalized] ?? $normalized;
    }

    public static function databaseRole(string $role): string
    {
        $normalized = strtoupper(trim($role));

        return self::ROLE_STORAGE_MAP[$normalized] ?? $normalized;
    }

    public function isTechnician()
    {
        return $this->role === self::ROLE_TEKNISI;
    }

    public function isLeader()
    {
        return $this->role === self::ROLE_LEADER;
    }

    public function isNoc()
    {
        return $this->role === self::ROLE_NOC;
    }

    public function isManager()
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isWarehouse()
    {
        return $this->role === self::ROLE_ADMIN_GUDANG;
    }

    public function isMitra()
    {
        return $this->role === self::ROLE_MITRA;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'mitra_id');
    }
}
