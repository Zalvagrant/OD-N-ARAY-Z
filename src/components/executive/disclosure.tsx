"use client";

/**
 * Disclosure — katmanlı kartların açılan bölümü (progressive disclosure).
 *
 * Executive katmanının iç yardımcısıdır. ExecutiveKPICard, DecisionCard ve
 * AIRecommendationCard aynı açılma davranışını paylaşır; üç yere kopyalanmaz.
 *
 * Motion: açılma bir **Context Change**'tir → `motion.normal` (12-...md §1).
 * `prefers-reduced-motion` altında hareket kalkar, BİLGİ KALMAZ değil —
 * içerik anında görünür.
 */

import type { ReactNode } from "react";
import { AnimatePresence, motion as fm, useReducedMotion } from "framer-motion";
import { motion as preset } from "@/animations/motion";

export function Disclosure({
  open,
  id,
  children,
}: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return open ? (
      <div id={id} className="overflow-hidden">
        {children}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <fm.div
          id={id}
          className="overflow-hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={preset.normal}
        >
          {children}
        </fm.div>
      )}
    </AnimatePresence>
  );
}
