import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useIsDev } from "../lib/useIsDev";
import { Toggle } from "../components/ui/Toggle";
import { api, Phrase } from "../lib/api";
import { Modal, ModalSecondaryButton } from "../components/ui/Modal";
import { playSound, SOUND_OPTIONS, SoundPreset } from "../lib/sounds";
import { save, message } from "@tauri-apps/plugin-dialog";

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
        <span className="material-symbols-outlined" style={{ color: "#257ca3", fontVariationSettings: "'FILL' 1" }}>
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
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-copo-sett" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-copo-sett" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M33 30 L37.5 77.5 A 4 4 0 0 0 41.5 81.5 L58.5 81.5 A 4 4 0 0 0 62.5 77.5 L67 30 Z" fill="url(#water-grad-copo-sett)" />
    <ellipse cx="50" cy="30" rx="17" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L38 80 A 4 4 0 0 0 42 84 L58 84 A 4 4 0 0 0 62 80 L70 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-copo-sett)" />
    <ellipse cx="50" cy="20" rx="20" ry="4.5" stroke="#257ca3" strokeWidth="4.5" fill="none" />
    <path d="M35 25 L40 76" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M65 25 L59 76" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const BottleSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-bottle-sett" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-bottle-sett" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="44" y="6" width="12" height="6" rx="1.5" fill="#257ca3" />
    <rect x="46" y="12" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M34.5 38 L34.5 85.5 Q34.5 87.5 37.5 87.5 L62.5 87.5 Q65.5 87.5 65.5 85.5 L65.5 38 Z" fill="url(#water-grad-bottle-sett)" />
    <ellipse cx="50" cy="38" rx="15.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    <path d="M36 24 L64 24 Q68 24 68 28 L68 86 Q68 90 64 90 L36 90 Q32 90 32 86 L32 28 Q32 24 36 24 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-bottle-sett)" />
    <path d="M36 28 L36 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 28 L64 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const SportsBottleSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-sports-sett" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-sports-sett" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <path d="M46 6 Q38 6 38 12 Q38 18 46 18" stroke="#257ca3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M44 8 L56 8 L54 3 L46 3 Z" fill="#257ca3" />
    <rect x="46" y="8" width="8" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    
    <path d="M36.5 40 L36.5 85.5 Q36.5 87.5 38.5 87.5 L61.5 87.5 Q63.5 87.5 63.5 85.5 L63.5 40 Z" fill="url(#water-grad-sports-sett)" />
    <ellipse cx="50" cy="40" rx="13.5" ry="3.5" fill="#BFE8FF" opacity="0.8" />
    
    <rect x="34" y="48" width="32" height="22" rx="2" fill="#257ca3" opacity="0.85" />
    <line x1="38" y1="53" x2="62" y2="53" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="59" x2="62" y2="59" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="65" x2="62" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
    
    <path d="M38 20 L62 20 Q66 20 66 24 L66 86 Q66 90 62 90 L38 90 Q34 90 34 86 L34 24 Q34 20 38 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-sports-sett)" />
    
    <path d="M37.2 28 L37.2 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M62.8 28 L62.8 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const JugSvg = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <defs>
      <linearGradient id="water-grad-jug-sett" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8AD4FF" />
        <stop offset="50%" stopColor="#41AFFF" />
        <stop offset="100%" stopColor="#008BE3" />
      </linearGradient>
      <linearGradient id="glass-grad-jug-sett" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>
    </defs>
    <rect x="42" y="6" width="16" height="6" fill="#257ca3" />
    <rect x="44" y="12" width="12" height="8" fill="#e0e3e6" stroke="#257ca3" strokeWidth="3" />
    <path d="M74 28 Q82 28 82 44 L82 68 Q82 84 74 84" stroke="#257ca3" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M28.5 28 L28.5 85.5 Q28.5 87.5 30.5 87.5 L69.5 87.5 Q71.5 87.5 71.5 85.5 L71.5 28 Z" fill="url(#water-grad-jug-sett)" />
    <ellipse cx="50" cy="28" rx="21.5" ry="4" fill="#BFE8FF" opacity="0.8" />
    <path d="M30 20 L70 20 Q74 20 74 24 L74 86 Q74 90 70 90 L30 90 Q26 90 26 86 L26 24 Q26 20 30 20 Z" stroke="#257ca3" strokeWidth="4.5" strokeLinejoin="round" fill="url(#glass-grad-jug-sett)" />
    <path d="M30 24 L30 84" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
    <path d="M70 24 L70 84" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export function Settings() {
  const navigate = useNavigate();
  const isDev = useIsDev();
  const { settings, saveSettings, loadSettings } = useAppStore();
  const [testingNotif, setTestingNotif] = useState(false);
  const [localGoal, setLocalGoal] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "phrases">("general");

  // Profile draft (auto-save)
  const [draftWeight, setDraftWeight] = useState<string>("");
  const [draftAge, setDraftAge] = useState<string>("");
  const [profileSavedAt, setProfileSavedAt] = useState<number | null>(null);
  const [previewGoal, setPreviewGoal] = useState<number | null>(null);

  // Work hours draft (commit on blur to avoid input glitch while typing)
  const [draftWorkStart, setDraftWorkStart] = useState<string>("");
  const [draftWorkEnd, setDraftWorkEnd] = useState<string>("");

  // Clima Dinâmico
  const [draftWeatherCity, setDraftWeatherCity] = useState<string>("");
  const [draftWeatherApiKey, setDraftWeatherApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showWeatherInfo, setShowWeatherInfo] = useState<boolean>(false);
  const [weatherSavedAt, setWeatherSavedAt] = useState<number | null>(null);

  // State for phrase manager
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [phraseFilter, setPhraseFilter] = useState("todas");
  const [newPhraseText, setNewPhraseText] = useState("");
  const [editingPhraseId, setEditingPhraseId] = useState<number | null>(null);
  const [editingPhraseText, setEditingPhraseText] = useState("");
  const [phraseToDelete, setPhraseToDelete] = useState<number | null>(null);

  const [exportingCsv, setExportingCsv] = useState(false);
  const handleExportCSV = async () => {
    if (exportingCsv) return;
    setExportingCsv(true);
    try {
      const filePath = await save({
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
        defaultPath: "historico_gole.csv",
      });

      if (filePath) {
        await api.exportHistoryCsv(filePath);
        await message("Histórico exportado com sucesso para o caminho selecionado!", {
          title: "Exportação Concluída",
          kind: "info",
        });
      }
    } catch (err: any) {
      console.error("Falha ao exportar CSV:", err);
      await message(`Erro ao exportar histórico: ${err.message || err}`, {
        title: "Falha na Exportação",
        kind: "error",
      });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSaveWeather = async () => {
    if (!settings) return;
    await saveSettings({
      weather_city: draftWeatherCity,
      weather_api_key: draftWeatherApiKey,
    });
    setWeatherSavedAt(Date.now());
    setTimeout(() => setWeatherSavedAt(null), 3000);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalGoal(settings.daily_goal_ml);
      setDraftWeight(String(settings.weight_kg));
      setDraftAge(String(settings.age_years));
      setDraftWorkStart(settings.work_start_hour || "08:00");
      setDraftWorkEnd(settings.work_end_hour || "18:00");
      setDraftWeatherCity(settings.weather_city || "Sinop");
      setDraftWeatherApiKey(settings.weather_api_key || "");
    }
  }, [
    settings?.weight_kg,
    settings?.age_years,
    settings?.daily_goal_ml,
    settings?.work_start_hour,
    settings?.work_end_hour,
    settings?.weather_city,
    settings?.weather_api_key,
  ]);

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
      await api.sendReminder(true);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setTestingNotif(false), 1500);
    }
  };

  const commitWorkStart = async () => {
    if (!settings) return;
    if (!/^\d{2}:\d{2}$/.test(draftWorkStart)) {
      setDraftWorkStart(settings.work_start_hour || "08:00");
      return;
    }
    if (draftWorkStart === settings.work_start_hour) return;
    await saveSettings({ work_start_hour: draftWorkStart });
  };

  const commitWorkEnd = async () => {
    if (!settings) return;
    if (!/^\d{2}:\d{2}$/.test(draftWorkEnd)) {
      setDraftWorkEnd(settings.work_end_hour || "18:00");
      return;
    }
    if (draftWorkEnd === settings.work_end_hour) return;
    await saveSettings({ work_end_hour: draftWorkEnd });
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
        <h1 className="text-5xl font-semibold mb-2" style={{ color: "#257ca3", letterSpacing: "-0.04em" }}>
          Configurações
        </h1>
        <p className="text-lg text-gray-500 mb-4">
          Ajuste suas preferências para uma hidratação ideal.
        </p>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg ${
              activeTab === "general" ? "text-[#257ca3]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Configurações Gerais
            {activeTab === "general" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#257ca3] rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("phrases")}
            className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg ${
              activeTab === "phrases" ? "text-[#257ca3]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Gerenciamento de Frases
            {activeTab === "phrases" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#257ca3] rounded-full" />
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
            
            {/* Modo do Aplicativo */}
            <Section title="Modo do Aplicativo" icon="dashboard">
              <div className="py-2">
                <p className="text-xs font-medium mb-3" style={{ color: "#5B6572" }}>
                  Selecione a modalidade de uso do Gole:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => saveSettings({ app_mode: "basic" })}
                    className="p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                    style={{
                      backgroundColor: settings.app_mode === "basic" ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.5)",
                      borderColor: settings.app_mode === "basic" ? "#257ca3" : "rgba(44,52,64,0.08)",
                      boxShadow: settings.app_mode === "basic" ? "0 4px 12px rgba(37,124,163,0.1)" : "none",
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px]" style={{ color: settings.app_mode === "basic" ? "#257ca3" : "#5B6572" }}>
                      notifications_active
                    </span>
                    <span className="text-xs font-bold" style={{ color: settings.app_mode === "basic" ? "#257ca3" : "#191c1e" }}>
                      Básico
                    </span>
                    <span className="text-[9px] text-[#5B6572] leading-relaxed">
                      Apenas lembretes por tempo
                    </span>
                  </button>

                  <button
                    onClick={() => saveSettings({ app_mode: "pro" })}
                    className="p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                    style={{
                      backgroundColor: settings.app_mode === "pro" ? "rgba(191,232,255,0.4)" : "rgba(255,255,255,0.5)",
                      borderColor: settings.app_mode === "pro" ? "#257ca3" : "rgba(44,52,64,0.08)",
                      boxShadow: settings.app_mode === "pro" ? "0 4px 12px rgba(37,124,163,0.1)" : "none",
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px]" style={{ color: settings.app_mode === "pro" ? "#257ca3" : "#5B6572" }}>
                      water_drop
                    </span>
                    <span className="text-xs font-bold" style={{ color: settings.app_mode === "pro" ? "#257ca3" : "#191c1e" }}>
                      Completo
                    </span>
                    <span className="text-[9px] text-[#5B6572] leading-relaxed">
                      Metas, estatísticas e conquistas
                    </span>
                  </button>
                </div>
              </div>
            </Section>

            {settings.app_mode !== "basic" && (
              <Section title="Perfil e Medidas" icon="person">
              {/* Peso + Idade — sliders */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Peso</span>
                    <span className="text-sm font-bold" style={{ color: "#257ca3" }}>{draftWeight || "—"} <span className="text-[10px] text-gray-400 font-medium">kg</span></span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={150}
                    value={Math.min(150, Math.max(40, Number(draftWeight) || 70))}
                    onChange={(e) => setDraftWeight(e.target.value)}
                    onMouseUp={commitWeight}
                    onTouchEnd={commitWeight}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg mt-1"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] font-bold text-gray-400">40kg</span>
                    <span className="text-[10px] font-bold text-gray-400">150kg</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Idade</span>
                    <span className="text-sm font-bold" style={{ color: "#257ca3" }}>{draftAge || "—"} <span className="text-[10px] text-gray-400 font-medium">anos</span></span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={100}
                    value={Math.min(100, Math.max(12, Number(draftAge) || 25))}
                    onChange={(e) => setDraftAge(e.target.value)}
                    onMouseUp={commitAge}
                    onTouchEnd={commitAge}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg mt-1"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[10px] font-bold text-gray-400">12</span>
                    <span className="text-[10px] font-bold text-gray-400">100</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
                <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Meta diária</span>
                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "#257ca3" }}>
                  {localGoal ? `${(localGoal / 1000).toFixed(2).replace(".", ",")}L` : "—"}
                  {previewGoal != null && previewGoal !== localGoal && (
                    <span className="text-xs font-medium" style={{ color: "#0f76a0" }}>
                      → {(previewGoal / 1000).toFixed(2).replace(".", ",")}L
                    </span>
                  )}
                  {profileSavedAt && (
                    <span className="text-xs animate-fade-in" style={{ color: "#0f76a0" }}>✓</span>
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
                      className="text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer truncate focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: settings.activity_level === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.activity_level === opt.id ? "#257ca3" : "#5B6572",
                        fontWeight: settings.activity_level === opt.id ? "600" : "400",
                        border: `1px solid ${settings.activity_level === opt.id ? "#257ca3" : "transparent"}`,
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
                      className="flex-1 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: settings.climate === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.climate === opt.id ? "#257ca3" : "#5B6572",
                        fontWeight: settings.climate === opt.id ? "600" : "400",
                        border: `1px solid ${settings.climate === opt.id ? "#257ca3" : "transparent"}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
            )}

            <Section title="Lembretes" icon="notifications">
              <div className="py-4">
                <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Intervalo entre lembretes</p>
                <div className="flex flex-wrap gap-2">
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => saveSettings({ reminder_interval_min: opt.value })}
                      className="px-4 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: settings.reminder_interval_min === opt.value ? "#257ca3" : "#eceef1",
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
              {settings.reminders_paused && (
                <p className="text-[11px] text-[#5B6572] mt-0.5 mb-3 animate-fade-in italic">
                  ℹ️ Os lembretes serão reativados automaticamente no início de amanhã.
                </p>
              )}

              <SettingRow label="Período de atividade no PC">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={draftWorkStart}
                    onChange={(e) => setDraftWorkStart(e.target.value)}
                    onBlur={commitWorkStart}
                    className="px-2 py-1 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 bg-white text-[#191c1e]"
                    style={{ borderColor: "#e0e3e6" }}
                  />
                  <span className="text-xs text-gray-400 font-medium">às</span>
                  <input
                    type="time"
                    value={draftWorkEnd}
                    onChange={(e) => setDraftWorkEnd(e.target.value)}
                    onBlur={commitWorkEnd}
                    className="px-2 py-1 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 bg-white text-[#191c1e]"
                    style={{ borderColor: "#e0e3e6" }}
                  />
                </div>
              </SettingRow>
            </Section>

            {settings.app_mode !== "basic" && (
              <Section title="Tamanho do Gole" icon="water_drop">
                <div className="py-2">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-medium" style={{ color: "#5B6572" }}>Volume por gole</span>
                    <span className="text-sm font-bold" style={{ color: "#257ca3" }}>{settings.sip_ml || 20} <span className="text-[10px] text-gray-400 font-medium">ml</span></span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={30}
                    step={5}
                    value={settings.sip_ml || 20}
                    onChange={(e) => saveSettings({ sip_ml: Number(e.target.value) })}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg"
                  />
                  <div className="flex justify-between px-1 mt-1">
                    {[15, 20, 25, 30].map((v) => (
                      <span
                        key={v}
                        className="text-[10px] font-bold"
                        style={{ color: settings.sip_ml === v ? "#257ca3" : "#9aa0a6" }}
                      >
                        {v}ml
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 italic">
                    Padrão: 20ml. Usado para calcular quantos goles você deve dar por lembrete.
                  </p>
                </div>
              </Section>
            )}

            {isDev && (
              <Section title="Módulo de Testes (Dev)" icon="bug_report">
                <div className="py-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestNotification}
                      disabled={testingNotif}
                      className="px-5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer disabled:opacity-50 hover:-translate-y-0.5 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: "rgba(191,232,255,0.4)",
                        color: "#257ca3",
                        border: "1px solid #257ca3",
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                      {testingNotif ? "Enviando..." : "Disparar notificação"}
                    </button>
                    <span className="text-xs" style={{ color: "#71787c" }}>
                      Forçar lembrete agora.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        await saveSettings({ onboarding_complete: false });
                        navigate("/onboarding");
                      }}
                      className="px-5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer hover:-translate-y-0.5 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: "rgba(191,232,255,0.4)",
                        color: "#257ca3",
                        border: "1px solid #257ca3",
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      Testar Onboarding
                    </button>
                    <span className="text-xs" style={{ color: "#71787c" }}>
                      Abre tela de introdução.
                    </span>
                  </div>

                </div>
              </Section>
            )}

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
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </SettingRow>
            </Section>

          </div>

          {/* Right column */}
          <div className="lg:col-span-5">
            {settings.app_mode !== "basic" && (
              <Section title="Recipiente Principal" icon="local_drink">
                <SettingRow label="Habilitar recipiente principal">
                  <Toggle
                    checked={settings.recipiente_configurado}
                    onChange={(v) => saveSettings({ recipiente_configurado: v })}
                  />
                </SettingRow>

                {settings.recipiente_configurado ? (
                  <div className="py-4 animate-fade-in flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-500 font-semibold">Capacidade do recipiente</span>
                      <div className="flex items-baseline gap-1">
                        <strong className="text-xl" style={{ color: "#257ca3" }}>{settings.recipiente_capacidade_ml}</strong>
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
                      className="w-full focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg"
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
                ) : (
                  /* Estado visual quando o recipiente está desativado */
                  <div className="py-5 flex flex-col items-center gap-3 animate-fade-in">
                    <div className="opacity-25 grayscale">
                      <BottleSvg />
                    </div>
                    <p className="text-xs text-center font-medium" style={{ color: "#9aa0a6" }}>
                      Sem recipiente configurado
                    </p>
                    <p className="text-[11px] text-center" style={{ color: "#b0b8c1" }}>
                      Os registros serão feitos em ml por dose calculada automaticamente.
                    </p>
                  </div>
                )}
              </Section>
            )}

            <Section title="Notificações" icon="campaign">
              <div className="py-4">
                <p className="text-sm font-medium mb-3" style={{ color: "#191c1e" }}>Personalidade das notificações</p>
                <div className="space-y-2">
                  {PERSONALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => saveSettings({ notification_personality: opt.id })}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: settings.notification_personality === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.notification_personality === opt.id ? "#257ca3" : "#5B6572",
                        fontWeight: settings.notification_personality === opt.id ? "600" : "400",
                        border: `1px solid ${settings.notification_personality === opt.id ? "#257ca3" : "transparent"}`,
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
                      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                      style={{
                        backgroundColor: settings.sound_preset === opt.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                        color: settings.sound_preset === opt.id ? "#257ca3" : "#5B6572",
                        fontWeight: settings.sound_preset === opt.id ? "600" : "400",
                        border: `1px solid ${settings.sound_preset === opt.id ? "#257ca3" : "transparent"}`,
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
                    <span className="text-sm font-semibold" style={{ color: "#257ca3" }}>{settings.sound_volume}%</span>
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
                    className="w-full focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-lg"
                  />
                </div>
              )}
            </Section>

            <Section title="Integração & Automação" icon="sync_alt">
              <div className="py-4 border-b" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#191c1e" }}>Exportar Dados</h3>
                <p className="text-xs mb-3" style={{ color: "#71787c" }}>
                  Gere uma cópia limpa do seu histórico de consumo de água no formato CSV.
                </p>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCsv}
                  className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer hover:-translate-y-0.5 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                  style={{
                    backgroundColor: exportingCsv ? "#71787c" : "#257ca3",
                    color: "white",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(37,124,163,0.25)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {exportingCsv ? "hourglass_empty" : "download"}
                  </span>
                  {exportingCsv ? "Exportando..." : "Exportar Histórico (CSV)"}
                </button>
              </div>

              <div className="py-4">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#191c1e" }}>Servidor de Automação (n8n)</h3>
                <p className="text-xs mb-3" style={{ color: "#71787c" }}>
                  O GOLE roda um micro-servidor local silencioso na porta <strong className="text-[#257ca3]">4000</strong>. Use esta integração para conectar balanças inteligentes, bots do Telegram ou fluxos no n8n.
                </p>
                <div className="rounded-lg p-3 text-xs font-mono" style={{ backgroundColor: "#eceef1", color: "#3a4146" }}>
                  <p className="font-semibold text-[#006492] mb-1">POST http://127.0.0.1:4000/api/water</p>
                  <p className="text-gray-500">// Payload (JSON):</p>
                  <p>{"{"}</p>
                  <p className="pl-4">"ml": 250</p>
                  <p>{"}"}</p>
                </div>
              </div>

              {settings.app_mode === "pro" && (
                <div className="py-4 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: "#191c1e" }}>Clima Dinâmico (OpenWeather)</h3>
                      <div className="relative flex items-center">
                        <button
                          onClick={() => setShowWeatherInfo(!showWeatherInfo)}
                          className="text-gray-400 hover:text-[#257ca3] transition-colors cursor-pointer flex items-center"
                          title="Saiba como funciona"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">info</span>
                        </button>
                        
                        {showWeatherInfo && (
                          <div className="absolute left-6 top-0 z-50 w-72 p-4 rounded-xl shadow-2xl border text-xs leading-relaxed animate-fade-in"
                            style={{
                              background: "rgba(255, 255, 255, 0.95)",
                              backdropFilter: "blur(20px)",
                              borderColor: "rgba(44, 52, 64, 0.1)",
                              color: "#5B6572"
                            }}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-[#191c1e]">🌤️ Como funciona o Clima Dinâmico?</span>
                              <button onClick={() => setShowWeatherInfo(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                            O Gole consulta a previsão climática da sua cidade. Se a previsão indicar temperatura de <strong>35°C ou mais</strong> para o dia, o aplicativo adiciona automaticamente <strong>+500ml</strong> à sua meta diária de hidratação para evitar a desidratação em dias muito quentes.
                            <div className="mt-2 text-[10px] font-semibold text-[#257ca3]">
                              *Exclusivo do Modo Pro.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Toggle
                      checked={settings.weather_enabled}
                      onChange={(v) => saveSettings({ weather_enabled: v })}
                    />
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#71787c" }}>
                    Ajuste automático de meta em dias de calor excessivo usando previsões do OpenWeather.
                  </p>

                  {settings.weather_enabled && (
                    <div className="mt-3 p-4 rounded-xl border flex flex-col gap-3 animate-slide-in-top bg-white"
                      style={{ borderColor: "rgba(44,52,64,0.06)" }}>
                      
                      {/* Cidade */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cidade para Monitorar</label>
                        <input
                          type="text"
                          value={draftWeatherCity}
                          onChange={(e) => setDraftWeatherCity(e.target.value)}
                          placeholder="Ex: Sinop"
                          className="px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#257ca3] bg-white text-[#191c1e]"
                          style={{ borderColor: "#c1c7cc" }}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                          💡 Dica: Para evitar ambiguidades, você pode usar o formato <strong>Cidade,País</strong> (ex: <code>Sinop,BR</code> ou <code>Porto,PT</code>).
                        </p>
                      </div>

                      {/* API Key */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Chave API OpenWeather</label>
                        <div className="relative flex items-center">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={draftWeatherApiKey}
                            onChange={(e) => setDraftWeatherApiKey(e.target.value)}
                            placeholder="Cole sua OpenWeather API Key"
                            className="w-full px-3 py-2 pr-10 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#257ca3] bg-white text-[#191c1e] font-mono"
                            style={{ borderColor: "#c1c7cc" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {showApiKey ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Botão de Salvar */}
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <button
                          onClick={handleSaveWeather}
                          className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all hover:shadow-md cursor-pointer flex items-center gap-1.5"
                          style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)" }}
                        >
                          <span className="material-symbols-outlined text-[14px]">save</span>
                          {weatherSavedAt ? "Salvo!" : "Salvar Clima"}
                        </button>

                        {weatherSavedAt && (
                          <span className="text-[11px] text-green-600 font-semibold animate-fade-in">
                            ✓ Configurações de clima atualizadas
                          </span>
                        )}
                      </div>

                      {/* Instruções */}
                      <div className="mt-2 pt-3 border-t text-[10px] text-gray-500 leading-normal flex flex-col gap-1"
                        style={{ borderColor: "rgba(44,52,64,0.06)" }}>
                        <p className="font-semibold text-gray-700">🎁 Como conseguir a chave de API (Gratuita)?</p>
                        <p>1. Crie uma conta no site oficial do <a href="https://openweathermap.org" target="_blank" rel="noreferrer" className="text-[#257ca3] hover:underline font-semibold">OpenWeatherMap</a>.</p>
                        <p>2. Vá no seu perfil em <strong>"My API Keys"</strong> e copie a chave padrão.</p>
                        <p>3. Cole a chave acima. <em>Nota: Novas chaves podem levar até 1 hora para serem ativadas pela plataforma deles.</em></p>
                        <p className="mt-1 text-[#006492] font-medium">💡 Teste Sem Chave: Deixe o campo da chave vazio e defina a cidade como <strong>Sinop</strong> para simular 36°C imediatamente.</p>
                      </div>

                    </div>
                  )}
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
                className="flex-1 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
                style={{ backgroundColor: "white", borderColor: "#e0e3e6" }}
                onKeyDown={(e) => e.key === "Enter" && handleAddPhrase()}
              />
              <button
                onClick={handleAddPhrase}
                className="px-6 py-2 rounded-xl text-white font-medium text-xs transition-all hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
                style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)", boxShadow: "0 4px 10px rgba(59,99,119,0.15)" }}
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
                  className={`px-3 py-1.5 rounded-t-lg font-semibold text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 ${
                    phraseFilter === tab.id
                      ? "bg-[#257ca3]/10 text-[#257ca3] border-b-2 border-[#257ca3]"
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
                        className="w-full px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1 bg-white text-[#191c1e]"
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
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
                              className="text-emerald-500 hover:bg-emerald-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                            >
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            </button>
                            <button
                              onClick={() => setEditingPhraseId(null)}
                              className="text-gray-400 hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(phrase.id, phrase.text)}
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-1"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => setPhraseToDelete(phrase.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d32f2f] focus:ring-offset-1"
                              title="Excluir frase"
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

      {phraseToDelete !== null && (
        <Modal
          open={true}
          onClose={() => setPhraseToDelete(null)}
          title="Confirmar Exclusão"
          description="Deseja realmente excluir esta frase personalizada? Ela não poderá ser recuperada."
          icon="warning"
          iconColor="#bf360c"
          iconBg="#ffe0b2"
          maxWidth={380}
        >
          <div className="flex gap-3 mt-2">
            <ModalSecondaryButton onClick={() => setPhraseToDelete(null)}>
              Cancelar
            </ModalSecondaryButton>
            <button
              onClick={async () => {
                const id = phraseToDelete;
                setPhraseToDelete(null);
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

      </div>{/* end scrollable */}
    </div>
  );
}
