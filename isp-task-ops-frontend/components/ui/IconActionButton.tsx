"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  tone?: "default" | "danger";
}

export function IconActionButton({ icon, label, tone = "default", className = "", ...props }: IconActionButtonProps) {
  const toneClass = tone === "danger"
    ? "border-red-200 text-red-700 hover:bg-red-50"
    : "border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-700";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition ${toneClass} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
