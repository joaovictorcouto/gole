interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <div 
      className="toggle-switch select-none"
      onClick={() => onChange(!checked)}
    >
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        readOnly
      />
      <div className="toggle-track" />
      <div className="toggle-thumb" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
    </div>
  );
}
