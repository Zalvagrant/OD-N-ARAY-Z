"use client";

/**
 * Filter — AYRI PRIMITIVE (10-component-library.md §8.6)
 *
 *   Filter → query oluşturur
 *   Input  → veri girer
 *
 * Bu yüzden Filter bir form elemanı değildir: değeri kaydedilmez,
 * doğrulanmaz, "geçersiz" olamaz. Ürettiği tek şey bir sorgudur.
 *
 * Desteklenmeyen durumlar: Error / Success / ReadOnly / Loading —
 * filtre bir veri çağrısı yapmaz, sonucun sorumluluğu çağıran katmandadır.
 * Seçenek listesi boşsa filtre HİÇ render edilmez (uydurma seçenek yok).
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/selection";
import { Button } from "@/components/ui/button";

export interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Filtrenin ürettiği sorgu: alan → seçili değerler. Boş alan yer almaz. */
export type FilterQuery = Record<string, string[]>;

function FilterDropdown({
  def,
  selected,
  onChange,
}: {
  def: FilterDef;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (def.options.length === 0) return null;

  const toggle = (value: string) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );

  return (
    <div ref={ref} className="relative">
      <Button
        variant={selected.length ? "primary" : "secondary"}
        size="sm"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        {def.label}
        {selected.length > 0 && (
          <span className="odin-num">({selected.length})</span>
        )}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </Button>

      {open && (
        <div
          role="group"
          aria-label={`${def.label} filtresi`}
          className="absolute z-40 mt-1 flex min-w-48 flex-col gap-2 rounded-sm border border-line bg-surface-floating p-3 shadow-e3"
        >
          {def.options.map((opt) => (
            <Checkbox
              key={opt.value}
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              label={<span className="text-sm">{opt.label}</span>}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  filters,
  query,
  onChange,
}: {
  filters: FilterDef[];
  query: FilterQuery;
  onChange: (query: FilterQuery) => void;
}) {
  const activeCount = Object.values(query).reduce((n, v) => n + v.length, 0);

  const set = (id: string, values: string[]) => {
    const next = { ...query };
    if (values.length) next[id] = values;
    else delete next[id];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((def) => (
        <FilterDropdown
          key={def.id}
          def={def}
          selected={query[def.id] ?? []}
          onChange={(values) => set(def.id, values)}
        />
      ))}

      {activeCount > 0 && (
        <Button
          variant="tertiary"
          size="sm"
          icon={<X className="h-3 w-3" aria-hidden />}
          onClick={() => onChange({})}
        >
          Filtreleri temizle ({activeCount})
        </Button>
      )}
    </div>
  );
}
