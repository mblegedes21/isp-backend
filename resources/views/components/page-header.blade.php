<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
    <div class="flex-1">
        <nav class="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
            {{ $breadcrumb ?? '' }}
        </nav>

        <h1 class="text-xl font-semibold text-gray-800">{{ $title ?? '' }}</h1>
        @if(! empty($subtitle))
        <p class="text-sm text-gray-500 mt-1">{{ '' }}</p>
        @endif
    </div>

    <div class="flex items-center gap-3">
        <div class="hidden sm:block">
            <div class="relative">
                <input type="search" placeholder="Search..." class="border rounded-md px-3 py-2 text-sm w-64" />
            </div>
        </div>
        <div>
            {{ $actions ?? '' }}
        </div>
    </div>
</div>

