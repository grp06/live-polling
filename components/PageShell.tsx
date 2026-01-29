import type { ReactNode } from "react";

type PageShellVariant = "default" | "admin" | "adminLite";

type PageShellProps = {
  variant?: PageShellVariant;
  children: ReactNode;
};

const backdrops: Record<PageShellVariant, string[]> = {
  default: [
    "pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rotate-6 rounded-[52px] bg-[var(--surface-strong)] opacity-70 animate-drift",
    "pointer-events-none absolute -top-10 left-12 h-44 w-44 -rotate-6 rounded-[44px] bg-[var(--mist)] opacity-60 animate-drift",
    "pointer-events-none absolute top-24 left-[-3rem] h-40 w-40 rotate-12 rounded-[40px] bg-[var(--surface-muted)] opacity-65 animate-drift",
    "pointer-events-none absolute top-40 right-24 h-28 w-28 rotate-12 rounded-[32px] bg-[var(--sun)] opacity-55 animate-drift",
    "pointer-events-none absolute bottom-20 right-[-2rem] h-36 w-36 -rotate-8 rounded-[36px] bg-[var(--surface-strong)] opacity-55 animate-drift",
    "pointer-events-none absolute bottom-24 right-24 h-32 w-32 rotate-6 rounded-[32px] bg-[var(--sage)] opacity-50 animate-drift",
    "pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 -rotate-3 rounded-[52px] bg-[var(--accent-soft)] opacity-60 animate-drift",
    "pointer-events-none absolute bottom-12 left-24 h-36 w-36 -rotate-12 rounded-[36px] bg-[var(--blush)] opacity-55 animate-drift",
  ],
  admin: [
    "pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rotate-6 rounded-[52px] bg-[var(--surface-strong)] opacity-70 animate-drift",
    "pointer-events-none absolute -top-12 left-10 h-44 w-44 -rotate-6 rounded-[44px] bg-[var(--mist)] opacity-60 animate-drift",
    "pointer-events-none absolute top-28 left-[-2rem] h-40 w-40 rotate-8 rounded-[40px] bg-[var(--surface-muted)] opacity-65 animate-drift",
    "pointer-events-none absolute top-36 right-24 h-28 w-28 rotate-12 rounded-[32px] bg-[var(--sun)] opacity-55 animate-drift",
    "pointer-events-none absolute bottom-20 right-12 h-36 w-36 -rotate-6 rounded-[36px] bg-[var(--surface-strong)] opacity-55 animate-drift",
    "pointer-events-none absolute bottom-24 right-28 h-32 w-32 rotate-6 rounded-[32px] bg-[var(--sage)] opacity-50 animate-drift",
    "pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 -rotate-3 rounded-[52px] bg-[var(--accent-soft)] opacity-60 animate-drift",
    "pointer-events-none absolute bottom-14 left-24 h-36 w-36 -rotate-12 rounded-[36px] bg-[var(--blush)] opacity-55 animate-drift",
  ],
  adminLite: [
    "pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rotate-6 rounded-[52px] bg-[var(--surface-strong)] opacity-70 animate-drift",
    "pointer-events-none absolute top-20 left-[-2rem] h-40 w-40 -rotate-8 rounded-[40px] bg-[var(--mist)] opacity-60 animate-drift",
    "pointer-events-none absolute bottom-16 left-8 h-36 w-36 -rotate-3 rounded-[36px] bg-[var(--surface-muted)] opacity-60 animate-drift",
    "pointer-events-none absolute bottom-10 right-10 h-32 w-32 rotate-6 rounded-[32px] bg-[var(--sun)] opacity-50 animate-drift",
  ],
};

export function PageShell({ variant = "default", children }: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      {backdrops[variant].map((className, index) => (
        <div key={`${variant}-${index}`} className={className} />
      ))}
      {children}
    </div>
  );
}
