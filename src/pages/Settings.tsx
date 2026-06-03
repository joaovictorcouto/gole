import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Toggle } from "../components/ui/Toggle";
import { api } from "../lib/api";

const ACTIVITY_OPTIONS = [
  { id: "sedentary", label: "🛋️ Quase não me exercito" },
  { id: "light", label: "🚶 Faço atividades leves" },
  { id: "moderate", label: "🏃 Me exercito regularmente" },
  { id: "active", label: "🏋️ Tenho rotina muito ativa" },
];

const CLIMATE_OPTIONS = [
  { id: "cold", label: "❄️ Frio" },
  { id: "temperate", label: "🌤️ Temperado" },
  { id: "hot", label: "☀️ Quente" },
];

const INTERVAL_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

const PERSONALITY_OPTIONS = [
  { id: "mixed", label: "🎲 Misturado" },
  { id: "humor", label: "😄 Humor" },
  { id: "geek", label: "🤖 Geek" },
  { id: "escritorio", label: "💼 Escritório" },
  { id: "motivacional", label: "💪 Motivacional" },
  { id: "minimalista", label: "⬜ Minimalista" },
];

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 mb-6 transition-colors duration-300 hover:border-[#006492]/50"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        border: "1px solid white",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}>
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined" style={{ color: "#3b6377", fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        <h2 className="text-2xl font-medium" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0"
      style={{ borderColor: "rgba(44,52,64,0.08)" }}>
      <span className="text-sm font-medium" style={{ color: "#191c1e" }}>{label}</span>
      {children}
    </div>
  );
}

export function Settings() {
  const { settings, saveSettings, loadSettings } = useAppStore();
  const [localGoal, setLocalGoal] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) setLocalGoal(settings.daily_goal_ml);
  }, [settings]);

  if (!settings) {
    return (
      <div className="min-h-screen p-10 flex items-center justify-center" style={{ marginLeft: "280px" }}>
        <p style={{ color: "#5B6572" }}>Carregando...</p>
      </div>
    );
  }

  const handleWeightChange = async (raw: number) => {
    if (isNaN(raw)) return;
    const weight = Math.min(150, Math.max(40, Math.round(raw)));
    await saveSettings({ weight_kg: weight });
    const goal = await api.calculateGoal(weight, settings.activity_level, settings.climate);
    setLocalGoal(goal);
  };

  return (
    <div className="min-h-screen p-10" style={{ marginLeft: "280px" }}>
      <header className="mb-12">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
          Configurações
        </h1>
        <p className="text-lg" style={{ color: "#41484c" }}>
          Ajuste suas preferências para uma hidratação ideal.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-7">
          <Section title="Perfil e Medidas" icon="person">
            <SettingRow label="Peso Corporal">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="40"
                  max="150"
                  value={settings.weight_kg}
                  onChange={(e) => handleWeightChange(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    borderColor: "#e0e3e6",
                    color: "#191c1e",
                  }}
                />
                <span className="text-sm" style={{ color: "#5B6572" }}>kg</span>
              </div>
            </SettingRow>

            <SettingRow label="Meta diária atual">
              <span className="text-sm font-semibold" style={{ color: "#3b6377" }}>
                {localGoal ? `${(localGoal / 1000).toFixed(1)}L` : "—"}
              </span>
            </SettingRow>

            <div className="py-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Nível de Atividade</p>
              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => saveSettings({ activity_level: opt.id })}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{
                      backgroundColor: settings.activity_level === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                      color: settings.activity_level === opt.id ? "#3b6377" : "#5B6572",
                      fontWeight: settings.activity_level === opt.id ? "600" : "400",
                      border: `1px solid ${settings.activity_level === opt.id ? "#3b6377" : "transparent"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="py-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Clima</p>
              <div className="flex gap-2">
                {CLIMATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => saveSettings({ climate: opt.id })}
                    className="flex-1 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                    style={{
                      backgroundColor: settings.climate === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                      color: settings.climate === opt.id ? "#3b6377" : "#5B6572",
                      fontWeight: settings.climate === opt.id ? "600" : "400",
                      border: `1px solid ${settings.climate === opt.id ? "#3b6377" : "transparent"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Lembretes" icon="notifications">
            <div className="py-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Intervalo entre lembretes</p>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => saveSettings({ reminder_interval_min: opt.value })}
                    className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                    style={{
                      backgroundColor: settings.reminder_interval_min === opt.value ? "#3b6377" : "#eceef1",
                      color: settings.reminder_interval_min === opt.value ? "#ffffff" : "#5B6572",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <SettingRow label="Pausar lembretes">
              <Toggle
                checked={settings.reminders_paused}
                onChange={(v) => saveSettings({ reminders_paused: v })}
              />
            </SettingRow>
          </Section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5">
          <Section title="Notificações" icon="campaign">
            <div className="py-4">
              <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Personalidade das notificações</p>
              <div className="space-y-2">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => saveSettings({ notification_personality: opt.id })}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{
                      backgroundColor: settings.notification_personality === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                      color: settings.notification_personality === opt.id ? "#3b6377" : "#5B6572",
                      fontWeight: settings.notification_personality === opt.id ? "600" : "400",
                      border: `1px solid ${settings.notification_personality === opt.id ? "#3b6377" : "transparent"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Sistema" icon="settings">
            <SettingRow label="Iniciar com o sistema">
              <Toggle
                checked={settings.autostart}
                onChange={(v) => saveSettings({ autostart: v })}
              />
            </SettingRow>
            <SettingRow label="Smart Mode">
              <Toggle
                checked={settings.smart_mode}
                onChange={(v) => saveSettings({ smart_mode: v })}
              />
            </SettingRow>
          </Section>
        </div>
      </div>
    </div>
  );
}
