"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { roleDashboardPath } from "@/lib/navigation";
import { getBranches } from "@/lib/branches";
import { useAuthStore } from "@/store/useAuthStore";

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  passwordConfirmation: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  role: z.enum(["NOC", "TEKNISI", "LEADER", "MANAGER", "ADMIN_GUDANG", "MITRA"]),
  branchId: z.string().min(1, "Cabang wajib dipilih")
}).refine((value) => value.password === value.passwordConfirmation, {
  message: "Konfirmasi password harus sama",
  path: ["passwordConfirmation"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface BranchOption {
  id: string;
  name: string;
  code?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const registerAccount = useAuthStore((state) => state.register);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "NOC",
      branchId: ""
    }
  });

  useEffect(() => {
    let mounted = true;

    const loadBranches = async () => {
      try {
        const rows = await getBranches();
        if (!mounted) {
          return;
        }

        setBranches(rows);
        setError("");
      } catch {
        if (!mounted) {
          return;
        }

        setBranches([]);
        setError("");
      } finally {
        if (mounted) {
          setLoadingBranches(false);
        }
      }
    };

    void loadBranches();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (values: RegisterFormData) => {
    try {
      setError("");
      const user = await registerAccount(values);
      if (!user?.role || !roleDashboardPath[user.role]) {
        throw new Error("Register response invalid");
      }

      router.push(roleDashboardPath[user.role]);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Registrasi gagal.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#eff6ff_0%,_#dbeafe_42%,_#f8fbff_100%)] px-4 py-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72)_0%,transparent_58%)]" />
      <Card className="relative z-10 w-full max-w-lg border-white/80 bg-white/92 p-6 shadow-[0_28px_80px_-28px_rgba(30,64,175,0.42)]">
        <div className="mb-6 text-center">
          <a href="https://share.google/MIBXy8otukQk67VeP" target="_blank" rel="noreferrer" className="mx-auto flex w-fit items-center justify-center">
            {logoAvailable ? (
              <img
                src="https://share.google/MIBXy8otukQk67VeP"
                alt="Logo ISP"
                className="h-16 w-16 rounded-2xl border border-sky-100 bg-white object-contain p-2 shadow-sm"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 text-lg font-black text-white shadow-sm">
                ISP
              </div>
            )}
          </a>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-sky-700/70">Create Account</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Registrasi Akun Operasional</h1>
          <p className="mt-2 text-sm text-slate-600">Buat akun baru dan sistem akan langsung mengarahkan Anda ke dashboard sesuai role.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Nama</label>
            <input type="text" {...register("name")} className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
            <input type="email" {...register("email")} className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
            <input type="password" {...register("password")} className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Konfirmasi Password</label>
            <input type="password" {...register("passwordConfirmation")} className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            {errors.passwordConfirmation ? <p className="mt-1 text-xs text-danger">{errors.passwordConfirmation.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Role</label>
            <select {...register("role")} className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
              <option value="NOC">NOC</option>
              <option value="TEKNISI">TEKNISI</option>
              <option value="LEADER">LEADER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN_GUDANG">ADMIN_GUDANG</option>
              <option value="MITRA">MITRA</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-800">Cabang</label>
            <select
              {...register("branchId")}
              disabled={loadingBranches}
              className="tap-target w-full rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">{loadingBranches ? "Memuat cabang..." : branches.length === 0 ? "Tidak ada cabang" : "Pilih cabang"}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {errors.branchId ? <p className="mt-1 text-xs text-danger">{errors.branchId.message}</p> : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <Button full type="submit" disabled={isSubmitting} className="rounded-xl py-3">
            {isSubmitting ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="font-semibold text-primary underline">
            Kembali ke login
          </Link>
        </p>
      </Card>
    </div>
  );
}
