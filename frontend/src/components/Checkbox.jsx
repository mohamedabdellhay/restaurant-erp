import "./Checkbox.css";

const Checkbox = ({
  checked = false,
  onChange,
  label,
  hint,
  disabled = false,
  id,
  name,
  className = "",
}) => (
  <label className={`ui-check ${className}`.trim()}>
    <input
      id={id}
      name={name}
      className="ui-check-input"
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.checked)}
    />
    <span className="ui-check-track" aria-hidden="true">
      <span className="ui-check-knob" />
    </span>
    {(label || hint) && (
      <span className="ui-check-copy">
        {label ? <span className="ui-check-label">{label}</span> : null}
        {hint ? <span className="ui-check-hint">{hint}</span> : null}
      </span>
    )}
  </label>
);

export default Checkbox;
