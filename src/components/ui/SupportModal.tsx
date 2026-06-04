import { useState } from "react";
import { Modal } from "./Modal";
import { openUrl } from "@tauri-apps/plugin-opener";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SUPPORT_EMAIL = "jv.santos.couto@gmail.com";

export function SupportModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar", err);
    }
  };

  const handleSendEmail = async () => {
    try {
      await openUrl(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("[GOLE] Feedback/Suporte")}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="support_agent"
      title="Suporte"
      description="Para sugestões de melhorias ou relatar bugs, envie um e-mail para o desenvolvedor:"
      maxWidth={380}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div 
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all duration-200 hover:bg-[#eceef1]/50 group"
          style={{ borderColor: "#257ca3", backgroundColor: "rgba(59,99,119,0.03)" }}
          title="Clique para copiar"
        >
          <span className="text-sm font-semibold select-all" style={{ color: "#257ca3" }}>
            {SUPPORT_EMAIL}
          </span>
          <span className="material-symbols-outlined text-[18px] text-[#5B6572] group-hover:scale-110 transition-transform">
            {copied ? "done" : "content_copy"}
          </span>
        </div>

        {copied && (
          <span className="text-xs font-semibold animate-fade-in" style={{ color: "#0f76a0" }}>
            E-mail copiado para a área de transferência!
          </span>
        )}

        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: "#eceef1", color: "#5B6572" }}
          >
            Fechar
          </button>
          <button
            onClick={handleSendEmail}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all hover:saturate-150 hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
            style={{
              background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
              boxShadow: "0 4px 12px rgba(59,99,119,0.15)",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            Enviar E-mail
          </button>
        </div>
      </div>
    </Modal>
  );
}
