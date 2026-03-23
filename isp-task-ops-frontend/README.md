# ISP Task & Operations Management System (Frontend)

Production-oriented frontend scaffold for internal ISP operational control panel.

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Zustand
- Axios
- React Hook Form + Zod

## Run
1. `cd isp-task-ops-frontend`
2. `npm install`
3. `npm run dev`

## Key Routes
- `/auth/login`
- `/dashboard/noc`
- `/dashboard/technician`
- `/dashboard/leader`
- `/dashboard/warehouse`
- `/dashboard/manager`

## Auth
- Frontend login/register terhubung ke Laravel API.
- Set `NEXT_PUBLIC_API_BASE_URL` agar mengarah ke backend Laravel, contoh `http://127.0.0.1:8000/api`.
- Login memakai `email` + `password`, tanpa pemilihan role manual.

## Debug Checklist
- Pastikan `composer install` sudah dijalankan sehingga Sanctum tersedia.
- Pastikan `php artisan migrate` sudah dijalankan.
- Pastikan `php artisan db:seed --class=UserSeeder` sudah dijalankan.
- Pastikan backend Laravel aktif di URL yang sama dengan `NEXT_PUBLIC_API_BASE_URL`.
- Cek user seed dan password hash dengan `php artisan auth:debug-users manager@isp.local`.
- Jika login gagal, cek endpoint `POST /api/auth/login` dan `GET /api/auth/me`.
