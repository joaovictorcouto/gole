import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Toggle } from "../components/ui/Toggle";
import { api, Phrase } from "../lib/api";
import { playSound, SOUND_OPTIONS, SoundPreset } from "../lib/sounds";

const ACTIVITY_OPTIONS = [
  { id: "sedentary", label: "🛋️ Quase não me exercito" },
  { id: "light", label: "🚶 Faço atividades leves" },
  { id: "moderate", label: "🏃 Me exercito regularmente" },
  { id: "active", label: "🏋️ Tenho rotina muito ativa" },
];

const CLIMATE_OPTIONS = [
  { id: "cold", label: "❄️ Frio" },
  { id: "temperate", label: "🌤️ Equilibrado" },
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
  { id: "tudo", label: "🎲 Tudo" },
  { id: "profissional", label: "💼 Profissional" },
  { id: "equilibrado", label: "🌤️ Equilibrado" },
  { id: "brincalhao", label: "😄 Brincalhão" },
  { id: "favoritas", label: "⭐ Favoritas" },
  { id: "personalizadas", label: "✏️ Personalizadas" },
];

const filterTabs = [
  { id: "todas", label: "Todas" },
  { id: "profissional", label: "Profissional" },
  { id: "equilibrado", label: "Equilibrado" },
  { id: "brincalhao", label: "Brincalhão" },
  { id: "favoritas", label: "⭐ Favoritas" },
  { id: "personalizadas", label: "✏️ Personalizadas" },
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

const CopoSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#3b6377" strokeWidth="4" strokeLinejoin="round" fill="rgba(191,232,255,0.2)" />
    <path d="M33 35 L37 78 L63 78 L67 35 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const BottleSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
    <rect x="44" y="8" width="12" height="6" rx="1.5" fill="#3b6377" />
    <rect x="46" y="14" width="8" height="10" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
    <path d="M42 12 L58 12 L56 7 L44 7 Z" fill="#3b6377" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M36 20 L64 20 Q68 20 68 24 L66 40 L68 44 L66 48 L68 52 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 52 L34 48 L32 44 L34 40 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M34 40 L66 40 L66 86 Q66 88 64 88 L36 88 Q34 88 34 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

const JugSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
    <rect x="42" y="8" width="16" height="6" fill="#3b6377" />
    <rect x="44" y="14" width="12" height="8" fill="#e0e3e6" stroke="#3b6377" strokeWidth="3" />
    <path d="M26 30 L74 30 Q78 30 78 34 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 34 Q22 30 26 30 Z" stroke="#3b6377" strokeWidth="4" fill="rgba(191,232,255,0.2)" />
    <path d="M78 40 L84 40 L84 62 L78 62" stroke="#3b6377" strokeWidth="4" strokeLinecap="round" />
    <path d="M24 45 L76 45 L76 86 Q76 88 74 88 L26 88 Q24 88 24 86 Z" fill="#5ABEFF" opacity="0.6" />
  </svg>
);

export function Settings() {
  const { settings, saveSettings, loadSettings } = useAppStore();
  const [localGoal, setLocalGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "phrases">("general");

  // Profile draft (auto-save)
  const [draftWeight, setDraftWeight] = useState<string>("");
  const [draftAge, setDraftAge] = useState<string>("");
  const [profileSavedAt, setProfileSavedAt] = useState<number | null>(null);
  const [previewGoal, setPreviewGoal] = useState<number | null>(null);
  const [testingNotif, setTestingNotif] = useState(false);

  // State for phrase manager
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [phraseFilter, setPhraseFilter] = useState("todas");
  const [newPhraseText, setNewPhraseText] = useState("");
  const [editingPhraseId, setEditingPhraseId] = useState<number | null>(null);
  const [editingPhraseText, setEditingPhraseText] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalGoal(settings.daily_goal_ml);
      setDraftWeight(String(settings.weight_kg));
      setDraftAge(String(settings.age_years));
    }
  }, [settings?.weight_kg, settings?.age_years, settings?.daily_goal_ml]);

  // Live preview of goal as user types weight (or changes activity/climate)
  useEffect(() => {
    if (!settings) return;
    const w = Number(draftWeight);
    if (!isNaN(w) && w >= 40 && w <= 150) {
      api.calculateGoal(w, settings.activity_level, settings.climate).then(setPreviewGoal);
    } else {
      setPreviewGoal(null);
    }
  }, [draftWeight, settings?.activity_level, settings?.climate]);

  useEffect(() => {
    if (activeTab === "phrases") {
      loadPhrasesList();
    }
  }, [activeTab]);

  const loadPhrasesList = async () => {
    try {
      const list = await api.getAllPhrases();
      setPhrases(list);
    } catch (err) {
      console.error("Erro ao carregar frases:", err);
    }
  };

  useEffect(() => {
    if (phraseFilter === "todas") {
      setFilteredPhrases(phrases);
    } else if (phraseFilter === "favoritas") {
      setFilteredPhrases(phrases.filter(p => p.favorite));
    } else if (phraseFilter === "personalizadas") {
      setFilteredPhrases(phrases.filter(p => p.is_custom));
    } else {
      setFilteredPhrases(phrases.filter(p => p.category === phraseFilter));
    }
  }, [phrases, phraseFilter]);

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center" style={{ marginLeft: "280px" }}>
        <p style={{ color: "#5B6572" }}>Carregando...</p>
      </div>
    );
  }

  const commitWeight = async () => {
    if (!settings) return;
    const w = Number(draftWeight);
    if (isNaN(w)) { setDraftWeight(String(settings.weight_kg)); return; }
    const weight = Math.min(150, Math.max(40, Math.round(w)));
    setDraftWeight(String(weight));
    if (weight === settings.weight_kg) return;
    await saveSettings({ weight_kg: weight });
    setProfileSavedAt(Date.now());
    setTimeout(() => setProfileSavedAt(null), 2000);
  };

  const commitAge = async () => {
    if (!settings) return;
    const a = Number(draftAge);
    if (isNaN(a)) { setDraftAge(String(settings.age_years)); return; }
    const age = Math.min(100, Math.max(12, Math.round(a)));
    setDraftAge(String(age));
    if (age === settings.age_years) return;
    await saveSettings({ age_years: age });
    setProfileSavedAt(Date.now());
    setTimeout(() => setProfileSavedAt(null), 2000);
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      await api.sendReminder();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setTestingNotif(false), 1500);
    }
  };

  // Phrases CRUD handlers
  const handleAddPhrase = async () => {
    if (!newPhraseText.trim()) return;
    try {
      await api.createCustomPhrase(newPhraseText.trim());
      setNewPhraseText("");
      await loadPhrasesList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: number, favorite: boolean) => {
    try {
      await api.toggleFavoritePhrase(id, favorite);
      await loadPhrasesList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (id: number, text: string) => {
    setEditingPhraseId(id);
    setEditingPhraseText(text);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingPhraseText.trim()) return;
    try {
      await api.updateCustomPhrase(id, editingPhraseText.trim());
      setEditingPhraseId(null);
      await loadPhrasesList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteCustomPhrase(id);
      await loadPhrasesList();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ marginLeft: "280px" }}>
      {/* Fixed header */}
      <header className="px-10 pt-10 pb-0 shrink-0">
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#3b6377", letterSpacing: "-0.04em" }}>
          Configurações
        </h1>
        <p className="text-lg text-gray-500 mb-4">
          Ajuste suas preferências para uma hidratação ideal.
        </p>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
              activeTab === "general" ? "text-[#3b6377]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Configurações Gerais
            {activeTab === "general" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3b6377] rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("phrases")}
            className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer ${
              activeTab === "phrases" ? "text-[#3b6377]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Gerenciamento de Frases
            {activeTab === "phrases" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3b6377] rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-10 py-6">

      {activeTab === "general" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-7">
            <Section title="Perfil e Medidas" icon="person">
              {/* Peso + Idade lado a lado */}
              <div className="grid grid-cols-2 gap-3 py-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Peso (kg)</span>
                  <input
                    type="number"
                    min="40"
                    max="150"
                    value={draftWeight}
                    onChange={(e) => setDraftWeight(e.target.value)}
                    onBlur={commitWeight}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#3b6377]/30"
                    style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "#e0e3e6", color: "#191c1e" }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Idade (anos)</span>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={draftAge}
                    onChange={(e) => setDraftAge(e.target.value)}
                    onBlur={commitAge}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[#3b6377]/30"
                    style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "#e0e3e6", color: "#191c1e" }}
                  />
                </label>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
                <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Meta diária</span>
                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "#3b6377" }}>
                  {localGoal ? `${(localGoal / 1000).toFixed(2).replace(".", ",")}L` : "—"}
                  {previewGoal != null && previewGoal !== localGoal && (
                    <span className="text-xs font-medium" style={{ color: "#0d658c" }}>
                      → {(previewGoal / 1000).toFixed(2).replace(".", ",")}L
                    </span>
                  )}
                  {profileSavedAt && (
                    <span className="text-xs animate-fade-in" style={{ color: "#0d658c" }}>✓</span>
                  )}
                </span>
              </div>

              {/* Atividade — grid 2x2 compacto */}
              <div className="py-3">
                <p className="text-xs font-medium mb-2" style={{ color: "#5B6572" }}>Nível de Atividade</p>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => saveSettings({ activity_level: opt.id })}
                      className="text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer truncate"
                      style={{
                        backgroundColor: settings.activity_level === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.activity_level === opt.id ? "#3b6377" : "#5B6572",
                        fontWeight: settings.activity_level === opt.id ? "600" : "400",
                        border: `1px solid ${settings.activity_level === opt.id ? "#3b6377" : "transparent"}`,
                      }}
                      title={opt.label}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clima */}
              <div className="pt-1 pb-1">
                <p className="text-xs font-medium mb-2" style={{ color: "#5B6572" }}>Clima</p>
                <div className="flex gap-2">
                  {CLIMATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => saveSettings({ climate: opt.id })}
                      className="flex-1 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer"
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
                      className="px-4 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
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

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={handleTestNotification}
                  disabled={testingNotif}
                  className="px-5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer disabled:opacity-50 hover:-translate-y-0.5 flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(191,232,255,0.4)",
                    color: "#3b6377",
                    border: "1px solid #3b6377",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  {testingNotif ? "Enviando..." : "Testar notificação"}
                </button>
                <span className="text-xs" style={{ color: "#71787c" }}>
                  Envia um lembrete agora para testar som e visual.
                </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#eceef1", color: "#71787c" }}>
                    Em breve
                  </span>
                  <Toggle
                    checked={settings.smart_mode}
                    onChange={(v) => saveSettings({ smart_mode: v })}
                  />
                </div>
              </SettingRow>
            </Section>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5">
            <Section title="Recipiente Principal" icon="local_drink">
              <SettingRow label="Habilitar recipiente principal">
                <Toggle
                  checked={settings.recipiente_configurado}
                  onChange={(v) => saveSettings({ recipiente_configurado: v })}
                />
              </SettingRow>
              
              {settings.recipiente_configurado && (
                <div className="py-4 animate-fade-in flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-500 font-semibold">Capacidade do recipiente</span>
                    <div className="flex items-baseline gap-1">
                      <strong className="text-xl" style={{ color: "#3b6377" }}>{settings.recipiente_capacidade_ml}</strong>
                      <span className="text-xs text-gray-400">ml</span>
                    </div>
                  </div>

                  {/* Ilustração dinâmica */}
                  <div className="my-4 h-20 flex items-center justify-center">
                    {(() => {
                      const cap = settings.recipiente_capacidade_ml;
                      if (cap < 350) return <CopoSvg />;
                      if (cap >= 350 && cap < 1200) return <BottleSvg />;
                      if (cap >= 1200 && cap < 1800) return <SportsBottleSvg />;
                      return <JugSvg />;
                    })()}
                  </div>

                  <input
                    type="range"
                    min={200}
                    max={2000}
                    step={50}
                    value={settings.recipiente_capacidade_ml}
                    onChange={(e) => saveSettings({ recipiente_capacidade_ml: Number(e.target.value) })}
                    className="w-full focus:outline-none"
                  />
                  <div className="flex justify-between w-full mt-2 px-1">
                    <span className="text-xs text-gray-400">200ml</span>
                    <span className="text-xs text-gray-400">2000ml</span>
                  </div>
                  <span className="text-xs text-gray-400 block mt-2 text-center italic">
                    Classificação: {
                      settings.recipiente_capacidade_ml < 350
                        ? "Copo pequeno"
                        : settings.recipiente_capacidade_ml < 600
                        ? "Garrafa pequena"
                        : settings.recipiente_capacidade_ml < 900
                        ? "Garrafa média"
                        : settings.recipiente_capacidade_ml < 1200
                        ? "Garrafa grande"
                        : settings.recipiente_capacidade_ml < 1800
                        ? "Garrafa esportiva"
                        : "Garrafão"
                    }
                  </span>
                </div>
              )}
            </Section>

            <Section title="Notificações" icon="campaign">
              <div className="py-4">
                <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Personalidade das notificações</p>
                <div className="space-y-2">
                  {PERSONALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => saveSettings({ notification_personality: opt.id })}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer"
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

            <Section title="Som dos Lembretes" icon="volume_up">
              <div className="py-4">
                <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Alerta sonoro</p>
                <div className="grid grid-cols-3 gap-2">
                  {SOUND_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        saveSettings({ sound_preset: opt.id });
                        if (opt.id !== "none") playSound(opt.id as SoundPreset, settings.sound_volume);
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: settings.sound_preset === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.sound_preset === opt.id ? "#3b6377" : "#5B6572",
                        fontWeight: settings.sound_preset === opt.id ? "600" : "400",
                        border: `1px solid ${settings.sound_preset === opt.id ? "#3b6377" : "transparent"}`,
                      }}
                    >
                      <span className="text-base">{opt.id === "none" ? "🔇" : "🔊"}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {settings.sound_preset !== "none" && (
                <div className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium" style={{ color: "#191c1e" }}>Volume</p>
                    <span className="text-sm font-semibold" style={{ color: "#3b6377" }}>{settings.sound_volume}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={10}
                    value={settings.sound_volume}
                    onChange={(e) => saveSettings({ sound_volume: Number(e.target.value) })}
                    onMouseUp={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      playSound(settings.sound_preset as SoundPreset, v);
                    }}
                    className="w-full focus:outline-none"
                  />
                </div>
              )}
            </Section>
          </div>
        </div>
      ) : (
        /* Frases Management Tab */
        <div className="flex flex-col w-full max-w-4xl bg-white rounded-xl border border-gray-150 overflow-hidden"
             style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.03)", maxHeight: "calc(100vh - 220px)" }}>
          <div className="p-6 pb-0 shrink-0">
            <h2 className="text-2xl font-medium mb-1" style={{ color: "#191c1e", letterSpacing: "-0.01em" }}>
              Frases dos Lembretes
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure suas frases, favoritos ou crie frases personalizadas para aparecerem nas notificações de beber água.
            </p>

            {/* New Custom Phrase Form */}
            <div className="flex gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: "#f7f9fc" }}>
              <input
                type="text"
                placeholder="Escreva uma frase personalizada (ex.: 'Hora da água! 💧')"
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#3b6377]"
                style={{ backgroundColor: "white", borderColor: "#e0e3e6" }}
                onKeyDown={(e) => e.key === "Enter" && handleAddPhrase()}
              />
              <button
                onClick={handleAddPhrase}
                className="px-6 py-2 rounded-xl text-white font-medium text-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{ background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)", boxShadow: "0 4px 10px rgba(59,99,119,0.15)" }}
              >
                Adicionar
              </button>
            </div>

            {/* Sub-tabs for filtering */}
            <div className="flex flex-wrap border-b border-gray-100 gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPhraseFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-t-lg font-semibold text-xs transition-colors cursor-pointer ${
                    phraseFilter === tab.id
                      ? "bg-[#3b6377]/10 text-[#3b6377] border-b-2 border-[#3b6377]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phrase list — scrolls inside the box */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
            {filteredPhrases.map((phrase) => {
              const isEditing = editingPhraseId === phrase.id;
              return (
                <div
                  key={phrase.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-50 transition-colors hover:bg-[#f7f9fc]"
                  style={{ borderColor: "#eceef1" }}
                >
                  <div className="flex-1 mr-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingPhraseText}
                        onChange={(e) => setEditingPhraseText(e.target.value)}
                        className="w-full px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b6377] bg-white text-[#191c1e]"
                        style={{ borderColor: "#e0e3e6" }}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(phrase.id)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "#191c1e" }}>{phrase.text}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor:
                              phrase.category === "profissional"
                                ? "#e3f2fd"
                                : phrase.category === "equilibrado"
                                ? "#e8f5e9"
                                : phrase.category === "brincalhao"
                                ? "#fff3e0"
                                : "#f3e5f5",
                            color:
                              phrase.category === "profissional"
                                ? "#1565c0"
                                : phrase.category === "equilibrado"
                                ? "#2e7d32"
                                : phrase.category === "brincalhao"
                                ? "#e65100"
                                : "#6a1b9a",
                          }}
                        >
                          {phrase.is_custom ? "Personalizada" : phrase.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleFavorite(phrase.id, !phrase.favorite)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        phrase.favorite ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:text-amber-400 hover:bg-gray-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: phrase.favorite ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                      </span>
                    </button>

                    {phrase.is_custom && (
                      <>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(phrase.id)}
                              className="text-emerald-500 hover:bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            </button>
                            <button
                              onClick={() => setEditingPhraseId(null)}
                              className="text-gray-400 hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(phrase.id, phrase.text)}
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(phrase.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredPhrases.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-400 font-medium">
                Nenhuma frase nesta categoria.
              </div>
            )}
          </div>
        </div>
      )}

      </div>{/* end scrollable */}
    </div>
  );
}
