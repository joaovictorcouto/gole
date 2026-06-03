import { useEffect, useState } from "react";
import { Modal } from "./Modal";
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
  return new Date().toISOString().slice(0, 10);
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

  const [drinks, setDrinks] = useState<DrinkLog[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newTime, setNewTime] = useState(nowHHMM());

  useEffect(() => {
    if (open) {
      void load();
      setEditingId(null);
      setAdding(false);
      setNewAmount("");
      setNewTime(isToday ? nowHHMM() : "12:00");
    }
  }, [open, targetDate]);

  const load = async () => {
    const list = await api.getDrinksForDate(targetDate);
    setDrinks(list);
  };

  const handleSaveEdit = async (id: number) => {
    const n = Number(editValue);
    if (isNaN(n) || n <= 0 || n > 5000) return;
    const stats = await api.updateDrink(id, Math.round(n));
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
    const n = Number(newAmount);
    if (isNaN(n) || n <= 0 || n > 5000) return;
    const [hh, mm] = (newTime || "12:00").split(":");
    const loggedAt = `${targetDate}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`;
    const stats = await api.logDrinkAt(Math.round(n), loggedAt);
    useAppStore.setState((s) => ({ todayStats: stats, drinkTick: s.drinkTick + 1 }));
    setNewAmount("");
    setAdding(false);
    await load();
  };

  const total = drinks.reduce((s, d) => s + d.amount_ml, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="history"
      title={isToday ? "Registros de hoje" : `Registros — ${formatHumanDate(targetDate)}`}
      description={`${drinks.length} ${drinks.length === 1 ? "registro" : "registros"} · ${(total / 1000).toFixed(2).replace(".", ",")}L no total`}
      maxWidth={560}
    >
      {/* Add new */}
      {adding ? (
        <div className="mb-4 p-3 rounded-xl space-y-2" style={{ backgroundColor: "#f7f9fc" }}>
          <div className="flex gap-2">
            <input
              type="number"
              autoFocus
              placeholder="Quantidade (ml)"
              value={newAmount}
              min={1}
              max={5000}
              onChange={(e) => setNewAmount(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
              style={{ backgroundColor: "white", borderColor: "#e0e3e6" }}
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
              style={{ backgroundColor: "white", borderColor: "#e0e3e6", width: 110 }}
              title="Horário"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 rounded-xl text-white font-medium text-xs cursor-pointer"
              style={{ background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)" }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAdding(false); setNewAmount(""); }}
              className="px-4 py-2 rounded-xl font-medium text-xs cursor-pointer"
              style={{ color: "#5B6572", backgroundColor: "#eceef1" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full mb-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-[#f7f9fc]"
          style={{ borderColor: "#e0e3e6", color: "#3b6377", borderStyle: "dashed" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Adicionar registro manual
        </button>
      )}

      {/* List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {drinks.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: "#71787c" }}>
            Nenhum registro nesse dia.
          </div>
        )}
        {drinks.map((d) => {
          const isEditing = editingId === d.id;
          return (
            <div
              key={d.id}
              className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
              style={{ borderColor: "#eceef1", backgroundColor: isEditing ? "#f7f9fc" : "white" }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "#3b6377" }}>water_drop</span>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="number"
                    autoFocus
                    value={editValue}
                    min={1}
                    max={5000}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(d.id); if (e.key === "Escape") setEditingId(null); }}
                    className="w-28 px-3 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
                    style={{ borderColor: "#e0e3e6" }}
                  />
                ) : (
                  <span className="text-sm font-semibold" style={{ color: "#191c1e" }}>
                    {d.amount_ml}ml
                  </span>
                )}
                <span className="text-xs ml-2" style={{ color: "#71787c" }}>
                  {formatTime(d.logged_at)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(d.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingId(d.id); setEditValue(String(d.amount_ml)); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
    </Modal>
  );
}
