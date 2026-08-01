/** S6 · 19 — SimulationPanel */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { simulationsMock } from "@/mocks/amazon";
import { SimulationPanel } from "./simulation-panel";

const meta: Meta = {
  title: "Executive/19 · SimulationPanel",
  parameters: { layout: "padded" },
};
export default meta;

const base = simulationsMock();

/**
 * Kaynak mock olduğu için başlıkta "SİMÜLASYON — MOCK" yazar.
 * Üçüncü senaryonun varsayımı yoktur → gösterilmez, elendiği altta yazılır.
 * İstemci hiçbir sayı hesaplamaz (UI-ADR-117).
 */
export const HazirSenaryolar: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel env={base} />
    </div>
  ),
  /**
   * UI-ADR-184. Yukarıdaki yorum sözleşmeyi zaten İDDİA EDİYORDU
   * ("üçüncü senaryonun varsayımı yoktur → gösterilmez, elendiği altta
   * yazılır") ve hiçbir şey onu koşturmuyordu.
   *
   * Bu, reponun 2 NUMARALI KURALININ ta kendisi: varsayımı bildirilmemiş
   * bir senaryo, sayıları hesaplanmış gibi durur ama dayanağı yoktur.
   * `canRenderSimulation` süzgeci düşerse ekranda üç senaryo belirir ve
   * üçüncüsü diğer ikisinden AYIRT EDİLEMEZ — sahte veri tam olarak böyle
   * görünür. Elenenin SAYILMASI da sözleşmenin parçası: sessizce elemek,
   * kullanıcının hiç var olmadığını sanmasına yol açar.
   */
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    /* Üç vakadan ikisi çizilir. Sayıyı isimle değil ADETLE ölçüyoruz —
       aşağıdaki nota bak. */
    const secenekler = c.getAllByRole("radio");
    await expect(secenekler).toHaveLength(2);

    await expect(
      c.getByText(/1 senaryo varsayımları bildirilmediği için gösterilmiyor/)
    ).toBeInTheDocument();

    /* Seçim GERÇEKTEN gövdeyi değiştiriyor mu — `SegmentedControl`ün kendi
       klavye/rol sözleşmesi `selection.stories.tsx`te zaten test edilmiş;
       burada ölçülen tek şey DEĞERİN GERİ BAĞLANMASI. */
    await expect(c.getByText("+%9")).toBeInTheDocument();
    await userEvent.click(secenekler[1]);
    await expect(c.getByText("−%6")).toBeInTheDocument();

    /* İŞARET SÖZLEŞMESİ — UI-ADR-191'de DÜZELTİLDİ, artık kilitli.
       UI-ADR-184'te bu kusur bulunmuş ama düzeltme sahibin kararına
       bırakılmıştı (görüntüyü değiştirir); o yüzden test bilerek etikete
       BAĞLANMAMIŞTI, kusuru çimentolamasın diye. Sahip onayladı, tek
       satır düzeldi ve kilit şimdi kondu.

       Ölçülen: artı işaret ALIR, eksi işaret ALIR. İkinci assert olmadan
       `Math.abs`ın işareti yeniden yutması sessizce geri gelebilirdi —
       kusurun ilk hâli tam olarak buydu.

       ⚠️ İlk yazışımda `getByText("−%10")` kullandım ve test "multiple
       elements" ile düştü: etiket artık İKİ yerde görünüyor (radyo düğmesi
       ve gövdedeki "değişim" satırı). Düşme, düzeltmenin İKİSİNDE DE
       çalıştığının kanıtıydı — yani yanlış olan kod değil testimdi, yine.
       Assert seçeneklerin kendisine bağlandı: kullanıcı senaryoyu önce
       oradan okur. */
    await expect(secenekler[0]).toHaveTextContent("+%15");
    await expect(secenekler[1]).toHaveTextContent("−%10");
  },
};

/** Varsayımı bildirilmeyen tek senaryo → panel boş durum gösterir. */
export const VarsayimYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel
        env={{
          data: [
            {
              request: { parameter: "ppc_budget", changePercent: 25 },
              result: {
                scenarios: [{ metric: "Satış", expectedChange: "+%14" }],
                confidence: 55,
                assumptions: [],
              },
            },
          ],
          meta: base.meta,
        }}
      />
    </div>
  ),
};

export const MotorYok: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <SimulationPanel env={{ data: [], meta: base.meta }} />
    </div>
  ),
};

export const VeriYok: StoryObj = {
  render: () => <SimulationPanel env={null} />,
};
