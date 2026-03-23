import type { PropsWithChildren } from "react";

interface CardProps {
  title?: string;
  className?: string;
}

export function Card({ title, className = "", children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-2xl border border-app-border/80 bg-white/88 p-4 shadow-[0_14px_34px_-24px_rgba(29,78,216,0.35)] backdrop-blur-sm ${className}`}>
      {title ? <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-sky-900/70">{title}</h2> : null}
      {children}
    </section>
  );
}
