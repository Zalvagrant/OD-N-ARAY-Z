/**
 * Bilinmeyen rota — UI-ADR-133.
 *
 * `[[...slug]]/page.tsx` kayıt defterinde bulunmayan bir yol için
 * `notFound()` çağırıyordu ama karşılığında HİÇBİR `not-found.tsx`
 * yoktu: Next'in biçimlendirilmemiş dahili 404'ü basılıyordu.
 *
 * ⚠️ NEDEN KÖKTE, `(shell)` İÇİNDE DEĞİL — ölçüldü, tahmin değil.
 *
 * Dosya önce `app/(shell)/not-found.tsx`e, sonra doğrudan
 * `app/(shell)/[[...slug]]/not-found.tsx`e kondu. İKİSİ DE ÇALIŞMADI;
 * her ikisinde de Next kendi dahili sayfasını (`id="__next_error__"`)
 * basmaya devam etti. Dev sunucusu temiz önbellekle yeniden başlatılarak
 * doğrulandı. Yalnız `app/not-found.tsx` devreye giriyor.
 *
 * BEDELİ: kök layout'un altında olduğu için `(shell)/layout.tsx`
 * uygulanmaz — bu sayfada sidebar ve komut paleti YOKTUR. Kabuğu burada
 * elle kurmak, kompozisyonu ikinci bir yerde tekrarlamak olurdu; 404
 * için bu takas kabul edildi. Dönüş yolu açık bir bağlantıyla verilir.
 *
 * Bir sonraki oturuma not: route-group içine `not-found.tsx` koymayı
 * TEKRAR DENEME. Denendi, ölçüldü, çalışmıyor.
 */

import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
      <p className="text-xs uppercase tracking-wide text-content-tertiary">ODIN</p>

      <h1 className="text-2xl font-semibold text-content">Böyle bir ekran yok</h1>

      <p className="text-base text-content-secondary">
        Girilen adres hiçbir workspace&apos;e karşılık gelmiyor. Yanlış yazılmış
        olabilir ya da bu ekran kaldırılmış olabilir.
      </p>

      <Link href="/briefing" className="text-ai-text underline">
        Executive Briefing&apos;e dön
      </Link>
    </main>
  );
}
