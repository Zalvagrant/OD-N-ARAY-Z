"use client";

/**
 * Workspace — uygulamadaki TEK scroll bölgesi.
 * Kaynak: 03-information-architecture.md §1, 12-motion-system.md §6
 *
 * App Shell (header/sidebar/status bar) geçişte animasyon ALMAZ. Yalnızca
 * bu bölge geçiş yapar: "sayfa değişimi" değil, "bağlam değişimi" hissi.
 *
 * Scroll hafızası: geri dönüşte önceki bağlam aynı scroll konumunda açılır
 * (04-navigation-system.md §5).
 */

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { workspaceTransition } from "@/animations/motion";
import { useNavigationStore } from "@/lib/store/navigation";

export function Workspace({
  workspaceKey,
  children,
}: {
  /** Scroll hafızasının anahtarı — bağlam başına bir kayıt */
  workspaceKey: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { memory, rememberScroll } = useNavigationStore.getState();
    el.scrollTop = memory[workspaceKey]?.scrollTop ?? 0;

    return () => rememberScroll(workspaceKey, el.scrollTop);
  }, [workspaceKey]);

  return (
    <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto">
      <motion.div
        key={workspaceKey}
        initial={workspaceTransition.initial}
        animate={workspaceTransition.animate}
        transition={workspaceTransition.transition}
        className="p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}
