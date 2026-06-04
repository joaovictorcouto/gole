import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export function UpdateProfileToast() {
  const { settings, updateLastCheckDate } = useAppStore();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!settings || !settings.onboarding_complete) return;

    const lastCheckStr = settings.last_data_check_date;
    if (!lastCheckStr) {
      updateLastCheckDate();
      return;
    }

    const lastCheck = new Date(lastCheckStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastCheck.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Exibe se passaram 60 dias ou mais
    if (diffDays >= 60) {
      setVisible(true);
    }
  }, [settings]);

  if (!visible || !settings) return null;

  const getActivityLabel = (level: string) => {
    switch (level) {
      case "sedentary": return "Sedentário";
      case "light": return "Leve";
      case "moderate": return "Moderado";
      case "active": return "Ativo";
      default: return "Sedentário";
    }
  };

  const getClimateLabel = (climate: string) => {
    switch (climate) {
      case "cold": return "Frio";
      case "temperate": return "Temperado";
      case "hot": return "Quente";
      default: return "Temperado";
    }
  };

  const handleUpdate = async () => {
    await updateLastCheckDate();
    setVisible(false);
    navigate("/settings");
  };

  const handleNoNeed = async () => {
    await updateLastCheckDate();
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slide-in-right"
      style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.08))" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderLeft: "4px solid #257ca3",
        }}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#bfe8ff" }}>
              <span className="material-symbols-outlined" style={{ color: "#257ca3", fontVariationSettings: "'FILL' 1" }}>
                edit_square
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#191c1e" }}>
                📝 Atualização de Perfil
              </p>
              <p className="text-xs" style={{ color: "#5B6572", lineHeight: "1.5" }}>
                Já faz 2 meses desde sua última atualização. Seus dados atuais são:{" "}
                <strong style={{ color: "#191c1e" }}>{settings.weight_kg}kg</strong>,{" "}
                <strong style={{ color: "#191c1e" }}>{settings.age_years} anos</strong>,{" "}
                nível <strong style={{ color: "#191c1e" }}>{getActivityLabel(settings.activity_level)}</strong>{" "}
                e clima <strong style={{ color: "#191c1e" }}>{getClimateLabel(settings.climate)}</strong>.
                Deseja atualizar?
              </p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 py-2.5 rounded-lg text-white text-xs font-semibold transition-all duration-200 hover:shadow-md cursor-pointer"
              style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)" }}
            >
              Atualizar
            </button>
            <button
              onClick={handleNoNeed}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 hover:bg-gray-50 cursor-pointer"
              style={{ color: "#5B6572", borderColor: "#c1c7cc", backgroundColor: "white" }}
            >
              Não precisa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
