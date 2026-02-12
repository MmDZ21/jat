"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface SuccessBannerProps {
  count: number;
}

export default function SuccessBanner({ count }: SuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <div
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
              boxShadow: "0 0 20px rgba(52, 211, 153, 0.2)",
              color: "#ffffff",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-lg">
                    ایمپورت با موفقیت انجام شد!
                  </p>
                  <p className="text-sm opacity-90">
                    {count} محصول از اینستاگرام به فروشگاه شما اضافه شد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
