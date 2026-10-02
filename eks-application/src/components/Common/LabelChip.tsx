"use client";
import React from "react";

type LabelChipProps = {
  text: string;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md";
};

export default function LabelChip({
  text,
  className = "",
  variant = "primary",
  size = "md",
}: LabelChipProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-full shadow-lg ring-1 ring-white/20";
  const sizing =
    size === "sm" ? "px-3 py-1 text-xs font-semibold" : "px-4 py-2 text-sm font-semibold";
  const gradient =
    variant === "primary"
      ? "bg-gradient-to-r from-primary to-secondary"
      : variant === "secondary"
      ? "bg-gradient-to-r from-secondary to-accent"
      : "bg-gradient-to-r from-accent to-primary";

  return (
    <span className={`${base} ${sizing} ${gradient} text-[var(--color-on-primary)] ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-y-0 left-0 w-1/2 bg-white/10 rotate-12 animate-gloss-move" />
      </span>
    </span>
  );
}
