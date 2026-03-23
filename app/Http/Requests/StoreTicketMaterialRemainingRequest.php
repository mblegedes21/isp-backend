<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketMaterialRemainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ticket_id' => ['required', 'exists:tickets,id'],
            'material_id' => ['required', 'exists:products,id'],
            'technician_id' => ['nullable', 'exists:users,id'],
            'quantity_remaining' => ['required', 'integer', 'min:1'],
            'image' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:8192'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['required', 'numeric', 'min:0'],
            'device_timestamp' => ['required', 'string', 'max:80'],
        ];
    }
}
