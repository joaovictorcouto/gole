import { useAppStore } from "../../store/useAppStore";

export function ReminderToast() {
  const { reminderNotif, confirmReminder, setReminderNotif } = useAppStore();

  if (!reminderNotif) return null;

  const handleConfirm = async () => {
    await confirmReminder(reminderNotif.id, reminderNotif.suggested_ml);
  };

  const handleSnooze = () => {
    setReminderNotif(null);
    setTimeout(() => setReminderNotif(reminderNotif), 5 * 60 * 1000);
  };

  return (
    <div
      className="fixed top-6 right-6 z-50 max-w-sm w-full animate-slide-in-right"
      style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.08))" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderLeft: "4px solid #3b6377",
        }}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#bfe8ff" }}>
              <span className="material-symbols-outlined" style={{ color: "#3b6377", fontVariationSettings: "'FILL' 1" }}>
                water_drop
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#191c1e" }}>
                💧 GOLE — Hora de hidratar!
              </p>
              <p className="text-sm" style={{ color: "#5B6572" }}>
                {reminderNotif.phrase}
              </p>
            </div>
            <button
              onClick={() => setReminderNotif(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#71787c" }}>
            Sugestão: {reminderNotif.suggested_ml}ml
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:shadow-md"
              style={{ background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)" }}
            >
              Já bebi ✓
            </button>
            <button
              onClick={handleSnooze}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:bg-gray-50"
              style={{ color: "#5B6572", borderColor: "#c1c7cc" }}
            >
              Daqui 5 min
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
