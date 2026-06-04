import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="rocket_launch"
      title={`O que há de novo — Versão ${__APP_VERSION__}`}
      description="Descubra as últimas atualizações e novidades do GOLE."
      maxWidth={500}
    >
      <div className="space-y-4 text-left max-h-[380px] overflow-y-auto pr-1">
        <div>
          <h3 className="text-sm font-bold text-[#257ca3] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Onboarding Interativo & Horários
          </h3>
          <p className="text-xs text-[#5B6572] leading-relaxed">
            Agora a definição do seu período ativo no computador no onboarding é feita através de controles deslizantes (sliders) práticos, eliminando a digitação. Além disso, criamos um card dedicado na tela final de resumo para confirmar o horário ativo de lembretes.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#257ca3] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
            Edição Completa de Registros
          </h3>
          <p className="text-xs text-[#5B6572] leading-relaxed">
            Ao editar um registro no histórico, agora você pode alterar tanto a quantidade de água (ml) quanto o horário exato da ingestão. Tudo sincronizado e salvo no banco de dados.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#257ca3] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">align_horizontal_center</span>
            Histórico Centralizado & Maior
          </h3>
          <p className="text-xs text-[#5B6572] leading-relaxed">
            As garrafas no gráfico de histórico de Estatísticas agora ficam perfeitamente centralizadas com margens simétricas nas laterais. O tamanho das garrafas de 30 e 60 dias aumentou (de 40px para 44px de largura) para melhorar o conforto visual e o clique.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#257ca3] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            Auto-retomada de Lembretes
          </h3>
          <p className="text-xs text-[#5B6572] leading-relaxed">
            Ao pausar seus lembretes, eles serão ativados automaticamente amanhã, evitando que você esqueça de ligá-los novamente. O switch de ativação no painel também recebeu correções para responder de forma imediata ao clique.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#257ca3] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">palette</span>
            Nova Paleta Azul Claro
          </h3>
          <p className="text-xs text-[#5B6572] leading-relaxed">
            Substituímos globalmente o tom de azul anterior por novos tons mais vibrantes e suaves (#257ca3 e #0f76a0) nas janelas, barra de tarefas, tray e cabeçalho, deixando o visual mais moderno.
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2 rounded-xl text-white font-medium text-xs cursor-pointer"
        style={{ background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)" }}
      >
        Entendido!
      </button>
    </Modal>
  );
}
