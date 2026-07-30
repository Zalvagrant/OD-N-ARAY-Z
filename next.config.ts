import type { NextConfig } from "next";

/**
 * ODIN vekili — S8 (UI-ADR-117).
 *
 * ODIN'in cockpit'i (`odin/cockpit.py`) CORS başlığı YAYINLAMIYOR; ölçüldü,
 * yanıt başlıkları yalnız Content-Type/Length/Cache-Control. Dolayısıyla
 * tarayıcıdaki arayüz `http://127.0.0.1:8765`'e DOĞRUDAN gidemez.
 *
 * Çözüm ODIN'den CORS istemek DEĞİL: sunucunun 127.0.0.1'e bağlı olması ve
 * dışarı açılmaması bilinçli bir güvenlik kararıdır (CLAUDE.md "dışarı
 * açma"); köken kısıtını arayüzün rahatlığı için delmek o kararı geçersiz
 * kılardı. Bunun yerine istek Next'in kendi sunucusundan geçer — tarayıcı
 * için AYNI KÖKEN, ODIN için hâlâ yerel bir istemci. Hiçbir başlık
 * gevşetilmedi, ODIN'e tek satır dokunulmadı.
 *
 * Hedef adres `NEXT_PUBLIC_*` DEĞİLDİR: ODIN'in adresi tarayıcı paketine
 * gömülmez, yalnız sunucu tarafında bilinir.
 */
const ODIN_ORIGIN = process.env.ODIN_ORIGIN ?? "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/odin/:path*", destination: `${ODIN_ORIGIN}/:path*` }];
  },
};

export default nextConfig;
