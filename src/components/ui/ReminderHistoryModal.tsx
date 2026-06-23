import { useEffect, useState } from "react";
import { Modal, ModalSecondaryButton } from "./Modal";
import { api, ReminderRow } from "../../lib/api";
import { useIsDev } from "../../lib/useIsDev";
import { listen } from "@tauri-apps/api/event";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatTime(iso: string): string {
  try {
    const parts = iso.split("T");
    if (parts.length === 2) {
      const timeParts = parts[1].split(":");
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
    }
  } catch (e) {}
  return "--:--";
}

export function ReminderHistoryModal({ open, onClose }: Props) {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTime, setNewTime] = useState("12:00");
  const [newConfirmed, setNewConfirmed] = useState(true);
  const [reminderToDelete, setReminderToDelete] = useState<number | null>(null);
  const isDev = useIsDev();

  const load = async () => {
    try {
      const list = await api.getTodayRemindersList();
      setReminders(list);
    } catch (err) {
      console.error("Erro ao carregar lembretes:", err);
    }
  };

  useEffect(() => {
    if (open) {
      void load();
      setAdding(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const unlistenRefresh = listen("refresh_data", () => {
      void load();
    });
    return () => {
      unlistenRefresh.then((fn) => fn());
    };
  }, [open]);

  const handleToggleStatus = async (id: number) => {
    if (!isDev) return;
    try {
      await api.toggleReminderStatus(id);
    } catch (err) {
      console.error("Erro ao alternar status do lembrete:", err);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await api.deleteReminder(id);
      await load();
    } catch (err) {
      console.error("Erro ao excluir lembrete:", err);
    }
  };

  const handleAddReminder = async () => {
    try {
      const today = new Date();
      const [hh, mm] = newTime.split(":");
      const pad = (n: number) => String(n).padStart(2, "0");
      const sentAt = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`;
      
      await api.addCustomReminder(sentAt, newConfirmed);
      setAdding(false);
    } catch (err) {
      console.error("Erro ao adicionar lembrete:", err);
    }
  };

  const confirmedCount = reminders.filter((r) => r.confirmed).length;
  const totalCount = reminders.length;
  const ignoredCount = Math.max(0, totalCount - confirmedCount);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="notifications"
      title="Histórico de Lembretes"
      description={`${totalCount} ${totalCount === 1 ? "lembrete enviado" : "lembretes enviados"} hoje`}
      maxWidth={460}
    >
      <div className="flex justify-between items-center gap-4 mb-4 py-2 border-b" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
        <div className="text-center flex-1">
          <span className="text-[10px] font-bold uppercase text-[#5B6572] tracking-wider">Confirmados</span>
          <div className="text-xl font-bold text-[#257ca3]">{confirmedCount}</div>
        </div>
        <div className="text-center flex-1">
          <span className="text-[10px] font-bold uppercase text-[#5B6572] tracking-wider">Ignorados</span>
          <div className="text-xl font-bold text-red-500">{ignoredCount}</div>
        </div>
      </div>

      {isDev && (
        <div className="mb-4">
          {!adding ? (
            <button
              onClick={() => {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, "0");
                const mm = String(now.getMinutes()).padStart(2, "0");
                setNewTime(`${hh}:${mm}`);
                setNewConfirmed(true);
                setAdding(true);
              }}
              className="w-full py-2 border border-dashed border-[#257ca3]/40 rounded-xl text-xs font-semibold text-[#257ca3] hover:bg-[#257ca3]/5 flex items-center justify-center gap-1.5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Adicionar Lembrete Personalizado
            </button>
          ) : (
            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase text-[#5B6572] tracking-wider">Novo Lembrete (Dev)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Horário</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 bg-white text-[#191c1e]"
                    style={{ borderColor: "#e0e3e6" }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Status</label>
                  <button
                    type="button"
                    onClick={() => setNewConfirmed(!newConfirmed)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 ${
                      newConfirmed 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-orange-50 text-orange-700 border border-orange-200"
                    }`}
                  >
                    {newConfirmed ? "Confirmado" : "Ignorado"}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                  style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)" }}
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {reminders.length === 0 ? (
          <div className="text-center text-sm text-[#5B6572] py-8 italic">
            Nenhum lembrete enviado hoje ainda.
          </div>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              onClick={() => handleToggleStatus(r.id)}
              onKeyDown={(e) => {
                if (isDev && (e.key === " " || e.key === "Enter")) {
                  e.preventDefault();
                  handleToggleStatus(r.id);
                }
              }}
              tabIndex={isDev ? 0 : -1}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                isDev ? "cursor-pointer hover:border-[#257ca3]/50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2" : ""
              }`}
              style={{ borderColor: "rgba(44,52,64,0.08)" }}
              title={isDev ? "Modo Dev: Clique para alternar status" : undefined}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]" style={{ color: r.confirmed ? "#257ca3" : "#71787c" }}>
                  {r.confirmed ? "notifications_active" : "notifications_off"}
                </span>
                <span className="text-sm font-semibold text-[#191c1e]">
                  Alerta das {formatTime(r.sent_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.confirmed ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcedc8", color: "#33691e" }}>
                    Confirmado
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ffe0b2", color: "#bf360c" }}>
                    Ignorado
                  </span>
                )}
                {isDev && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReminderToDelete(r.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#d32f2f] focus:ring-offset-2"
                    title="Excluir lembrete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isDev && (
        <div className="mt-4 p-2 bg-[#bfe8ff]/20 border border-[#bfe8ff]/30 rounded-xl text-center">
          <p className="text-[11px] font-semibold text-[#0f76a0] flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">terminal</span>
            Modo Dev: Clique na linha para alternar status ou use a lixeira para excluir.
          </p>
        </div>
      )}

      {reminderToDelete !== null && (
        <Modal
          open={true}
          onClose={() => setReminderToDelete(null)}
          title="Confirmar Exclusão"
          description="Deseja realmente excluir este lembrete? Esta ação não pode ser desfeita."
          icon="warning"
          iconColor="#bf360c"
          iconBg="#ffe0b2"
          maxWidth={380}
        >
          <div className="flex gap-3 mt-2">
            <ModalSecondaryButton onClick={() => setReminderToDelete(null)}>
              Cancelar
            </ModalSecondaryButton>
            <button
              onClick={async () => {
                const id = reminderToDelete;
                setReminderToDelete(null);
                await handleDeleteReminder(id);
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
