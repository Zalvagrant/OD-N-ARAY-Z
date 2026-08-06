# Bu klasör neden burada?

**MUNIN bu deponun parçası değildir.** Buraya yalnızca **yedek** olarak
kondu: kod bulutta geçici bir konteynerde yazıldı ve konteyner kapanınca
kaybolacaktı.

MUNIN bağımsız bir programdır — ODIN'e de bu React arayüzüne de kod olarak
bağlı değildir. Doğru yeri kendi deposudur.

## Kendi deposuna taşımak

GitHub'da boş bir `MUNIN` deposu aç, sonra:

```bash
cd MUNIN
git init
git add .
git commit -m "MUNIN 1.0.0"
git branch -M main
git remote add origin https://github.com/Zalvagrant/MUNIN.git
git push -u origin main
```

Sonra bu klasör OD-N-ARAY-Z'den silinebilir.

## Doğrudan kullanmak

Bu klasörü olduğu gibi masaüstüne kopyala:

```bash
cd MUNIN
python3 -m munin --help
```

Kurulum: `KURULUM.md`
