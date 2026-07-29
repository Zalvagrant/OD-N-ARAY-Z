"use client";

/**
 * SystemReadiness — açılışın ilk 0–3 saniyesi (05-dashboard.md §2).
 * Karar: UI-ADR-095.
 *
 * Doküman altı durumun "sırayla canlanmasını" istiyor: AI Core aktif,
 * Voice Core Online, Knowledge Connected, Memory Synced, Background Jobs
 * Running, Data Sources Connected.
 *
 * BUNLAR UYDURULMAZ. Her satır telemetry registry'ye bağlıdır; registry
 * hangi altsistemin GERÇEKTEN var olduğunun tek kaynağıdır (UI-ADR-083).
 * Kapalı kanal "Online" yazmaz — "bağlı değil" yazar. Bir açılış ekranının
 * altı yeşil tik göstermesi kolaydır; ODIN'de o tikler ölçüme dayanır.
 *
 * Popup yok, ses yok: satırlar sessizce, sırayla belirir (§2 kuralı).
 * Toplam gecikme 6 × 0,12 sn = 0,72 sn — 3 saniyelik bütçenin içinde.
 */

import { motion, useReducedMotion } from "framer-motion";
import { duration, motion as motionPreset } from "@/animations/motion";
import { isChannelAvailable } from "@/lib/telemetry/registry";

interface ReadinessRow {
  id: string;
  label: string;
  /** Bu satırın dayandığı registry kanalı — yoksa satır "bağlı değil"dir. */
  channel: string;
}

/** 05-...md §2'deki altı durum, doküman sırasıyla. */
const ROWS: ReadinessRow[] = [
  { id: "ai-core", label: "AI Core", channel: "processing" },
  { id: "voice", label: "Voice Core", channel: "voice_queue" },
  { id: "knowledge", label: "Knowledge", channel: "knowledge_sync" },
  { id: "memory", label: "Memory", channel: "memory_indexing" },
  { id: "jobs", label: "Background Jobs", channel: "background_jobs" },
  { id: "sources", label: "Data Sources", channel: "last_sync" },
];

export function SystemReadiness() {
  const reduced = useReducedMotion();

  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
      aria-label="Sistem hazırlık durumu"
    >
      {ROWS.map((row, i) => {
        const ready = isChannelAvailable(row.channel);
        return (
          <motion.li
            key={row.id}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...motionPreset.fast, delay: reduced ? 0 : i * duration.fast }}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className={ready ? "text-success" : "text-content-tertiary"}
            >
              {ready ? "●" : "○"}
            </span>
            <span className="text-content-secondary">{row.label}</span>
            <span className={ready ? "text-success" : "text-content-tertiary"}>
              {ready ? "hazır" : "bağlı değil"}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
