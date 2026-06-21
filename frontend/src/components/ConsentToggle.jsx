import './ConsentToggle.css';

export default function ConsentToggle({ checked, onChange, disabled = false }) {
  return (
    <label className="consent-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div>
        <span>Allow school summary sharing</span>
        <small>
          When enabled, the school professional can view a de-identified educational summary only.
          No diagnostic labels or raw medical metrics are shared.
        </small>
      </div>
    </label>
  );
}
