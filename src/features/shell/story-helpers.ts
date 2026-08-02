/**
 * Story yardımcıları — UI-ADR-207.
 *
 * NEDEN VAR: "Yenile" düğmesi sekiz ekrana eklendi ve HİÇBİR yerde
 * tıklanmıyordu — bu repoda daha önce de öyleydi, briefing'in düğmesi
 * bugüne kadar hiç test edilmedi. Bir düğmenin VARLIĞI çalıştığını
 * kanıtlamaz; sahibin emrindeki "çalışmayan buton bırakma" maddesinin
 * test tarafındaki karşılığı budur.
 *
 * Bu dosya bir story dosyası DEĞİLDİR (Storybook yalnız `*.stories.tsx`
 * toplar); story'lerin paylaştığı iddia gövdesidir.
 */

import { expect, userEvent, waitFor, within } from "storybook/test";

type Canvas = ReturnType<typeof within>;

/**
 * Yenile düğmesi GERÇEKTEN tıklanır ve ekran veri durumunda kalır.
 *
 * Tıklamadan sonra beklenen şey "hiçbir şey olmaması" değil: yeniden
 * getirme sırasında iskelet çıkabilir, sonra veri geri gelmelidir. Kapı
 * bu yüzden son durumu bekler — hata durumuna DÜŞMEMELİ ve başlık
 * yerinde kalmalı.
 */
export async function expectRefreshWorks(
  canvas: Canvas,
  baslik: string
): Promise<void> {
  const yenile = canvas.getByRole("button", { name: "Yenile" });
  await expect(yenile).toBeEnabled();

  await userEvent.click(yenile);

  await waitFor(
    () => expect(canvas.queryAllByRole("status")).toHaveLength(0),
    { timeout: 15_000 }
  );
  await expect(
    canvas.getByRole("heading", { name: baslik })
  ).toBeInTheDocument();
  /* Yenileme bir HATA üretmiş olamaz: ekranda hata durumu kalmamalı. */
  await expect(canvas.queryByRole("alert")).toBeNull();
}
