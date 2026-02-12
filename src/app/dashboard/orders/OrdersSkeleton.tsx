import { iranYekan } from "@/app/fonts";

export function OrdersSkeleton() {
  return (
    <div
      dir="rtl"
      className={`min-h-screen py-8 px-4 ${iranYekan.variable}`}
      style={{ background: "var(--bg-base)", fontFamily: "var(--font-iran-yekan)" }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-4 w-32 rounded shimmer mb-2" />
        <div className="h-8 w-48 rounded shimmer mb-8" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-44 rounded shimmer" />
                <div className="h-3 w-28 rounded shimmer" />
              </div>
              <div className="h-7 w-24 rounded-full shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
