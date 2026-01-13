import { Suspense } from "react";

import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas)] px-6 py-20 text-[var(--ink)]">
          <div className="mx-auto max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--ink-muted)]">
              Admin console
            </p>
            <h1 className="text-3xl font-semibold">Loading admin console...</h1>
          </div>
        </div>
      }
    >
      <AdminClient />
    </Suspense>
  );
}
