"use client";

import { Search } from "lucide-react";

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SmartSearch({ value, onChange, placeholder = "Cari data...", className = "" }: SmartSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary/55" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="tap-target w-full rounded-xl border border-app-border bg-white/90 pl-9 pr-3 text-sm text-app-text outline-none shadow-sm transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}
