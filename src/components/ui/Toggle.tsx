import { useEffect, useState } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  // Estado local otimista: muda imediatamente ao clique
  const [localChecked, setLocalChecked] = useState(checked);

  // Sincroniza quando o valor externo muda (ex: após salvar)
  useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  const handleClick = () => {
    if (disabled) return;
    const next = !localChecked;
    setLocalChecked(next);
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="toggle-switch select-none focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2 rounded-full"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <input
        type="checkbox"
        className="toggle-input"
        checked={localChecked}
        readOnly
        tabIndex={-1}
      />
      <div className="toggle-track" />
      <div
        className="toggle-thumb"
        style={{ transform: localChecked ? "translateX(20px)" : "translateX(0)" }}
      />
    </div>
  );
}
