"""Metin normalizasyonu — denetim ve keyword analizinin ORTAK kuralı.

Bu kural tek bir yerde durur çünkü iki farklı yerde iki farklı
tokenizer, aynı listing için iki farklı "bu kelime geçiyor mu" cevabı
üretir — ve hangisinin doğru olduğunu kimse bilemez.

Kural raporlarda AYNEN basılır (`KELIME_KURALI`). Bir sayı tokenizer
kararının ürünüyse, o kararı görmeyen okuyucu sayıyı denetleyemez.
"""
from __future__ import annotations

import re
import unicodedata

KELIME_KURALI = ("kucuk harfe cevrilir · NFKD normalize edilir · "
                 "harf/rakam disi her sey ayirac sayilir · "
                 "1 karakterlik parcalar atilir · KOK BULMA YAPILMAZ "
                 "(cogul ve tekil ayri kelimedir)")

_AYIRAC = re.compile(r"[^0-9a-zçğıöşü]+")


def kelimeler(metin: str) -> list[str]:
    duz = unicodedata.normalize("NFKD", str(metin).lower())
    return [k for k in _AYIRAC.split(duz) if len(k) > 1]


def bayt(metin: str) -> int:
    """Amazon backend search term sınırı BAYT'tır, karakter değil.

    Türkçe/Almanca karakterler UTF-8'de 2 bayt tutar; 249 karakterlik bir
    alan 249 baytı çoktan aşmış olabilir ve Amazon fazlasını SESSİZCE
    keser. Karakterle ölçen bir denetim bu kaybı hiç göremez.
    """
    return len(str(metin).encode("utf-8"))
