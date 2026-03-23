<?php /* App layout component wrapping sidebar + topbar */ ?>
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Warehouse ISP') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="font-sans antialiased bg-gray-100">
    <div class="min-h-screen flex">
        <!-- Sidebar -->
        <aside x-data="{ openWarehouse: false, openInventory: false }" class="w-64 bg-white border-r hidden lg:block">
            <div class="h-16 flex items-center px-4 border-b">
                <a href="{{ url('#') }}" class="font-semibold text-lg flex items-center gap-2"
                    title="{{ config('app.name','Warehouse ISP') }}">
                    <!-- Heroicon: Office Building (outline-like) -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M3 10h18M9 3v7M15 3v7" />
                    </svg>
                    {{ config('app.name','Warehouse ISP') }}
                </a>
            </div>

            <nav class="p-4 text-sm">
                {{-- Requests --}}
                <div class="mb-4">
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Requests</h6>
                    @role('technician')
                    <a href="{{ url('#') }}" class="mt-2 flex items-center gap-2 rounded px-2 py-1 {{ request()->routeIs('requests.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">
                        <!-- Heroicon: Clipboard List -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5h6M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2zM7 8h.01M7 12h.01M7 16h.01" />
                        </svg>
                        All Requests
                    </a>
                    @endrole
                    @role('warehouse_admin')
                    <a href="{{ url('#') }}" class="mt-2 flex items-center gap-2 rounded px-2 py-1 {{ request()->routeIs('requests.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5h6M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2zM7 8h.01M7 12h.01M7 16h.01" />
                        </svg>
                        All Requests
                    </a>
                    @endrole
                </div>

                {{-- Approvals --}}
                <div class="mb-4">
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Approvals</h6>
                    @role('approver')
                    <a href="{{ url('#') }}" class="mt-2 flex items-center gap-2 rounded px-2 py-1 {{ request()->routeIs('approvals.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">
                        <!-- Heroicon: Check Badge -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" />
                        </svg>
                        Pending Approvals
                    </a>
                    @endrole
                </div>

                {{-- Warehouse (collapsible) --}}
                <div class="mb-4">
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Warehouse</h6>
                    <button @click="openWarehouse = !openWarehouse" class="w-full flex items-center justify-between text-gray-700 hover:text-blue-600">
                        <span class="flex items-center gap-2">
                            <!-- Heroicon: Archive Box -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M16 3v4M8 3v4M3 7l1 13a2 2 0 002 2h12a2 2 0 002-2l1-13" />
                            </svg>
                            Actions
                        </span>
                        <svg :class="openWarehouse ? 'rotate-90' : ''" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div x-show="openWarehouse" class="mt-2 space-y-1" x-cloak>
                        @role('warehouse_admin')
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('warehouse.issue') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Issue</a>
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('warehouse.return') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Return</a>
                        @endrole
                        @role('technician')
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('warehouse.outstanding') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Outstanding</a>
                        @endrole
                        @role('warehouse_admin')
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('warehouse.outstanding') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Outstanding</a>
                        @endrole
                    </div>
                </div>

                {{-- Inventory (collapsible) --}}
                <div class="mb-4">
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Inventory</h6>
                    <button @click="openInventory = !openInventory" class="w-full flex items-center justify-between text-gray-700 hover:text-blue-600">
                        <span class="flex items-center gap-2">
                            <!-- Heroicon: Collection -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7l9-4 9 4" />
                            </svg>
                            Inventory
                        </span>
                        <svg :class="openInventory ? 'rotate-90' : ''" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div x-show="openInventory" class="mt-2 space-y-1" x-cloak>
                        @role('warehouse_admin')
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('products.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Products</a>
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('serials.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Serials</a>
                        <a href="{{ url('#') }}" class="block ml-6 rounded px-2 py-1 {{ request()->routeIs('stock.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">Stock</a>
                        @endrole
                    </div>
                </div>

                {{-- Reports --}}
                <div class="mb-4">
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Reports</h6>
                    @role('auditor')
                    <a href="{{ url('#') }}" class="mt-2 flex items-center gap-2 rounded px-2 py-1 {{ request()->routeIs('reports.*') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600' }}">
                        <!-- Heroicon: Chart Bar -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3v18h18M12 8v8M7 12v4M17 6v14" />
                        </svg>
                        Reports
                    </a>
                    @endrole
                </div>
            </nav>
        </aside>

        <!-- Main area -->
        <div class="flex-1 min-h-screen">
            <!-- Topbar -->
            <header class="bg-white border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div class="flex items-center space-x-4">
                        @isset($header)
                        <div class="text-lg font-semibold">{{ $header ?? '' }}</div>
                        @endisset
                    </div>

                    <div class="flex items-center space-x-4">
                        <form method="POST" action="{{ route('location.set') }}" class="flex items-center">
                            @csrf
                            <label class="text-sm text-gray-600 me-2">Active Location</label>
                            <select name="location" onchange="this.form.submit()" class="rounded-md border-gray-300 text-sm">
                                @php $active = session('active_location','Pusat'); @endphp
                                <option value="Pusat" {{ $active=='Pusat' ? 'selected' : '' }}>Pusat</option>
                                <option value="Cabang A" {{ $active=='Cabang A' ? 'selected' : '' }}>Cabang A</option>
                                <option value="Cabang B" {{ $active=='Cabang B' ? 'selected' : '' }}>Cabang B</option>
                            </select>
                        </form>

                        <div class="hidden sm:flex sm:items-center">
                            @include('layouts.navigation')
                        </div>
                    </div>
                </div>
            </header>

            <main class="p-6">
                {{ $slot ?? '' }}
            </main>
        </div>
    </div>
</body>

</html>


