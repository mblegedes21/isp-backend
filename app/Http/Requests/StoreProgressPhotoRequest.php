<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProgressPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ticket_id' => ['required', 'exists:tickets,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'progress_type' => ['required', 'in:MENUJU_LOKASI,MULAI_PEKERJAAN,TESTING,SELESAI'],
            'image' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:8192'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'device_timestamp' => ['nullable', 'string', 'max:80'],
        ];
    }
}
