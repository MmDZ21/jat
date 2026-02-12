import { iranYekan } from "@/app/fonts";

export function DashboardSkeleton() {
  return (
    <div
      dir="rtl"
      className={`min-h-screen py-8 ${iranYekan.variable}`}
      style={{ background: "var(--bg-base)", fontFamily: "var(--font-iran-yekan)" }}
    >
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header skeleton */}
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <div className="h-7 w-48 rounded-lg shimmer mb-3" />
          <div className="h-4 w-64 rounded-lg shimmer" />
        </div>
        {/* Nav skeleton */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 w-32 rounded-xl shimmer" />
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="h-44 shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded shimmer" />
                <div className="h-4 w-1/2 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
