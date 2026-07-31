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

/**
 * Gerçek mod derlemesinde mock kayıt defteri stub'a çözülür — UI-ADR-123.
 *
 * Mock erişimi önce TEK bir modüle (`src/mocks/registry.ts`) toplandı; bu
 * alias yalnız o tek dikiş yerini değiştirir. Amaç ölçülebilir: gerçek mod
 * çıktısında mock dizesi ARANIR ve bulunmaması beklenir
 * (`scripts/assert-no-mock-in-bundle.mjs`).
 *
 * Tip güvenliği etkilenmez: `tsc` gerçek dosyayı görür, alias yalnız
 * paketleyicidedir.
 */
const REAL_MODE = process.env.NEXT_PUBLIC_ODIN_DATA_MODE === "odin";

const nextConfig: NextConfig = {
  /*
   * DEV'DE HİDRASYONU AÇAN AYAR — UI-ADR-125.
   *
   * Next 16 dev sunucusu, `/_next/webpack-hmr` gibi dev kaynaklarına
   * "cross-origin" istekleri varsayılan olarak ENGELLER ve yalnız
   * `localhost`a izin verir. Arayüz `127.0.0.1:3000` üzerinden açılınca
   * HMR isteği bloklanıyor ve **istemci hidrasyonu hiç tamamlanmıyordu**:
   * ekran sunucudan geldiği gibi donuyor, hiçbir düğme çalışmıyor, veri
   * kancaları hiç ateşlenmiyor. Konsolda hata YOK — teşhisi bu yüzden zor.
   *
   * `127.0.0.1` LOOPBACK'tir; makinenin kendisidir, ağa açılma değildir.
   * Bilerek yalnız o eklendi — `192.168.1.105` (LAN adresi) eklenmedi,
   * o gerçekten dışarı açmak olurdu.
   *
   * Yalnız geliştirmeyi etkiler; üretim derlemesi zaten sorunsuzdu.
   */
  allowedDevOrigins: ["127.0.0.1"],

  turbopack: REAL_MODE
    ? { resolveAlias: { "@/mocks/registry": "./src/mocks/registry.release.ts" } }
    : {},

  async rewrites() {
    /* Yalnız ODIN'in yayınladığı dört uç nokta. `/:path*` genel geçidi
       yazmak, yarın ODIN'e eklenecek her şeyi de otomatik açardı. */
    return [{ source: "/odin/api/:path*", destination: `${ODIN_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
