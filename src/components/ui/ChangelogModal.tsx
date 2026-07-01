import { Modal } from "./Modal";
import { CHANGELOG } from "../../lib/changelog";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ChangelogModal({ open, onClose }: Props) {
  const latest = CHANGELOG[0];
  const older = CHANGELOG.slice(1);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="rocket_launch"
      title={`O que há de novo — Versão ${__APP_VERSION__}`}
      description={latest?.highlight || "Histórico de atualizações do GOLE."}
      maxWidth={500}
    >
      <div className="space-y-6 text-left max-h-[420px] overflow-y-auto pr-1">
        {latest && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: "var(--color-on-surface, #191c1e)" }}>
                Versão {latest.version}
              </h2>
              <span className="text-[10px] uppercase font-semibold text-outline">
                {formatDate(latest.date)}
              </span>
            </div>
            <div className="space-y-3">
              {latest.entries.map((e, i) => (
                <div key={i}>
                  <h3 className="text-sm font-bold text-primary mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">{e.icon}</span>
                    {e.title}
                  </h3>
                  <p className="text-xs text-text-main leading-relaxed" style={{ color: "var(--color-text-main, #5B6572)" }}>{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {older.length > 0 && (
          <section className="pt-4 border-t" style={{ borderColor: "rgba(44,52,64,0.08)" }}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
              Versões anteriores
            </h2>
            <div className="space-y-5">
              {older.map((v) => (
                <div key={v.version}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold" style={{ color: "var(--color-on-surface, #191c1e)" }}>
                      Versão {v.version}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-outline">
                      {formatDate(v.date)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {v.entries.map((e, i) => (
                      <div key={i}>
                        <h4 className="text-xs font-semibold text-primary mb-0.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">{e.icon}</span>
                          {e.title}
                        </h4>
                        <p className="text-[11px] text-text-main leading-relaxed" style={{ color: "var(--color-text-main, #5B6572)" }}>{e.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        style={{ background: "linear-gradient(180deg, var(--color-primary, #257ca3) 0%, var(--color-secondary, #0f76a0) 100%)" }}
      >
        Entendido!
      </button>
    </Modal>
  );
}
