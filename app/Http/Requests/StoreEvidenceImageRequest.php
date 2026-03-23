<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvidenceImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxKb = (int) config('operations.evidence.max_upload_mb', 8) * 1024;

        return [
            'image' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp', "max:{$maxKb}"],
            'uploaded_by' => ['nullable', 'exists:users,id'],
        ];
    }
}
