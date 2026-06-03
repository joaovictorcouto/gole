interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <label className="toggle-switch select-none" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="toggle-track" />
      <div className="toggle-thumb" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
    </label>
  );
}
