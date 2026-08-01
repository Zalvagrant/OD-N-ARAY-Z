/** S3 · 16 — Tabs (workspace header sekmeleri, UI-ADR-072) */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TabPanel, Tabs } from "./tabs";
import { Text } from "./typography";

type Tab = "health" | "performance" | "security" | "ai";

const meta: Meta = {
  title: "Core/16 · Tabs",
  parameters: { layout: "padded" },
};
export default meta;

export const Default: StoryObj = {
  render: function Render() {
    const [tab, setTab] = useState<Tab>("health");
    return (
      <div className="max-w-2xl">
        <Tabs
          label="System Director sekmeleri"
          value={tab}
          onChange={setTab}
          items={[
            { id: "health", label: "Health" },
            { id: "performance", label: "Performance", count: 3 },
            { id: "security", label: "Security" },
            { id: "ai", label: "AI Runtime", disabled: true },
          ]}
        />
        <div className="pt-4">
          <TabPanel id="health" active={tab === "health"}>
            <Text tone="secondary">Sistem sağlığı — ← → ile sekme değiştir.</Text>
          </TabPanel>
          <TabPanel id="performance" active={tab === "performance"}>
            <Text tone="secondary">Performans metrikleri.</Text>
          </TabPanel>
          <TabPanel id="security" active={tab === "security"}>
            <Text tone="secondary">Güvenlik.</Text>
          </TabPanel>
        </div>
        <Text size="sm" tone="tertiary" className="pt-4">
          &quot;AI Runtime&quot; devre dışı: karşılığı olan veri S9&apos;da
          gelecek. Sayaç yalnızca gerçekten biliniyorsa gösterilir.
        </Text>
      </div>
    );
  },
};

/**
 * UI-ADR-150 — envanter kapısının davranış koşulu.
 * Sekme klavye gezinmesi ARIA tablist kalıbının kalbidir ve fareyle
 * bakarken görünmez: ok tuşları çalışmazsa klavye kullanıcısı ikinci
 * sekmeye HİÇ ulaşamaz.
 */
export const KlavyeGezinmesi: StoryObj = {
  name: "Ok tuşlarıyla gezilir, odak seçili sekmede TOPLANIR",
  render: function Render() {
    const [value, setValue] = useState<Tab>("health");
    /* Panelsiz `Tabs` render etmek GERÇEKÇİ DEĞİL: seçili sekmenin
       `aria-controls`u var olmayan bir kimliğe işaret eder (axe yalnız
       seçili olanı bildirir; seçilmemişler tembel render için hoş
       görülür). UI-ADR-164'ün tüm konusu bu ikilinin AYNI `scope`u
       paylaşmasıydı — story de öyle kurulur. */
    /* `scope` — UI-ADR-166. Bu dosyadaki `IkiTabsCakismaz` story'si tam
       olarak "aynı sayfada iki `Tabs` farklı `scope` alır" kuralını
       kilitliyor; ama `Default` ile bu story ikisi de kapsamsızdı ve
       panel eklemek borcu `tabpanel-*` kimliklerine de yaymıştı. Bugün
       test etkisi sıfır (her story ayrı render ediliyor, autodocs kapalı)
       — yani kapı bunu YAPISAL OLARAK göremez. Kuralı yazan dosyanın
       kendisi onu çiğnemesin. */
    const items: { id: Tab; label: string }[] = [
      { id: "health", label: "Health" },
      { id: "performance", label: "Performance" },
      { id: "security", label: "Security" },
    ];
    return (
      <div>
        <Tabs
          scope="kg-"
          label="Görünüm"
          value={value}
          onChange={setValue}
          items={items}
        />
        {items.map((it) => (
          <TabPanel key={it.id} scope="kg-" id={it.id} active={value === it.id}>
            {it.label}
          </TabPanel>
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole("tab");

    /* Roving tabindex: SEKME grubu Tab sırasında TEK durak işgal eder.
       Hepsi tabIndex=0 olsaydı, 6 sekmeli bir grup klavye kullanıcısını
       6 kez durdururdu. */
    await expect(tabs[0]).toHaveAttribute("tabindex", "0");
    await expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    await expect(tabs[1]).toHaveFocus();

    /* Sondan başa SARAR — kullanıcı listenin ucunda sıkışmaz. */
    await userEvent.keyboard("{End}");
    const last = tabs[tabs.length - 1];
    await expect(last).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
};

/**
 * UI-ADR-164 — İKİ `Tabs` aynı sayfada ÇAKIŞMAZ.
 *
 * UI-ADR-162 bunu bir context ile çözmeye çalıştı ve KIRDI: `Tabs`
 * `children` almadığı için Provider `TabPanel`i hiç kapsamıyordu ve
 * `aria-labelledby`/`aria-controls` HER İKİ yönde var olmayan kimliklere
 * işaret ediyordu — düzeltmeden ÖNCE ilişki kuruluyordu, yani net bir
 * gerilemeydi. Regresyon denetimi yakaladı.
 */
export const IkiTabsCakismaz: StoryObj = {
  name: "İki Tabs aynı sayfada — kimlikler çakışmaz, bağ KURULUR",
  render: function Render() {
    const [a, setA] = useState("health");
    const [b, setB] = useState("health");
    const items = [
      { id: "health", label: "Sağlık" },
      { id: "cost", label: "Maliyet" },
    ];
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Tabs items={items} value={a} onChange={setA} label="Sol" scope="sol-" />
          <TabPanel id="health" active={a === "health"} scope="sol-">
            Sol sağlık
          </TabPanel>
        </div>
        <div>
          <Tabs items={items} value={b} onChange={setB} label="Sağ" scope="sag-" />
          <TabPanel id="health" active={b === "health"} scope="sag-">
            Sağ sağlık
          </TabPanel>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* Kimlikler BENZERSİZ — çift id, sayfadaki her IDREF'i bozar. */
    const idler = [...canvasElement.querySelectorAll("[id]")].map((e) => e.id);
    await expect(new Set(idler).size).toBe(idler.length);

    /* ASIL İDDİA: bağ GERÇEKTEN kurulu. `aria-controls` ve
       `aria-labelledby` var olan öğelere işaret etmeli — kırık bir IDREF,
       hiç IDREF olmamasından kötüdür. */
    for (const sekme of canvas.getAllByRole("tab")) {
      const hedef = sekme.getAttribute("aria-controls");
      if (!hedef) continue;
      const panel = document.getElementById(hedef);
      if (panel) {
        await expect(panel.getAttribute("aria-labelledby")).toBe(sekme.id);
      }
    }

    const paneller = canvas.getAllByRole("tabpanel");
    await expect(paneller.length).toBeGreaterThan(0);
    for (const p of paneller) {
      const etiket = p.getAttribute("aria-labelledby")!;
      await expect(document.getElementById(etiket)).not.toBeNull();
    }
  },
};
