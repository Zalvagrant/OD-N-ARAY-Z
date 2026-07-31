import type { NextConfig } from "next";

/**
 * ODIN vekili — S8 (UI-ADR-119).
 *
 * ODIN'in cockpit'i (`odin/cockpit.py`) CORS başlığı YAYINLAMIYOR; ölçüldü,
 * yanıt başlıkları yalnız Content-Type/Length/Cache-Control. Dolayısıyla
 * tarayıcıdaki arayüz `http://127.0.0.1:8765`'e DOĞRUDAN gidemez.
 *
 * Çözüm ODIN'den CORS istemek DEĞİL: sunucunun 127.0.0.1'e bağlı olması ve
 * dışarı açılmaması bilinçli bir güvenlik kararıdır (CLAUDE.md: "dışarı
 * açma"). Köken kısıtını arayüzün rahatlığı için delmek, o kararı arayüz
 * adına geçersiz kılmak olurdu. İstek Next'in kendi sunucusundan geçer —
 * tarayıcı için aynı köken, ODIN için hâlâ yerel bir istemci. Hiçbir başlık
 * gevşetilmedi, ODIN'e tek satır dokunulmadı.
 *
 * ⚠️ VEKİL BİR GÜVENLİK SINIRI DEĞİLDİR (meclis uyarısı). `/odin/*`
 * tarayıcıya açık bir yoldur; `127.0.0.1` yalnız Next sürecinin kendi
 * makinesini gösterir, istemci erişimini kısıtlamaz. Bugün kabul edilebilir
 * çünkü Next de yalnız yerelde çalışıyor. ODIN dışarı açılırsa ya da
 * uygulama dağıtılırsa vekilin önüne yetkilendirme konulmalıdır —
 * `backend-istekleri.md` §10'a borç olarak yazıldı.
 *
 * Hedef adres `NEXT_PUBLIC_*` DEĞİLDİR: ODIN'in adresi tarayıcı paketine
 * gömülmez, yalnız sunucu tarafında bilinir.
 */
const ODIN_ORIGIN = process.env.ODIN_ORIGIN ?? "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  async rewrites() {
    /* Yalnız ODIN'in yayınladığı dört uç nokta. `/:path*` genel geçidi
       yazmak, yarın ODIN'e eklenecek her şeyi de otomatik açardı. */
    return [{ source: "/odin/api/:path*", destination: `${ODIN_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
