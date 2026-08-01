/**
 * CommandPalette — klavye SÖZLEŞMESİ. Story UI-ADR-159'da yazıldı.
 *
 * Paletin hiç hikâyesi yoktu ve bağımsız denetim beş kusur buldu; hepsi
 * yalnız KLAVYEYLE görülebilir türden:
 *
 *  1. `aria-modal="true"` diyordu ama ODAK TUZAĞI YOKTU — son sonuçtan
 *     sonra Tab, odağı perdenin arkasındaki uygulamaya kaçırıyordu.
 *     `aria-modal` bir BEYANDIR; davranışı kurmayan beyan, ekran
 *     okuyucuya yalan söyler.
 *  2. Escape yalnız `<input>`taydı — odak bir sonuca geçtiği an ölü tuş.
 *  3. `listRef` tanımlıydı ama HİÇ OKUNMUYORDU: imleç `max-h-96`
 *     penceresinden çıkıp görünmez oluyordu (30 komutta ölçülebilir).
 *  4. `<li>` içine sarılmış `<button role="option">` — option'lar
 *     listbox'ın doğrudan çocuğu değildi, ilişki kopuktu.
 *  5. `aria-activedescendant` yoktu — ekran okuyucu imlecin nerede
 *     olduğunu duyurmuyordu.
 */
import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { useUiStore } from "@/lib/store/ui";
import { CommandPalette } from "./command-palette";

const meta: Meta = {
  title: "Layout/CommandPalette",
  parameters: { nextjs: { appDirectory: true }, layout: "fullscreen" },
};
export default meta;

/** Palet store'dan açılır; story onu açık başlatır ve çıkışta kapatır. */
function Acik() {
  const setOpen = useUiStore((s) => s.setCommandPalette);
  useEffect(() => {
    setOpen(true);
    return () => setOpen(false);
  }, [setOpen]);
  return (
    <div className="bg-bg p-6">
      {/* Arkada odaklanabilir bir hedef: odak tuzağı kırılırsa Tab buraya
          kaçar ve test onu yakalar. */}
      <button type="button" data-testid="arkadaki">
        Arkadaki buton
      </button>
      <CommandPalette activeWorkspaceId="briefing" />
    </div>
  );
}

export const KlavyeSozlesmesi: StoryObj = {
  name: "Odak hapsolur · imleç duyurulur · Escape her yerde çalışır",
  render: () => <Acik />,
  play: async () => {
    /* Palet portal kullanmıyor ama diyalog gövdede aranır — tek kaynak. */
    const body = within(document.body);
    const kutu = await body.findByRole(
      "combobox",
      { name: "Komut ara" },
      { timeout: 10_000 }
    );

    /* 1. İMLEÇ DUYURULUR. `aria-activedescendant` yoktu; ekran okuyucu
          ok tuşuyla nereye gidildiğini söylemiyordu. */
    const ilk = kutu.getAttribute("aria-activedescendant");
    await expect(ilk).toBeTruthy();

    await userEvent.keyboard("{ArrowDown}");
    await expect(kutu.getAttribute("aria-activedescendant")).not.toBe(ilk);

    /* 2. Seçenekler listbox'ın DOĞRUDAN çocuğudur. */
    const liste = body.getByRole("listbox", { name: "Komutlar" });
    const secenekler = within(liste).getAllByRole("option");
    await expect(secenekler.length).toBeGreaterThan(1);
    await expect(secenekler[0].parentElement).toBe(liste);

    /* İşaret edilen öğe GERÇEKTEN var — kırık bir id, hiç id olmamasından
       kötüdür: ekran okuyucu boş bir seçim duyurur. */
    const aktif = kutu.getAttribute("aria-activedescendant")!;
    await expect(document.getElementById(aktif)).not.toBeNull();

    /* 3. ODAK HAPSOLUR — İDDİA PANELİN İÇİNDE OLMAK.
          ⚠️ İlk yazımda `expect(activeElement).not.toBe(arkadaki)` idi ve
          KORUMASIZDI: panelin tek odaklanabilir öğesi `<input>`; tuzak
          kaldırılsa odak `<body>`ye düşerdi ve "arkadaki değil" iddiası
          YİNE geçerdi. Regresyon denetimi yakaladı. Doğru iddia olumsuz
          değil OLUMLU: odak paletin İÇİNDE kalmalı. */
    const panel = body.getByRole("dialog", { name: "Komut paleti" });
    for (let i = 0; i < secenekler.length + 3; i++) await userEvent.tab();
    await expect(panel.contains(document.activeElement)).toBe(true);

    /* 4. ESCAPE HER ODAK DURUMUNDA ÇALIŞIR — yalnız kutuda değil. */
    await userEvent.keyboard("{Escape}");
    await expect(body.queryByRole("dialog", { name: "Komut paleti" })).toBeNull();
  },
};
