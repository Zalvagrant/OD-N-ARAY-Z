"use client";

/**
 * Decision Center'a geçiş — UI-ADR-185.
 *
 * NEDEN AYRI BİLEŞEN: aşağıdaki blok İKİ ekranda kelimesi kelimesine
 * yazılıydı (`amazon/director/screen.tsx` · `mission-control/screen.tsx`)
 * ve tek farkları öndeki cümleydi. Tekrarın asıl bedeli sekiz satır değil:
 * her iki ekran `useRouter`'ı YALNIZCA bu tek satır için import ediyordu.
 * Ekranların yönlendirmeyi bilmesi gerekmiyor; nereye gidileceği bu
 * bileşenin bilgisi.
 *
 * ⚠️ SEMANTİK KUSUR BİLEREK KORUNDU — bu bir gezinme ve `<button>` ile
 * yapılıyor. Doğrusu `<Link href>`tir; aynı repoda `app/not-found.tsx:39`
 * tam olarak öyle yazılmış, yani doğru desen ZATEN VAR ve bu iki ekran
 * ondan sapmış. `<Link>`e çevirmek gözlenebilir davranışı değiştirirdi —
 * ctrl+tıkla yeni sekme açılır, hedef durum çubuğunda görünür, ekran
 * okuyucu "buton" yerine "bağlantı" der — ve bu görevin yasağı açık:
 * "hiçbir ekranın davranışını değiştirme". Meclis 2/2 aynı yerde: önce
 * tekrarı kaldır, semantiği AYNEN koru. Dönüşüm ayrı bir karardır ve
 * ayrıca alınmalıdır.
 */

import { useRouter } from "next/navigation";

import { Text } from "@/components/ui/typography";

export function DecisionCenterLink({ prefix }: { prefix: string }) {
  const router = useRouter();
  return (
    <Text size="sm" tone="tertiary">
      {prefix}{" "}
      <button
        type="button"
        className="text-ai-text underline"
        onClick={() => router.push("/decisions")}
      >
        Decision Center
      </button>
      .
    </Text>
  );
}
