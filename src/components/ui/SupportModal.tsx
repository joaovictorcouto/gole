import { useState } from "react";
import { Modal } from "./Modal";
import { openUrl } from "@tauri-apps/plugin-opener";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Kind = "bug" | "suggestion" | "other";

const KINDS: { id: Kind; label: string; emoji: string; description: string }[] = [
  { id: "bug",        emoji: "🐞", label: "Bug",       description: "Algo não funciona como deveria." },
  { id: "suggestion", emoji: "💡", label: "Sugestão",  description: "Ideia de melhoria ou nova feature." },
  { id: "other",      emoji: "💬", label: "Outro",     description: "Comentário, dúvida ou feedback geral." },
];

const SUPPORT_EMAIL = "suporte@gole.app";
const GITHUB_ISSUES_URL = "https://github.com/joaovictorcouto/gole/issues/new";

export function SupportModal({ open, onClose }: Props) {
  const [kind, setKind] = useState<Kind>("suggestion");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentVia, setSentVia] = useState<null | "email" | "github">(null);

  const reset = () => {
    setKind("suggestion");
    setDescription("");
    setEmail("");
    setSentVia(null);
  };

  const buildSubject = () => {
    const prefix = KINDS.find((k) => k.id === kind)?.label ?? "Feedback";
    return `[GOLE] ${prefix}`;
  };

  const buildBody = () => {
    const lines = [
      `Tipo: ${KINDS.find((k) => k.id === kind)?.label}`,
      email ? `Email: ${email}` : null,
      "",
      "Descrição:",
      description,
      "",
      "---",
      "Enviado pelo GOLE app",
    ];
    return lines.filter((l) => l !== null).join("\n");
  };

  const sendByEmail = async () => {
    if (!description.trim()) return;
    setSending(true);
    try {
      const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(buildSubject())}&body=${encodeURIComponent(buildBody())}`;
      await openUrl(url);
      setSentVia("email");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const openOnGithub = async () => {
    if (!description.trim()) return;
    setSending(true);
    try {
      const url = `${GITHUB_ISSUES_URL}?title=${encodeURIComponent(buildSubject())}&body=${encodeURIComponent(buildBody())}`;
      await openUrl(url);
      setSentVia("github");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon="support_agent"
      title="Suporte e Feedback"
      description="Conte o que está acontecendo ou sugira algo. Sua mensagem abre no seu cliente de email ou no GitHub."
      maxWidth={520}
    >
      {sentVia ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
               style={{ backgroundColor: "rgba(191,232,255,0.5)" }}>
            <span className="material-symbols-outlined text-[36px]" style={{ color: "#3b6377" }}>send</span>
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: "#191c1e" }}>
            {sentVia === "email" ? "Email aberto!" : "GitHub aberto!"}
          </p>
          <p className="text-sm mb-6" style={{ color: "#5B6572" }}>
            {sentVia === "email"
              ? "Conclua o envio no seu cliente de email."
              : "Termine de preencher na página do GitHub."}
          </p>
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{ backgroundColor: "#eceef1", color: "#3b6377" }}
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          {/* Type selector */}
          <p className="text-xs font-medium mb-2" style={{ color: "#5B6572" }}>Tipo</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs transition-all cursor-pointer"
                style={{
                  backgroundColor: kind === k.id ? "rgba(191,232,255,0.4)" : "rgba(236,238,241,0.5)",
                  color: kind === k.id ? "#3b6377" : "#5B6572",
                  fontWeight: kind === k.id ? 600 : 400,
                  border: `1px solid ${kind === k.id ? "#3b6377" : "transparent"}`,
                }}
              >
                <span className="text-base">{k.emoji}</span>
                <span>{k.label}</span>
              </button>
            ))}
          </div>

          {/* Description */}
          <label className="block mb-5">
            <span className="text-xs font-medium block mb-2" style={{ color: "#5B6572" }}>Descrição</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                kind === "bug"
                  ? "Descreva o que aconteceu, como reproduzir e o que era esperado..."
                  : kind === "suggestion"
                  ? "Conte sua ideia e por que ela ajudaria você..."
                  : "Compartilhe seu comentário ou dúvida..."
              }
              rows={5}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6377]/30 resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "#e0e3e6", color: "#191c1e" }}
            />
          </label>

          {/* Email */}
          <label className="block mb-5">
            <span className="text-xs font-medium block mb-2" style={{ color: "#5B6572" }}>
              Seu email <span className="font-normal" style={{ color: "#71787c" }}>(opcional, caso queira resposta)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b6377]/30"
              style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "#e0e3e6", color: "#191c1e" }}
            />
          </label>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={sendByEmail}
              disabled={!description.trim() || sending}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(180deg, #3b6377 0%, #0d658c 100%)",
                boxShadow: "0 4px 10px rgba(59,99,119,0.15)",
              }}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Enviar por email
            </button>
            <button
              onClick={openOnGithub}
              disabled={!description.trim() || sending}
              className="w-full py-2.5 rounded-xl font-medium text-sm border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f7f9fc] flex items-center justify-center gap-2"
              style={{ color: "#3b6377", borderColor: "#e0e3e6" }}
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              Abrir como issue no GitHub
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
