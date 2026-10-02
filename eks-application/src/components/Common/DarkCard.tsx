"use client";
import React from "react";

type DarkCardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  darkness?: number; // 0.15–0.20 recommended
  strategy?: "overlay" | "brightness";
};

export default function DarkCard({
  children,
  className = "",
  title,
  description,
  darkness = 0.18,
  strategy = "overlay",
}: DarkCardProps) {
  const overlayStyle = undefined;

  return (
    <section
      className={`relative w-full rounded-3xl shadow-2xl border border-primary/20 dark:border-primary/30 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/40 ${className}`}
      aria-label={title || "Card"}
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "#0A688C" }} />
      </div>

      <div className="relative z-10 p-6 sm:p-8 md:p-10 text-[var(--color-on-primary)]">
        {title ? (
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            {title}
          </h3>
        ) : null}
        {description ? (
          <p className="text-base md:text-lg opacity-90 mb-6">{description}</p>
        ) : null}
        <div>{children}</div>

        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/5 rounded-3xl" />
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </section>
  );
}
