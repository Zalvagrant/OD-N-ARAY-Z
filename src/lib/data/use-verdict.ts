"use client";

/**
 * Sahip kararının ODIN'e YAZILMASI — ER-0025 · ODIN ADR-0142.
 *
 * Bu kanca, denetimin B1 blocker'ını kapatır: `onVerdict` yalnızca yerel
 * `useState`e yazıyordu, yani Onayla/Reddet/Ertele sekme kapanınca yok
 * oluyordu. ODIN'in **ADR-0086 Human Sign-off Gate**'i kararın kalıcı ve
 * denetlenebilir olmasını şart koşar.
 *
 * ⚠️ SÖZLEŞME ODIN'İNDİR. `python -m odin ceo verdict` imzası
 * (`odin/__main__.py:98`):
 *
 *     ceo verdict <rec_id> <approved|rejected|deferred> [neden] [--revisit <tarih>]
 *
 * Gerekçe ve tarih kuralını **ODIN uygular** (ADR-0131), arayüz DEĞİL.
 * `verdict-form.tsx` aynı kuralı gönderimden önce de uyguluyor ama bu bir
 * kolaylıktır, kapı değil: kapı sunucudadır ve reddi kelimesi kelimesine
 * geri gönderir.
 */

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { VerdictInput } from "@/components/executive/verdict-form";
import { runCommand, type CommandOutcome } from "./command";
import { OdinError } from "./errors";

export interface VerdictSubmission {
  /** ODIN `rec_id` — `Decision.id` bu değeri taşır. */
  decisionId: string;
  input: VerdictInput;
}

/**
 * `VerdictInput` → `argv`.
 *
 * ⚠️ `--revisit` ATLANAMAZ: `lifecycle.verdict` ADR-0131 gereği tarihsiz
 * bir ertelemeyi REDDEDER (backend testi tam olarak bunu sabitliyor).
 * Formu doldurup tarih gönderilmezse her erteleme sunucuda reddedilirdi.
 *
 * ⚠️ Gerekçe BOŞSA hiç eklenmez, boş string olarak DEĞİL: `args[0] if args
 * else None` boş stringi "verilmiş gerekçe" sayar ve A sınıfı olmayan bir
 * öneride ODIN'in gerekçe kapısı sessizce atlanmış olurdu.
 */
export function verdictArgv({ decisionId, input }: VerdictSubmission): string[] {
  const argv = ["ceo", "verdict", decisionId, input.verdict];
  const reason = input.reason?.trim();
  if (reason) argv.push(reason);
  if (input.verdict === "deferred" && input.revisitAt) {
    argv.push("--revisit", input.revisitAt);
  }
  return argv;
}

/**
 * Karar gönderimi.
 *
 * ⚠️ `retry: false` — BİLEREK. Okuma yolundaki `retryable` politikası
 * burada GEÇERLİ DEĞİL: bu bir yazma ve `ceo verdict` idempotent olduğunu
 * BEYAN ETMİYOR. Ağ hatasında istek sunucuya ulaşmış ve kayıt yazılmış
 * olabilir; sessizce tekrar denemek aynı kararı iki kez kaydedebilir.
 * Karar kaydı silinmeyen bir defterdir (ODIN ADR-0005 "no delete") —
 * ikinci kayıt geri alınamaz. Tekrar denemeyi İNSAN seçer.
 *
 * ⚠️ OPTIMISTIC UPDATE YOK — bu bir tercih değil, kural gereği.
 * İyimser güncelleme "kaydedildi" der ve sonra geri alır; burada geri
 * alınacak şey sahibin KARARIDIR. ODIN reddedebilir (tarihsiz erteleme,
 * eksik gerekçe) ve o red bir hata değil, geçerli bir cevaptır. Ekranda
 * bir an "onaylandı" görünüp sonra kaybolması, reponun 2 numaralı
 * kuralının (sahte gösterge) tam ihlalidir. Karar ancak ODIN yazdığını
 * söyledikten SONRA verilmiş görünür.
 */
export function useVerdictMutation() {
  const qc = useQueryClient();

  /**
   * İPTAL — YALNIZ unmount'ta, kullanıcıya "İptal" düğmesi SUNULMAZ.
   *
   * Ayrım kasıtlı ve zaman aşımıyla aynı mantıkta: istemcinin isteği
   * iptal etmesi, sunucunun kaydı YAZMASINI geri almaz. Bir "İptal"
   * düğmesi, basıldığında kararın kaydedilmediğini VAAT EDER ve bu vaadi
   * tutamaz — sahte gösterge (repo kuralı 2). Kullanıcı iptal ettiğini
   * sanıp yeniden gönderirse, silinmeyen deftere (ODIN ADR-0005) iki
   * kayıt düşer.
   *
   * Unmount'ta iptal ise farklı: kullanıcı ekranı terk etti, sonucu
   * gösterecek bir yüzey kalmadı. `httpLoad`taki UI-ADR-121 kuralının
   * aynısı — terk edilmiş bir isteğin hata kutusu açılmaz. Sunucudaki
   * kayıt yine de yazılabilir ve bu doğru: sahip komutu vermişti.
   */
  const iptal = useRef<AbortController | null>(null);
  useEffect(() => () => iptal.current?.abort(), []);

  return useMutation<CommandOutcome, OdinError, VerdictSubmission>({
    mutationKey: ["odin", "ceo", "verdict"],
    retry: false,
    mutationFn: (submission) => {
      /* Her gönderim kendi denetleyicisini alır: bir öncekinin iptali
         yenisini öldürmemeli. */
      iptal.current = new AbortController();
      return runCommand(verdictArgv(submission), { signal: iptal.current.signal });
    },
    onSuccess: (outcome) => {
      /* YALNIZ gerçekten kaydedildiyse tazele. Reddedilmiş bir verdict
         hiçbir şeyi değiştirmedi; tazelemek sunucuya boş yük bindirir ve
         ekranı "bir şey oldu" diye titretir.

         Zaman aşımında da tazelenir: kaydedilip kaydedilmediği BELİRSİZ
         olduğu için tek dürüst hamle sunucuya sormaktır. */
      if (outcome.kind === "success" || outcome.kind === "timeout") {
        /* ⚠️ ANAHTARSIZ — BİLEREK. İlk yazışımda
           `invalidateQueries({ queryKey: ["odin"] })` yazmıştım ve bu
           HİÇBİR ŞEYLE EŞLEŞMEZDİ: gerçek anahtar
           `[DATA_MODE, universeId, "odin", …]` (use-odin-query.ts:72),
           yani `"odin"` bir ÖNEK değil ÜÇÜNCÜ parça. Sessizce hiçbir şey
           tazelenmez, ekran bayat kalır ve hata görünmez.

           Bu, mimari denetimin (UI-ADR-190) "en çok uyardığı kusur" diye
           işaretlediği sınıfın ta kendisi — ve repodaki İLK elle cache
           işlemini eklerken neredeyse ben işliyordum. Anahtar vermemek
           tüm sorguları geçersiz kılar: aktif olanlar yeniden çekilir,
           pasifler bayat işaretlenir. Kapsam biraz geniş ama YANLIŞ
           OLAMAZ; bir karar zaten ekranın çoğunu etkiler. */
        void qc.invalidateQueries();
      }
    },
  });
}
