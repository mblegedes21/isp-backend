import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "border border-primary/90 bg-gradient-to-r from-primary to-sky-500 text-white shadow-sm shadow-primary/25 hover:from-blue-700 hover:to-sky-600",
  secondary: "border border-primary/20 bg-white/90 text-ink shadow-sm hover:border-primary/40 hover:bg-primary/5",
  danger: "border border-danger/80 bg-danger text-white shadow-sm shadow-red-200 hover:bg-red-800"
};

export function Button({ children, variant = "primary", full, className = "", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`tap-target rounded-xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
