import { useEffect, useState } from "react";
import { Modal, ModalSecondaryButton } from "./Modal";
import { api, DrinkLog } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Date in ISO format (YYYY-MM-DD). Defaults to today. */
  date?: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatHumanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function DrinkHistoryModal({ open, onClose, date }: Props) {
  const targetDate = date ?? todayIso();
  const isToday = targetDate === todayIso();

  const { settings, loadSettings } = useAppStore();
  const [drinks, setDrinks] = useState<DrinkLog[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editTime, setEditTime] = useState("");
  const [adding, setAdding] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newTime, setNewTime] = useState(nowHHMM());
  const [drinkToDelete, setDrinkToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      void load();
      setEditingId(null);
      setAdding(false);
      setNewTime(isToday ? nowHHMM() : "12:00");
      if (!settings) void loadSettings();
    }
  }, [open, targetDate]);

  const load = async () => {
    const list = await api.getDrinksForDate(targetDate);
    setDrinks(list);
  };

  const handleSaveEdit = async (id: number) => {
    const isBasicMode = settings?.app_mode === "basic";
    const originalDrink = drinks.find(dr => dr.id === id);
    const n = isBasicMode ? (originalDrink?.amount_ml ?? 250) : Number(editValue);
    if (!isBasicMode && (isNaN(n) || n <= 0 || n > 5000)) return;
    const [hh, mm] = (editTime || "12:00").split(":");
    const loggedAt = `${targetDate}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`;
    const stats = await api.updateDrink(id, Math.round(n), loggedAt);
    useAppStore.setState((s) => ({ todayStats: stats, drinkTick: s.drinkTick + 1 }));
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    const stats = await api.deleteDrink(id);
    useAppStore.setState((s) => ({ todayStats: stats, drinkTick: s.drinkTick + 1 }));
    await load();
  };

  const handleAdd = async () => {
    const isBasicMode = settings?.app_mode === "basic";
    const n = isBasicMode ? (settings?.sip_ml ?? 250) : Number(newAmount);
    if (!isBasicMode && (isNaN(n) || n <= 0 || n > 5000)) return;
    const [hh, mm] = (newTime || "12:00").split(":");
    const loggedAt = `${targetDate}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`;
    const stats = await api.logDrinkAt(Math.round(n), loggedAt);
    useAppStore.setState((s) => ({ todayStats: stats, drinkTick: s.drinkTick + 1 }));
    setNewAmount("");
    setAdding(false);
    await load();
  };

  const total = drinks.reduce((s, d) => s + d.amount_ml, 0);
  const goal = settings?.daily_goal_ml ?? 2000;
  const remaining = Math.max(0, goal - total);

  const handleCompleteGoal = async () => {
    if (remaining <= 0) return;
    let loggedAt = `${targetDate}T12:00:00`;
    if (isToday) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      loggedAt = `${targetDate}T${hh}:${mm}:00`;
    }
    const stats = await api.logDrinkAt(remaining, loggedAt);
    useAppStore.setState((s) => ({ todayStats: stats, drinkTick: s.drinkTick + 1 }));
    await load();
  };

  const isBasicMode = settings?.app_mode === "basic";

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="history"
      title={isToday ? "Registros de hoje" : `Registros — ${formatHumanDate(targetDate)}`}
      description={
        isBasicMode 
          ? `${drinks.length} ${drinks.length === 1 ? "registro" : "registros"}`
          : `${drinks.length} ${drinks.length === 1 ? "registro" : "registros"} · ${(total / 1000).toFixed(2).replace(".", ",")}L no total`
      }
      maxWidth={560}
    >
      {/* Botão de Meta Batida */}
      {!isBasicMode && (
        remaining > 0 ? (
          <button
            onClick={handleCompleteGoal}
            className="w-full mb-3 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            style={{
              background: "linear-gradient(135deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(59,99,119,0.15)"
            }}
          >
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
            Marcar como batida (+{remaining}ml)
          </button>
        ) : (
          <div className="w-full mb-3 py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Meta de hidratação batida! 🎉
          </div>
        )
      )}

      {/* Add new */}
      {adding ? (
        <div className="mb-4 p-3 rounded-xl space-y-2" style={{ backgroundColor: "var(--color-surface-container-low, #f7f9fc)" }}>
          <div className="flex gap-2">
            {!isBasicMode && (
              <input
                type="number"
                autoFocus
                placeholder="Quantidade (ml)"
                value={newAmount}
                min={1}
                max={5000}
                onChange={(e) => setNewAmount(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 text-text-dark bg-surface"
                style={{ borderColor: "var(--color-outline-variant, #e0e3e6)" }}
              />
            )}
            <input
              type="time"
              autoFocus={isBasicMode}
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex-1 text-text-dark bg-surface"
              style={{ borderColor: "var(--color-outline-variant, #e0e3e6)" }}
              title="Horário"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 rounded-xl text-white font-medium text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              style={{ background: "linear-gradient(180deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)" }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAdding(false); setNewAmount(""); }}
              className="px-4 py-2 rounded-xl font-medium text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 hover:bg-surface-container-high transition-colors"
              style={{ color: "var(--color-text-main, #5B6572)", backgroundColor: "var(--color-surface-container, #eceef1)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full mb-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          style={{ borderColor: "var(--color-outline-variant, #e0e3e6)", color: "var(--color-primary, #257ca3)", borderStyle: "dashed" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Adicionar registro manual
        </button>
      )}

      {/* List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {drinks.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: "var(--color-outline, #71787c)" }}>
            Nenhum registro nesse dia.
          </div>
        )}
        {drinks.map((d) => {
          const isEditing = editingId === d.id;
          return (
            <div
              key={d.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              style={{ borderColor: "var(--color-border-subtle, #eceef1)", backgroundColor: isEditing ? "var(--color-surface-container-low, #f7f9fc)" : "var(--color-surface-container-lowest, white)" }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-primary, #257ca3)" }}>water_drop</span>
              <div className="flex-grow flex items-center gap-2">
                {isEditing ? (
                  <>
                    {!isBasicMode && (
                      <input
                        type="number"
                        autoFocus
                        value={editValue}
                        min={1}
                        max={5000}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(d.id); if (e.key === "Escape") setEditingId(null); }}
                        className="w-24 px-2 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 text-text-dark bg-surface"
                        style={{ borderColor: "var(--color-outline-variant, #e0e3e6)" }}
                        title="Quantidade (ml)"
                      />
                    )}
                    <input
                      type="time"
                      autoFocus={isBasicMode}
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(d.id); if (e.key === "Escape") setEditingId(null); }}
                      className="px-2 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex-grow text-text-dark bg-surface"
                      style={{ borderColor: "var(--color-outline-variant, #e0e3e6)" }}
                      title="Horário"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-on-surface, #191c1e)" }}>
                      {isBasicMode ? "Copo de água" : `${d.amount_ml}ml`}
                    </span>
                    <span className="text-xs text-text-main font-medium bg-surface-container-high px-2 py-0.5 rounded-md ml-1">
                      {formatTime(d.logged_at)}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(d.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { 
                        setEditingId(d.id); 
                        setEditValue(String(d.amount_ml));
                        const dTime = new Date(d.logged_at);
                        const hh = String(dTime.getHours()).padStart(2, "0");
                        const mm = String(dTime.getMinutes()).padStart(2, "0");
                        setEditTime(`${hh}:${mm}`);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-text-dark hover:bg-surface-container-high cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDrinkToDelete(d.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-500/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                      title="Excluir registro"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {drinkToDelete !== null && (
        <Modal
          open={true}
          onClose={() => setDrinkToDelete(null)}
          title="Confirmar Exclusão"
          description="Deseja realmente excluir este registro de água? Isso atualizará seu total diário."
          icon="warning"
          iconColor="#bf360c"
          iconBg="#ffe0b2"
          maxWidth={380}
        >
          <div className="flex gap-3 mt-2">
            <ModalSecondaryButton onClick={() => setDrinkToDelete(null)}>
              Cancelar
            </ModalSecondaryButton>
            <button
              onClick={async () => {
                const id = drinkToDelete;
                setDrinkToDelete(null);
                await handleDelete(id);
              }}
              className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d32f2f] focus:ring-offset-2"
              style={{
                background: "linear-gradient(180deg, #d32f2f 0%, #c62828 100%)",
                boxShadow: "0 8px 20px rgba(211,47,47,0.25)",
                letterSpacing: "0.02em",
              }}
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
