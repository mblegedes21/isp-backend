<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class MaterialCategory extends Model
{
    use HasFactory;

    public const STANDARDIZED_CATEGORIES = [
        'KABEL' => 'Kabel utama dan kabel penunjang jaringan ISP.',
        'TIANG_AKSESORIS' => 'Tiang, clamp, bracket, dan aksesoris penyangga.',
        'BOX_DISTRIBUSI' => 'ODP, ODC, FAT, dan box distribusi jaringan.',
        'SPLITTER' => 'Splitter pasif untuk distribusi fiber.',
        'PERANGKAT' => 'Perangkat aktif dan perangkat pelanggan seperti ONT atau router.',
        'FIBER_AKSESORIS' => 'Patchcord, connector, pigtail, adaptor, dan aksesoris fiber.',
        'ALAT_TEKNISI' => 'Peralatan kerja dan alat bantu teknisi.',
        'MATERIAL_INSTALASI' => 'Material instalasi lapangan dan consumable.',
        'LAINNYA' => 'Kategori fallback untuk material yang belum terklasifikasi.',
    ];

    protected $fillable = [
        'name',
        'description',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $category) {
            $category->name = self::normalizeName($category->name);
        });
    }

    public static function normalizeName(?string $name): string
    {
        $normalized = Str::upper((string) $name);
        $normalized = preg_replace('/[^A-Z0-9]+/', '_', $normalized) ?? '';
        $normalized = preg_replace('/_+/', '_', $normalized) ?? '';

        return trim($normalized, '_');
    }

    public static function allowedNames(): array
    {
        return array_keys(self::STANDARDIZED_CATEGORIES);
    }

    public function brands()
    {
        return $this->hasMany(MaterialBrand::class, 'category_id');
    }

    public function materials()
    {
        return $this->hasMany(Material::class, 'category_id');
    }
}
