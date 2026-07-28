/**
 * S1 geçici sayfası.
 * Token katmanının tarayıcıda gerçekten çalıştığını gösterir.
 * S2'de App Shell gelince bu sayfa Mission Control'e devredilir.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-bg p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-content-tertiary">
            ODIN · Executive Intelligence
          </p>
          <h1 className="text-2xl font-semibold text-content">
            Token katmanı ayakta
          </h1>
          <p className="text-base text-content-secondary">
            S1 tamamlandı. App Shell S2&apos;de gelecek.
          </p>
        </header>

        <section className="rounded-md border border-line bg-surface p-6 shadow-e2">
          <h2 className="mb-4 text-md font-medium text-content">Sayı hizalama</h2>
          <table className="w-full text-base">
            <tbody>
              {[
                ["Net satış", "1.284.930,45"],
                ["Reklam harcaması", "92.104,00"],
                ["Brüt kâr", "418,70"],
              ].map(([label, value]) => (
                <tr key={label} className="border-t border-line-subtle">
                  <td className="py-2 text-content-secondary">{label}</td>
                  <td className="odin-num py-2 text-content">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="odin-ai-region p-6">
          <h2 className="mb-2 text-md font-medium text-ai-text">AI bölgesi</h2>
          <p className="text-base text-content-secondary">
            AI üretimi içerik mor glow ile ayrışır (UI-ADR-069).
          </p>
        </section>
      </div>
    </main>
  );
}
