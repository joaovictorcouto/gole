import { useEffect, useState } from "react";

interface Props {
  amount: number;
  onUndo: () => Promise<void> | void;
  durationMs?: number;
  onExpire?: () => void;
}

/**
 * Small inline chip with countdown progress to undo the latest drink.
 * Designed to be placed near the button that triggered the drink.
 */
export function UndoChip({ amount, onUndo, durationMs = 5000, onExpire }: Props) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const left = Math.max(0, durationMs - (now - start));
      setRemaining(left);
      if (left > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        onExpire?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  const pct = (remaining / durationMs) * 100;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-md animate-fade-in"
      style={{
        background: "rgba(25,28,30,0.92)",
        backdropFilter: "blur(12px)",
        color: "white",
      }}
    >
      <span className="text-xs font-medium whitespace-nowrap">+{amount}ml registrado</span>
      <button
        onClick={() => onUndo()}
        className="relative text-xs font-semibold px-2 py-1 rounded-lg overflow-hidden cursor-pointer"
        style={{ color: "#7DD8F8", background: "rgba(125,216,248,0.08)" }}
      >
        <span className="relative z-10">Desfazer</span>
        <div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ width: `${pct}%`, background: "#7DD8F8", transition: "width 80ms linear" }}
        />
      </button>
    </div>
  );
}
