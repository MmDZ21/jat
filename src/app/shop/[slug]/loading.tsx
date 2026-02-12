import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      dir="rtl"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #EC4899 100%)",
            boxShadow: "0 0 30px var(--accent-glow)",
          }}
        >
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
}
