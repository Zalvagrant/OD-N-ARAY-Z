/**
 * Kohort seçicileri — UI-ADR-130.
 *
 * Bu kurallar JSX'in içindeydi ve okunamıyordu, dolayısıyla test de
 * edilemiyordu. Asıl önemli olan iki DAVRANIŞ burada kilitleniyor:
 * ölçülmemiş SKU'nun risk sayılmaması ve ölçülmemiş oranın "en kötü"
 * gibi sıralanmaması.
 */

import { describe, expect, it } from "vitest";
import type { SkuHealth } from "@/types/screens";
import { atRiskSkus, losingBuyBoxSkus } from "./selectors";
import { BUY_BOX_RISK_BELOW } from "./presentation/thresholds";

const sku = (
  id: string,
  status: SkuHealth["status"],
  buyBoxRate: number | null
): SkuHealth =>
  ({
    sku: id,
    status,
    sales: { buyBoxRate },
  }) as unknown as SkuHealth;

describe("atRiskSkus", () => {
  it("yalnız critical ve warn — unknown bir sağlık durumu DEĞİL", () => {
    const rows = [
      sku("a", "critical", null),
      sku("b", "warn", null),
      sku("c", "ok", null),
      sku("d", "unknown", null),
      sku("e", "no_movement", null),
    ];
    expect(atRiskSkus(rows).map((s) => s.sku)).toEqual(["a", "b"]);
  });

  it("48'in 29'u unknown olduğunda liste şişmez — UI-ADR-128 gerekçesi", () => {
    const rows = Array.from({ length: 29 }, (_, i) => sku(`u${i}`, "unknown", null));
    expect(atRiskSkus(rows)).toHaveLength(0);
  });
});

describe("losingBuyBoxSkus", () => {
  it("eşiğin altındakileri en kötüden başlayarak verir", () => {
    const rows = [
      sku("iyi", "ok", BUY_BOX_RISK_BELOW + 5),
      sku("orta", "ok", BUY_BOX_RISK_BELOW - 1),
      sku("kotu", "ok", BUY_BOX_RISK_BELOW - 30),
    ];
    expect(losingBuyBoxSkus(rows).map((s) => s.sku)).toEqual(["kotu", "orta"]);
  });

  it("eşiğin TAM üstündeki dışarıda kalır — sınır kapsayıcı değil", () => {
    expect(losingBuyBoxSkus([sku("sinir", "ok", BUY_BOX_RISK_BELOW)])).toHaveLength(0);
  });

  it("ölçülmemiş oran 'en kötü' gibi sıralanmaz — null ELENİR", () => {
    /* Eski kod `?? 0` ile sıralıyordu: ölçülmemiş bir SKU listenin
       başında %0 gibi görünürdü. Ölçülmemiş bir oran düşük değildir. */
    const rows = [sku("olculmedi", "ok", null), sku("dusuk", "ok", 10)];
    const out = losingBuyBoxSkus(rows);
    expect(out.map((s) => s.sku)).toEqual(["dusuk"]);
  });
});
