"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { roleDashboardPath } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter")
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>("");
  const [logoAvailable, setLogoAvailable] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values: FormData) => {
    try {
      setError("");
      const user = await login(values.email, values.password);
      if (!user?.role || !roleDashboardPath[user.role]) {
        throw new Error("Login response invalid");
      }

      router.push(roleDashboardPath[user.role]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_38%),linear-gradient(180deg,_#eff6ff_0%,_#dbeafe_48%,_#f8fbff_100%)] px-4 py-8">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.7)_48%,transparent_100%)] opacity-70" />
      <Card className="relative z-10 w-full max-w-md border-white/80 bg-white/92 p-6 shadow-[0_28px_80px_-28px_rgba(30,64,175,0.45)]">
        <div className="mb-6 text-center">
          <a href="https://share.google/MIBXy8otukQk67VeP" target="_blank" rel="noreferrer" className="mx-auto flex w-fit items-center justify-center">
            {logoAvailable ? (
              <img
                src="https://share.google/MIBXy8otukQk67VeP"
                alt="Logo ISP"
                className="h-20 w-20 rounded-2xl border border-sky-100 bg-white object-contain p-2 shadow-sm"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 text-xl font-black text-white shadow-sm">
                ISP
              </div>
            )}
          </a>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-sky-700/70">Operational Access</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Masuk Sistem Operasional ISP</h1>
          <p className="mt-2 text-sm text-slate-600">Gunakan akun operasional Anda untuk mengakses dashboard sesuai peran.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
            <input
              type="email"
              {...register("email")}
              className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="user@isp.local"
            />
            {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
            <input
              type="password"
              {...register("password")}
              className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="Masukkan password"
            />
            {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <Button full type="submit" disabled={isSubmitting} className="rounded-xl py-3">
            {isSubmitting ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="font-semibold text-primary underline">
            Daftar Sekarang
          </Link>
        </p>
      </Card>
    </div>
  );
}
