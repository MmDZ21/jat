import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir="rtl"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="text-center">
        <div className="mb-6">
          <div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <Search className="w-12 h-12" style={{ color: "var(--text-tertiary)" }} />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            ۴۰۴
          </h1>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            فروشگاه یافت نشد
          </h2>
          <p className="max-w-md mx-auto" style={{ color: "var(--text-tertiary)" }}>
            متاسفانه فروشگاهی که به دنبال آن هستید وجود ندارد، حذف شده است، یا هنوز منتشر نشده است.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)",
            boxShadow: "0 0 20px var(--accent-glow)",
          }}
        >
          <Home className="w-5 h-5" />
          <span>بازگشت به صفحه اصلی</span>
        </Link>
      </div>
    </div>
  );
}
