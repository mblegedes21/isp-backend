<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="font-sans antialiased bg-gray-100">
    @php
        $role = session('demo_role', 'Teknisi');
        $active = session('demo_location', 'Pusat');
        $homeRoute = 'technician.dashboard';
        if ($role === 'Leader') {
            $homeRoute = 'leader.dashboard';
        } elseif ($role === 'Gudang') {
            $homeRoute = 'gudang.dashboard';
        } elseif ($role === 'Manager' || $role === 'Owner') {
            $homeRoute = 'manager.dashboard';
        }
    @endphp

    <div class="min-h-screen flex flex-col md:flex-row">
        <!-- Sidebar (desktop only) -->
        <aside class="hidden md:block w-64 bg-white border-r">
            <div class="h-16 flex items-center px-4 border-b">
                <a href="{{ route($homeRoute) }}" class="font-semibold text-lg">{{ config('app.name','Warehouse ISP') }}</a>
            </div>

            <nav class="p-4 space-y-6">
                @if($role=='Gudang')
                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Dashboard</h6>
                    <a href="{{ route('gudang.dashboard') }}" class="mt-2 flex items-center space-x-2 text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.dashboard') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3h14v4H3V3zM3 9h14v8H3V9z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                </div>

                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Barang Keluar</h6>
                    <a href="{{ route('gudang.permintaan.index') }}" class="mt-2 block text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.permintaan.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">Request Proyek</a>
                    <a href="{{ route('gudang.transfer.index') }}" class="mt-2 block text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.transfer.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">Keluar ke Gudang Lain</a>
                </div>

                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Barang Masuk</h6>
                    <a href="{{ route('gudang.permintaan.index') }}" class="mt-2 block text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.permintaan.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">Return Proyek</a>
                    <a href="{{ route('gudang.transfer.index') }}" class="mt-2 block text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.transfer.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">Masuk dari Gudang Lain</a>
                </div>

                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Stok Gudang</h6>
                    <a href="{{ route('gudang.dashboard') }}" class="mt-2 block text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('gudang.dashboard') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">Stok Gudang</a>
                </div>
                @elseif($role=='Leader')
                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Dashboard</h6>
                    <a href="{{ route('leader.dashboard') }}" class="mt-2 flex items-center space-x-2 text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('leader.dashboard') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3h14v4H3V3zM3 9h14v8H3V9z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                </div>
                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Permintaan</h6>
                    <a href="{{ route('leader.permintaan.index') }}" class="mt-2 flex items-center space-x-2 text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('leader.permintaan.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Review Permintaan</span>
                    </a>
                </div>
                @elseif($role=='Teknisi')
                <div class="space-y-2">
                    <a href="{{ route('technician.dashboard') }}" class="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-100 {{ request()->routeIs('technician.dashboard') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3h14v4H3V3zM3 9h14v8H3V9z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="{{ route('technician.permintaan.create') }}" class="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-100 {{ request()->routeIs('technician.permintaan.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Buat Permintaan Barang</span>
                    </a>
                    <a href="{{ route('technician.tickets.index') }}" class="flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-100 {{ request()->routeIs('technician.tickets.*') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 01-2-2V3a1 1 0 00-1-1H4zm12 4a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
                        </svg>
                        <span>Ticket Pekerjaan</span>
                    </a>
                </div>
                @elseif($role=='Manager' || $role=='Owner')
                <div>
                    <h6 class="text-xs font-medium text-gray-500 uppercase">Dashboard</h6>
                    <a href="{{ route('manager.dashboard') }}" class="mt-2 flex items-center space-x-2 text-sm p-2 rounded hover:bg-gray-50 {{ request()->routeIs('manager.dashboard') ? 'bg-gray-100 font-medium' : 'text-gray-700' }}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3h14v4H3V3zM3 9h14v8H3V9z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                </div>
                @endif

            </nav>
        </aside>

        <div class="flex-1 min-h-screen flex flex-col">
            <!-- Topbar (compact mobile-first) -->
            <header class="bg-white border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
                    <div class="flex items-center space-x-3">
                        <button class="md:hidden p-2" onclick="document.querySelector('aside').classList.toggle('hidden')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <a href="{{ route($homeRoute) }}" class="text-lg font-semibold text-gray-800">{{ config('app.name','Warehouse ISP') }}</a>
                    </div>

                    <div class="flex items-center space-x-3 text-xs text-gray-600">
                        <span>Role: {{ $role ?? '' }}</span>
                        <span>Lokasi: {{ $active ?? '' }}</span>
                    </div>
                </div>
            </header>

            <main class="p-4 flex-1">
                @if(session('status'))
                <div class="mb-4 max-w-3xl mx-auto">
                    <div class="rounded-lg p-3 text-sm text-white bg-green-600">{{ session('status') }}</div>
                </div>
                @endif
                {{ $slot ?? '' }}
            </main>

            <!-- Bottom navigation (mobile) -->
            <nav class="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden">
                <div class="max-w-3xl mx-auto flex justify-between">
                    @if($role=='Teknisi')
                    <a href="{{ route('technician.dashboard') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="{{ route('technician.permintaan.create') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Permintaan</span>
                    </a>
                    <a href="{{ route('technician.tickets.index') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                        </svg>
                        <span>Tickets</span>
                    </a>
                    @elseif($role=='Leader')
                    <a href="{{ route('leader.dashboard') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="{{ route('leader.permintaan.index') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Permintaan</span>
                    </a>
                    @elseif($role=='Gudang')
                    <a href="{{ route('gudang.dashboard') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="{{ route('gudang.permintaan.index') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Permintaan</span>
                    </a>
                    <a href="{{ route('gudang.transfer.index') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        <span>Transfer</span>
                    </a>
                    @elseif($role=='Manager' || $role=='Owner')
                    <a href="{{ route('manager.dashboard') }}" class="flex flex-col items-center text-xs text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                    @endif
                </div>
            </nav>
        </div>
    </div>
</body>

</html>


