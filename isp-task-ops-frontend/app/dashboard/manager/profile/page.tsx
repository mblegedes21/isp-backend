"use client";

import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/useAuthStore";

export default function ManagerProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700/70">Profil Manager</p>
        <h1 className="text-3xl font-bold text-slate-950">Informasi akun manager</h1>
      </div>

      <Card title="Identitas Akun">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">Nama</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{user?.name ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">Email</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{user?.email ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">Role</p>
            <p className="mt-2 text-lg font-semibold uppercase text-slate-950">{user?.role ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-500">Cabang</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{user?.branchName ?? "-"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
