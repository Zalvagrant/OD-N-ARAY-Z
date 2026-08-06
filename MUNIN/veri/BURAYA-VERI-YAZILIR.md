# veri/

MUNIN'in hafızası burada. **Bu klasörü silme.**

- `anlik/` — tarihli anlık görüntüler. Rakip farkı ve önce/sonra
  karşılaştırması tamamen buradan üretilir. Silersen MUNIN "değişim yok"
  demez; "bu ilk ölçüm" der ve karşılaştırma yapamaz.
- `rapor/` — üretilen raporlar (.md / .json / .html)
- `hugin/gelen/` — HUGIN'den aldığın dosyaları buraya koy
- `hugin/giden/` — MUNIN'in HUGIN için ürettiği gözlem dosyaları
- `hedefler.json` — neyi izlediğin

⚠ Kimlik dosyası BURAYA KONMAZ. Yeri: `~/.munin/kimlik.json` (senkronsuz).
