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

    /* KAYIT scroll OLAYINDA yapılır, cleanup'ta DEĞİL. Eski kod cleanup'ta
       `el.scrollTop` okuyordu; o an yeni içerik commit edilmiş ve tarayıcı
       scrollTop'u kısa içeriğe clamp'lemiş oluyordu — her geçiş 0 kaydediyordu.
       S1-S5 denetimi bunu yakaladı (1500 → 0); yazılmıştı ama çalışmıyordu. */
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        useNavigationStore.getState().rememberScroll(workspaceKey, el.scrollTop)
      );
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    /* GERİ YÜKLEME: hedef konuma, içerik o yüksekliğe ulaşınca oturt.
       Mock veri ilk istemci tick'inde gelir; skeleton anında içerik kısadır
       ve tek seferlik atama clamp'lenir. Birkaç frame denenir, sonra bırakılır
       — sonsuz gözlemci kurmaya değmez (ponytail: 10 frame ~ 160 ms tavan). */
    const target = useNavigationStore.getState().memory[workspaceKey]?.scrollTop ?? 0;
    let tries = 10;
    const restore = () => {
      el.scrollTop = target;
      if (el.scrollTop < target && --tries > 0) raf = requestAnimationFrame(restore);
    };
    if (target > 0) restore();

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
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
