import { useEffect, useMemo, useRef, useState } from "react";

interface DatePickerProps {
  value: string; // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  label?: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatHuman(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePicker({ value, onChange, min, max, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => (value ? parseIso(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setView(parseIso(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const minDate = useMemo(() => (min ? parseIso(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseIso(max) : null), [max]);
  const today = useMemo(() => new Date(), []);
  const selected = useMemo(() => (value ? parseIso(value) : null), [value]);

  const monthDays = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ date: Date; inMonth: boolean })[] = [];
    // Leading days from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [view]);

  const canGoPrev = () => {
    if (!minDate) return true;
    const firstOfView = new Date(view.getFullYear(), view.getMonth(), 1);
    return firstOfView > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  };
  const canGoNext = () => {
    if (!maxDate) return true;
    const firstOfView = new Date(view.getFullYear(), view.getMonth(), 1);
    return firstOfView < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  };

  const goPrev = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const goNext = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  const isDisabled = (d: Date): boolean => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(toIso(d));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors hover:bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#257ca3]/30 cursor-pointer"
        style={{ borderColor: "#e0e3e6", backgroundColor: "white", color: "#191c1e" }}
        aria-label={label}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ color: "#257ca3" }}>
          calendar_month
        </span>
        <span className="font-medium tabular-nums">{formatHuman(value)}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 animate-fade-in"
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(11,32,48,0.18)",
            padding: 16,
            width: 280,
          }}
        >
          {/* Header — month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#eceef1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: "#257ca3" }}>chevron_left</span>
            </button>
            <span className="text-sm font-semibold" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
              {MONTH_NAMES[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#eceef1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: "#257ca3" }}>chevron_right</span>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_LABELS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-semibold tracking-wider" style={{ color: "#71787c" }}>
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(({ date, inMonth }, i) => {
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              const disabled = isDisabled(date);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  className="w-9 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected
                      ? "#257ca3"
                      : isToday
                      ? "rgba(191,232,255,0.5)"
                      : "transparent",
                    color: isSelected
                      ? "#ffffff"
                      : disabled
                      ? "#c1c7cc"
                      : !inMonth
                      ? "#c1c7cc"
                      : isToday
                      ? "#257ca3"
                      : "#191c1e",
                    fontWeight: isSelected || isToday ? 700 : 500,
                    opacity: disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !disabled) e.currentTarget.style.backgroundColor = "#eceef1";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !disabled) {
                      e.currentTarget.style.backgroundColor = isToday ? "rgba(191,232,255,0.5)" : "transparent";
                    }
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick "today" action */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
            <button
              type="button"
              onClick={() => handleSelect(today)}
              disabled={isDisabled(today)}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#eceef1] disabled:opacity-30 cursor-pointer"
              style={{ color: "#257ca3" }}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
