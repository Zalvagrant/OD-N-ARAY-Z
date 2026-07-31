"use client";

/**
 * DataTable — 10-component-library.md §9, UI-ADR-081 (M2'nin ikinci işi)
 *
 * TanStack Table + TanStack Virtual. 10.000 satır sanallaştırılır: DOM'da
 * yalnızca görünen ~20 satır bulunur.
 *
 * ZORUNLU TEKNİK KURAL (§9): sayı sütunları sağa hizalı ve `tabular-nums`.
 * Sütun `meta.numeric` vermezse ilk satırın değer tipinden otomatik anlaşılır.
 *
 * Satır seçimi Context Panel'i besler — tablo panelin ne göstereceğini
 * bilmez, yalnızca seçilen satırı yukarı bildirir (§13: presentational
 * bileşende iş mantığı yok).
 *
 * Klavye: ↑ ↓ satır gezinme · Enter seç · Esc seçimi bırak · Home/End uçlar.
 * Sıralama başlıkları Tab ile gezilir, Enter/Space ile sıralar.
 *
 * Desteklenmeyen durum: Success — tablo bir işlem sonucu değil, bir
 * görüntüdür. Kaydetme başarısı satır düzenleyicisinin işidir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export type TableDensity = "comfortable" | "compact" | "dense";

/** Satır yüksekliği hem sanallaştırma hesabı hem CSS sınıfı olarak gerekir. */
const ROW: Record<TableDensity, { px: number; cls: string }> = {
  comfortable: { px: 48, cls: "h-12" },
  compact: { px: 40, cls: "h-10" },
  dense: { px: 32, cls: "h-8" },
};

/**
 * Sütun meta'sı — TanStack'in `meta` alanına ODIN eklentisi.
 * Jenerik imza TanStack'inkiyle BİREBİR aynı olmak zorundadır (declaration
 * merging kuralı); bu yüzden kullanılmayan tip parametreleri var.
 */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** true → sağa hizalı + tabular-nums. Verilmezse veriden anlaşılır. */
    numeric?: boolean;
  }
}

export function DataTable<T>({
  data,
  columns,
  density = "compact",
  globalFilter = "",
  loading = false,
  error,
  onRetry,
  onSelect,
  getRowId,
  emptyTitle = "Kayıt yok",
  emptyDescription = "Bu tabloda gösterilecek veri bulunmuyor.",
  emptySuggestion,
  emptyNextStep,
  maxHeightClass = "max-h-[60vh]",
  label,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  density?: TableDensity;
  /** Serbest metin araması. Search primitive'i tarafından beslenir. */
  globalFilter?: string;
  loading?: boolean;
  error?: { what: string; why: string; impact: string; fix: string };
  onRetry?: () => void;
  onSelect?: (row: T | null) => void;
  getRowId?: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptySuggestion?: string;
  emptyNextStep?: React.ReactNode;
  maxHeightClass?: string;
  label: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* React Compiler TanStack Table'ı memoize edemiyor (döndürdüğü fonksiyonlar
     her render'da değişir). Bilinen ve kabul edilen durum: tablo zaten
     sanallaştırılmış, memoizasyon kazancı ölçülebilir değil. */
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
  });

  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW[density].px,
    overscan: 12,
  });

  /* Sayısal sütunlar: meta.numeric > ilk satırdan tip çıkarımı. */
  const numericCols = useMemo(() => {
    const first = rows[0];
    const set = new Set<string>();
    for (const col of table.getAllLeafColumns()) {
      const declared = col.columnDef.meta?.numeric;
      if (declared === true) set.add(col.id);
      else if (declared === undefined && first) {
        if (typeof first.getValue(col.id) === "number") set.add(col.id);
      }
    }
    return set;
  }, [rows, table]);

  /* Filtre/sıralama sonrası imleç listenin dışında kalmasın. */
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(rows.length - 1, 0)));
  }, [rows.length]);

  const select = (index: number) => {
    const row = rows[index];
    if (!row) return;
    setSelected(row.id);
    onSelect?.(row.original);
  };

  const move = (next: number) => {
    const clamped = Math.max(0, Math.min(next, rows.length - 1));
    setCursor(clamped);
    virtualizer.scrollToIndex(clamped, { align: "auto" });
  };

  if (error) {
    return <ErrorState {...error} onRetry={onRetry} />;
  }

  if (loading) {
    /* Skeleton GERÇEK YERLEŞİMİ temsil eder: aynı satır yüksekliği,
       aynı sütun sayısı → içerik gelince layout shift olmaz. */
    return (
      <SkeletonRegion label={`${label} yükleniyor`}>
        <div className="overflow-hidden rounded-md border border-line">
          <div
            className={`flex items-center gap-4 border-b border-line bg-surface px-4 ${ROW[density].cls}`}
          >
            {table.getAllLeafColumns().map((c) => (
              <Skeleton key={c.id} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 border-b border-line-subtle px-4 ${ROW[density].cls}`}
            >
              {table.getAllLeafColumns().map((c) => (
                <Skeleton key={c.id} className="h-3 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        suggestion={emptySuggestion}
        nextStep={emptyNextStep}
      />
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div className="overflow-hidden rounded-md border border-line">
      {/* Kaydırma kabı — SADECE kaydırır. Izgara değildir (UI-ADR-149). */}
      <div ref={scrollRef} className={`overflow-auto ${maxHeightClass}`}>
        <table
          className="w-full border-collapse text-base"
          /* IZGARA BURADADIR, dışarıdaki div'de DEĞİL.
             Önce `role="grid"` sarmalayıcı div'deydi ve içinde gerçek bir
             `<table>` (örtük `role=table`) duruyordu: satırlardaki
             `aria-rowindex` / `aria-selected` ızgaraya değil, ızgaranın
             İÇİNDEKİ ayrı bir tabloya aitti. Ekran okuyucu için ilişki
             kopuktu — "10.000 satırlık ızgara" diyip satır numarasını
             bulamıyordu. */
          role="grid"
          aria-rowcount={rows.length}
          tabIndex={0}
          onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(cursor + 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(cursor - 1);
          } else if (e.key === "Home") {
            e.preventDefault();
            move(0);
          } else if (e.key === "End") {
            e.preventDefault();
            move(rows.length - 1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(cursor);
          } else if (e.key === "Escape") {
            setSelected(null);
            onSelect?.(null);
          }
          }}
        >
          {/* Tablonun ADI. `<caption>` HTML-AAM'e göre erişilebilir adı
              VERİR ve §9'un istediği başlığı da karşılar; `aria-label` ile
              ikisini birden yazmak adı çiftler. Görsel olarak gizli çünkü
              başlık zaten `Section`/`WorkspaceHeader`ta yazılı — ekran
              okuyucu kullanıcısı ise tabloya doğrudan atlayabilir ve orada
              hiçbir ad duymuyordu. */}
          <caption className="sr-only">{label}</caption>

          <thead className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-line">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const numeric = numericCols.has(header.column.id);
                  const sortable = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-wide text-content-secondary ${
                        numeric ? "text-right" : "text-left"
                      }`}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={`inline-flex items-center gap-1 hover:text-content ${
                            numeric ? "flex-row-reverse" : ""
                          }`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {/* Sıralama yönü ikonla gösterilir — renk değil şekil. */}
                          {sorted === "asc" ? (
                            <ChevronUp className="h-3 w-3" aria-hidden />
                          ) : sorted === "desc" ? (
                            <ChevronDown className="h-3 w-3" aria-hidden />
                          ) : (
                            <ChevronsUpDown
                              className="h-3 w-3 text-icon-muted"
                              aria-hidden
                            />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {/* Üst boşluk: sanallaştırmanın kaydırma yüksekliğini korur. */}
            {items[0] && items[0].start > 0 && (
              <tr aria-hidden>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  style={{ height: items[0].start }}
                />
              </tr>
            )}

            {items.map((v) => {
              const row = rows[v.index]!;
              const isSelected = row.id === selected;
              const isCursor = v.index === cursor;
              return (
                <tr
                  key={row.id}
                  data-index={v.index}
                  aria-rowindex={v.index + 1}
                  aria-selected={isSelected}
                  onClick={() => {
                    setCursor(v.index);
                    select(v.index);
                  }}
                  className={[
                    ROW[density].cls,
                    "cursor-pointer border-b border-line-subtle",
                    "transition-colors duration-fast ease-standard",
                    isSelected
                      ? "bg-surface-elevated"
                      : "hover:bg-surface-elevated",
                    /* İmleç konumu renkten bağımsız: sol kenarda çizgi. */
                    isCursor ? "outline outline-1 -outline-offset-1 outline-line-focus" : "",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const numeric = numericCols.has(cell.column.id);
                    return (
                      <td
                        key={cell.id}
                        className={`truncate px-4 ${
                          numeric ? "odin-num" : "text-left"
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Alt boşluk */}
            {items.length > 0 && (
              <tr aria-hidden>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  style={{
                    height:
                      virtualizer.getTotalSize() - items[items.length - 1]!.end,
                  }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2 text-xs text-content-tertiary">
        <span className="odin-num">{rows.length} satır</span>
        {selected && <span>1 satır seçili · Esc ile bırak</span>}
      </div>
    </div>
  );
}
