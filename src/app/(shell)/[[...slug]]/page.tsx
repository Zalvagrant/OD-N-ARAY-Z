/**
 * Geçici workspace sayfası — S2.
 *
 * Her workspace için ayrı dosya yazmak yerine tek bir yol yakalayıcı
 * kullanılıyor. S5+ sprintlerinde gerçek ekran yazıldığında o rota için
 * statik dosya eklenir; Next statik segmenti bu yakalayıcıdan önce seçer.
 * Yani bu dosya kimseyi engellemez, yalnızca boşluğu dürüstçe doldurur.
 */

import { notFound, redirect } from "next/navigation";
import { findWorkspaceByPath } from "@/lib/navigation/registry";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading, Label } from "@/components/ui/typography";

const TYPE_LABEL: Record<string, string> = {
  executive: "Executive Workspace",
  operational: "Operational Workspace",
  analytical: "Analytical Workspace",
  knowledge: "Knowledge Workspace",
  configuration: "Configuration Workspace",
  monitoring: "Monitoring Workspace",
};

export default async function WorkspacePlaceholder({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  /* Açılış ekranı: Executive Briefing (05-dashboard.md §2). */
  if (!slug?.length) redirect("/briefing");

  const pathname = `/${slug.join("/")}`;
  const workspace = findWorkspaceByPath(pathname);
  if (!workspace) notFound();

  const child = workspace.children?.find((c) => c.href === pathname);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        {/* Tipografi primitive'leri kullanılır — diğer her ekran öyle
            yapıyor; ham <h1>/<p> ölçek değişince bu sayfayı geride
            bırakırdı (UI-ADR-133). */}
        <Label>{TYPE_LABEL[workspace.type]}</Label>
        <Heading level={1} size={2}>
          {child ? `${workspace.label} · ${child.label}` : workspace.label}
        </Heading>
      </header>

      <EmptyState
        title="Bu ekran henüz üretilmedi"
        description="App Shell ayakta: navigasyon, bağlam zinciri, komut paleti ve bağlam paneli çalışıyor. Bu workspace'in içeriği kendi sprintinde gelecek."
        suggestion="Ctrl+K ile komut paletini açıp workspace'ler arasında gezinebilirsin."
        example="S5 · Executive Briefing + Mission Control → S6 · Amazon Director → S10-S11 · kalanlar"
      />
    </div>
  );
}
