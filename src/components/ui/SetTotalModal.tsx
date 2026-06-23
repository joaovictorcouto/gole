import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";

interface Props {
  open: boolean;
  currentMl: number;
  containerMl?: number;
  containerName?: string;
  onClose: () => void;
}

export function SetTotalModal({ open, currentMl, containerMl, containerName, onClose }: Props) {
  const { loadTodayStats } = useAppStore();
  const [mode, setMode] = useState<"ml" | "containers">("ml");
  const [mlInput, setMlInput] = useState<string>(String(currentMl));
  const [containerCount, setContainerCount] = useState<string>("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMlInput(String(currentMl));
      setContainerCount("1");
      setError(null);
      setMode("ml");
    }
  }, [open, currentMl]);

  if (!open) return null;

  const computedMl = mode === "ml"
    ? Math.max(0, Math.round(Number(mlInput) || 0))
    : Math.max(0, Math.round((Number(containerCount) || 0) * (containerMl || 0)));

  const diff = computedMl - currentMl;

  const submit = async () => {
    setError(null);
    if (computedMl < currentMl) {
      setError("Total menor que o já registrado. Use o histórico para apagar registros.");
      return;
    }
    setBusy(true);
    try {
      await api.setTodayTotal(computedMl);
      await loadTodayStats();
      onClose();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-[440px] max-w-[92vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[26px]" style={{ color: "#257ca3" }}>edit_note</span>
          <h2 className="text-lg font-bold" style={{ color: "#191c1e" }}>Definir total bebido hoje</h2>
        </div>

        <p className="text-xs mb-4" style={{ color: "#5B6572" }}>
          Já registrado: <strong>{currentMl}ml</strong>. Informe o total real e o GOLE adiciona a diferença + recalcula os próximos lembretes.
        </p>

        {containerMl && containerMl > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("ml")}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
              style={{
                background: mode === "ml" ? "rgba(191,232,255,0.5)" : "rgba(236,238,241,0.7)",
                color: mode === "ml" ? "#257ca3" : "#5B6572",
                border: `1px solid ${mode === "ml" ? "#257ca3" : "transparent"}`,
              }}
            >Em ml</button>
            <button
              onClick={() => setMode("containers")}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
              style={{
                background: mode === "containers" ? "rgba(191,232,255,0.5)" : "rgba(236,238,241,0.7)",
                color: mode === "containers" ? "#257ca3" : "#5B6572",
                border: `1px solid ${mode === "containers" ? "#257ca3" : "transparent"}`,
              }}
            >Em {containerName || "garrafa"}s</button>
          </div>
        )}

        {mode === "ml" ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5B6572" }}>Total em ml</span>
            <input
              type="number"
              min={0}
              step={50}
              value={mlInput}
              onChange={(e) => setMlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              autoFocus
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
              style={{ borderColor: "#e0e3e6" }}
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5B6572" }}>
              Quantidade de {containerName || "garrafas"} ({containerMl}ml cada)
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={containerCount}
              onChange={(e) => setContainerCount(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              autoFocus
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
              style={{ borderColor: "#e0e3e6" }}
            />
            <p className="text-[11px] mt-1" style={{ color: "#71787c" }}>= {computedMl}ml</p>
          </label>
        )}

        <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(191,232,255,0.18)" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#5B6572" }}>Já registrado</span>
            <span className="font-semibold" style={{ color: "#191c1e" }}>{currentMl}ml</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span style={{ color: "#5B6572" }}>Novo total</span>
            <span className="font-semibold" style={{ color: "#257ca3" }}>{computedMl}ml</span>
          </div>
          <div className="flex justify-between text-xs mt-1 pt-1 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
            <span style={{ color: "#5B6572" }}>Diferença a adicionar</span>
            <span className="font-semibold" style={{ color: diff >= 0 ? "#0f76a0" : "#bf360c" }}>
              {diff >= 0 ? "+" : ""}{diff}ml
            </span>
          </div>
        </div>

        {error && <p className="text-[11px] mt-2" style={{ color: "#bf360c" }}>{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 px-4 py-2 rounded-xl text-sm cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            style={{ backgroundColor: "rgba(236,238,241,0.7)", color: "#5B6572" }}
          >Cancelar</button>
          <button
            onClick={submit}
            disabled={busy || diff < 0}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
            style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)" }}
          >{busy ? "Salvando..." : "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}
