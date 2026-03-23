@extends('layouts.app')

@section('title', 'Review Request')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="mb-6">
        <a href="{{ route('leader.dashboard') }}" class="text-blue-500 hover:text-blue-700">← Back to Dashboard</a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="md:col-span-2">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h1 class="text-2xl font-bold text-gray-900">{{ optional($request)->nomor_ticket ?? '' }}</h1>
                <p class="text-gray-600">{{ optional($request)->jenis_pekerjaan ?? '' }}</p>

                <div class="mt-4 flex items-center gap-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                        Pending Review
                    </span>
                    <p class="text-sm text-gray-600">Created: {{ optional(optional($request)->created_at)->format('M d, Y H:i') ?? '' }}</p>
                </div>
            </div>

            <!-- Materials -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Requested Materials</h2>
                <div class="space-y-2">
                    @foreach((optional($request)->materials ?? []) as $material)
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                            <p class="font-bold text-gray-900">{{ optional(optional($material)->product)->name ?? '' }}</p>
                            <p class="text-sm text-gray-600">SKU: {{ optional(optional($material)->product)->sku ?? '' }}</p>
                        </div>
                        <p class="text-lg font-bold text-gray-900">{{ $material->qty ?? 0 }} units</p>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>

        <!-- Actions Sidebar -->
        <div>
            <div class="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Actions</h3>

                <form method="POST" action="{{ route('leader.permintaan.approve', optional($request)->id ?? 0) }}" class="mb-3">
                    @csrf
                    <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                        ✓ Approve
                    </button>
                </form>

                <form method="POST" action="{{ route('leader.permintaan.reject', optional($request)->id ?? 0) }}">
                    @csrf
                    <button type="submit" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        ✗ Reject
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
