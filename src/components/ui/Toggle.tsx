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

  return (
    <div
      className="toggle-switch select-none"
      onClick={handleClick}
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <input
        type="checkbox"
        className="toggle-input"
        checked={localChecked}
        readOnly
      />
      <div className="toggle-track" />
      <div
        className="toggle-thumb"
        style={{ transform: localChecked ? "translateX(20px)" : "translateX(0)" }}
      />
    </div>
  );
}
