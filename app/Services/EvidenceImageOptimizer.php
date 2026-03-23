<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class EvidenceImageOptimizer
{
    public function optimize(string $tempPath, string $destinationDirectory): array
    {
        $disk = Storage::disk(config('operations.evidence.temporary_disk', 'local'));

        if (!$disk->exists($tempPath)) {
            throw new RuntimeException('Temporary evidence file not found.');
        }

        $absolutePath = $disk->path($tempPath);
        $meta = @getimagesize($absolutePath);

        if (!$meta) {
            throw new RuntimeException('Unable to read image metadata.');
        }

        [$width, $height] = $meta;
        $mime = $meta['mime'] ?? null;
        $source = $this->createImageResource($absolutePath, $mime);
        $resized = $this->resizeIfNeeded($source, $width, $height);
        [$finalBinary, $finalWidth, $finalHeight] = $this->encodeWithinTarget($resized, imagesx($resized), imagesy($resized));

        $filename = Str::random(40).'.webp';
        $relativePath = trim($destinationDirectory, '/').'/'.$filename;
        Storage::disk(config('operations.evidence.disk', 'evidence-private'))->put($relativePath, $finalBinary);
        $disk->delete($tempPath);

        imagedestroy($source);
        if ($resized !== $source) {
            imagedestroy($resized);
        }

        return [
            'disk' => config('operations.evidence.disk', 'evidence-private'),
            'path' => $relativePath,
            'mime_type' => 'image/webp',
            'size_bytes' => strlen($finalBinary),
            'width' => $finalWidth,
            'height' => $finalHeight,
        ];
    }

    protected function createImageResource(string $path, ?string $mime)
    {
        return match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png' => imagecreatefrompng($path),
            'image/webp' => imagecreatefromwebp($path),
            default => throw new RuntimeException('Unsupported evidence mime type.'),
        };
    }

    protected function resizeIfNeeded($image, int $width, int $height)
    {
        $maxWidth = (int) config('operations.evidence.max_width', 1280);

        if ($width <= $maxWidth) {
            return $image;
        }

        $targetWidth = $maxWidth;
        $targetHeight = (int) round(($height / $width) * $targetWidth);
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($canvas, true);
        imagesavealpha($canvas, true);
        imagecopyresampled($canvas, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        return $canvas;
    }

    protected function encodeWithinTarget($image, int $width, int $height): array
    {
        $targetBytes = (int) config('operations.evidence.target_kb', 60) * 1024;
        $maxBytes = (int) config('operations.evidence.max_kb', 80) * 1024;
        $quality = 82;
        $currentImage = $image;
        $currentWidth = $width;
        $currentHeight = $height;
        $binary = '';

        while ($quality >= 35) {
            $binary = $this->encodeWebp($currentImage, $quality);

            if (strlen($binary) <= $maxBytes) {
                return [$binary, $currentWidth, $currentHeight];
            }

            $quality -= 7;

            if ($quality < 50 && $currentWidth > 960) {
                $scaledWidth = (int) round($currentWidth * 0.9);
                $scaledHeight = (int) round($currentHeight * 0.9);
                $scaled = imagecreatetruecolor($scaledWidth, $scaledHeight);
                imagealphablending($scaled, true);
                imagesavealpha($scaled, true);
                imagecopyresampled($scaled, $currentImage, 0, 0, 0, 0, $scaledWidth, $scaledHeight, $currentWidth, $currentHeight);
                $currentImage = $scaled;
                $currentWidth = $scaledWidth;
                $currentHeight = $scaledHeight;
            }
        }

        if (strlen($binary) > $maxBytes) {
            throw new RuntimeException('Unable to compress evidence image within allowed size.');
        }

        if (strlen($binary) < $targetBytes || strlen($binary) <= $maxBytes) {
            return [$binary, $currentWidth, $currentHeight];
        }

        throw new RuntimeException('Evidence optimization failed.');
    }

    protected function encodeWebp($image, int $quality): string
    {
        ob_start();
        imagewebp($image, null, $quality);
        return (string) ob_get_clean();
    }
}
