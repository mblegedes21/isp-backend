import type { PropsWithChildren } from "react";

interface BadgeProps {
  tone?: "neutral" | "warning" | "danger" | "success";
}

const tones = {
  neutral: "border border-sky-200 bg-sky-50 text-sky-800",
  warning: "border border-amber-200 bg-amber-50 text-amber-800",
  danger: "border border-red-200 bg-red-50 text-red-800",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-800"
};

export function Badge({ tone = "neutral", children }: PropsWithChildren<BadgeProps>) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
