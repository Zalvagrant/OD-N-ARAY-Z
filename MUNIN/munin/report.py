"""Rapor yazıcıları — Markdown · JSON · HTML.

Her raporun DEĞİŞMEZ bir bölümü vardır: **Ölçülemeyenler**. Bir raporda
o bölüm boşsa, o koşumda gerçekten her şey ölçülmüştür. Doluysa, neyin
neden ölçülemediği adıyla yazılıdır.

Bu bölüm asla gizlenmez ve asla rapor sonuna atılmaz — çünkü bir raporun
en yanıltıcı hali, eksiği görünmeyen halidir.
"""
from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .audit import GECTI, KALDI, OLCULEMEZ, Bulgu

BASLIK_CIZGISI = "=" * 72


def _zaman() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def tablo(basliklar: list[str], satirlar: list[list[str]]) -> str:
    if not satirlar:
        return "_(kayit yok)_\n"
        # Boş tabloyu "0" dolu bir tablo gibi basmak yanlış olur.
    cizgiler = ["| " + " | ".join(basliklar) + " |",
                "|" + "|".join("---" for _ in basliklar) + "|"]
    for satir in satirlar:
        temiz = [str(h).replace("|", "\\|").replace("\n", " ") for h in satir]
        cizgiler.append("| " + " | ".join(temiz) + " |")
    return "\n".join(cizgiler) + "\n"


def denetim_markdown(sku: str, listing: dict[str, Any],
                     bulgular: list[Bulgu]) -> str:
    """Tek SKU'nun denetim bölümü."""
    parcalar = [f"### {sku}"]
    asin = listing.get("asin")
    if asin:
        parcalar.append(f"ASIN `{asin}` · ürün tipi "
                        f"`{listing.get('urun_tipi') or '?'}`\n")

    kaldi = [b for b in bulgular if b.durum == KALDI]
    gecti = [b for b in bulgular if b.durum == GECTI]
    olculemez = [b for b in bulgular if b.durum == OLCULEMEZ]

    parcalar.append(f"**{len(gecti)} geçti · {len(kaldi)} kaldı · "
                    f"{len(olculemez)} ölçülemedi**\n")

    if kaldi:
        parcalar.append("#### Kaldı\n")
        parcalar.append(_tablo(
            ["Kural", "Ölçülen", "Beklenen", "Neden önemli"],
            [[b.kural, b.olculen, b.beklenen, b.gerekce] for b in kaldi]))

    if gecti:
        parcalar.append("<details><summary>Geçen kurallar "
                        f"({len(gecti)})</summary>\n")
        parcalar.append(_tablo(["Kural", "Ölçülen"],
                               [[b.kural, b.olculen] for b in gecti]))
        parcalar.append("</details>\n")

    if olculemez:
        parcalar.append("#### Ölçülemedi\n")
        parcalar.append(_tablo(["Kural", "Neden ölçülemedi"],
                               [[b.kural, b.gerekce] for b in olculemez]))
    return "\n".join(parcalar)


def rapor_yaz(kok: Path, ad: str, markdown: str,
              veri: dict[str, Any] | None = None) -> dict[str, Path]:
    """Raporu Markdown ve (varsa) JSON olarak diske yaz."""
    kok = Path(kok)
    kok.mkdir(parents=True, exist_ok=True)
    gun = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yollar: dict[str, Path] = {}

    md = kok / f"{ad}-{gun}.md"
    md.write_text(markdown, encoding="utf-8")
    yollar["markdown"] = md

    if veri is not None:
        js = kok / f"{ad}-{gun}.json"
        js.write_text(json.dumps(veri, ensure_ascii=False, indent=1,
                                 default=str), encoding="utf-8")
        yollar["json"] = js

    hm = kok / f"{ad}-{gun}.html"
    hm.write_text(_html_sar(ad, markdown), encoding="utf-8")
    yollar["html"] = hm
    return yollar


def _html_sar(baslik: str, markdown: str) -> str:
    """Markdown'ı tarayıcıda okunur bir sayfaya sarar.

    Tam bir Markdown çevirici DEĞİL — başlık, tablo, liste ve kalın metni
    çevirir. Bağımlılık eklememek için bilinçli olarak küçük tutuldu;
    Markdown dosyası her zaman kanonik olandır.
    """
    satirlar = markdown.splitlines()
    govde: list[str] = []
    tablo_acik = False

    def tabloyu_kapat() -> None:
        nonlocal tablo_acik
        if tablo_acik:
            govde.append("</table>")
            tablo_acik = False

    for satir in satirlar:
        duz = satir.rstrip()
        if duz.startswith("|") and duz.endswith("|"):
            hucreler = [h.strip() for h in duz.strip("|").split("|")]
            if all(set(h) <= set("-: ") for h in hucreler):
                continue                       # hizalama satırı
            if not tablo_acik:
                govde.append("<table>")
                tablo_acik = True
                etiket = "th"
            else:
                etiket = "td"
            govde.append("<tr>" + "".join(
                f"<{etiket}>{_satir_ici(h)}</{etiket}>" for h in hucreler)
                + "</tr>")
            continue
        tabloyu_kapat()
        if duz.startswith("#"):
            seviye = min(len(duz) - len(duz.lstrip("#")), 6)
            govde.append(f"<h{seviye}>{_satir_ici(duz.lstrip('# '))}"
                         f"</h{seviye}>")
        elif duz.startswith("- "):
            govde.append(f"<li>{_satir_ici(duz[2:])}</li>")
        elif duz.startswith(("<details", "</details", "<summary")):
            govde.append(duz)
        elif not duz:
            govde.append("")
        else:
            govde.append(f"<p>{_satir_ici(duz)}</p>")
    tabloyu_kapat()

    return f"""<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MUNIN — {html.escape(baslik)}</title>
<style>
 :root {{ color-scheme: light dark; }}
 body {{ font: 15px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif;
        max-width: 60rem; margin: 2rem auto; padding: 0 1.25rem; }}
 h1,h2,h3,h4 {{ line-height:1.25; margin-top:2rem; }}
 h1 {{ border-bottom:2px solid currentColor; padding-bottom:.4rem; }}
 table {{ border-collapse:collapse; width:100%; margin:1rem 0;
          display:block; overflow-x:auto; }}
 th,td {{ border:1px solid rgba(128,128,128,.4); padding:.45rem .6rem;
          text-align:left; vertical-align:top; }}
 th {{ background:rgba(128,128,128,.14); font-weight:600; }}
 code {{ background:rgba(128,128,128,.16); padding:.1rem .3rem;
         border-radius:3px; }}
 details {{ margin:1rem 0; }} summary {{ cursor:pointer; font-weight:600; }}
 li {{ margin:.25rem 0; }}
</style></head><body>
{chr(10).join(govde)}
<hr><p><small>MUNIN · {_zaman()} · ölçülmemiş hiçbir sayı basılmadı</small></p>
</body></html>"""


def _satir_ici(metin: str) -> str:
    kacan = html.escape(metin)
    # **kalın** ve `kod` — sırayla, iç içe girmeden.
    parcalar = kacan.split("**")
    kacan = "".join(p if i % 2 == 0 else f"<strong>{p}</strong>"
                    for i, p in enumerate(parcalar))
    parcalar = kacan.split("`")
    return "".join(p if i % 2 == 0 else f"<code>{p}</code>"
                   for i, p in enumerate(parcalar))


def olculemeyenler_bolumu(kayitlar: list[str]) -> str:
    """Her raporun değişmez bölümü."""
    if not kayitlar:
        return ("## Ölçülemeyenler\n\nYok — bu koşumda istenen her alan "
                "ölçüldü.\n")
    satirlar = ["## Ölçülemeyenler\n",
                f"Bu koşumda **{len(kayitlar)}** alan ölçülemedi. Hiçbiri "
                f"tahminle doldurulmadı.\n"]
    satirlar += [f"- {k}" for k in kayitlar]
    return "\n".join(satirlar) + "\n"


def kapak(baslik: str, satirlar: list[str]) -> str:
    parcalar = [f"# MUNIN — {baslik}", "", f"_{_zaman()}_", ""]
    parcalar += satirlar
    return "\n".join(parcalar) + "\n"


_tablo = tablo   # ic kullanim icin eski ad
