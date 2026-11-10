import { useUniversities } from "../hooks/useUniversities";
import { control } from "../ui";

// Mandatory picker. With no `allowAll`, the empty placeholder is disabled so the
// user must explicitly choose an institution or "None".
export default function UniversitySelect({
  id = "university",
  value,
  onChange,
  allowAll = false,
  noneLabel = "None, I'm not at a university or college",
  className = "",
}) {
  const { list } = useUniversities();
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-required={!allowAll}
      className={`${control} ${!value ? "text-lit-muted" : ""} ${className}`.trim()}
    >
      {allowAll ? (
        <option value="all">All universities &amp; colleges</option>
      ) : (
        <option value="" disabled>
          Select your university or college
        </option>
      )}
      {list.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
      <option value="none">{noneLabel}</option>
    </select>
  );
}
