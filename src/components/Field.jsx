import { cloneElement, isValidElement } from "react";
import Icon from "./Icon";
import { control, controlError } from "../ui";

export default function Field({ label, htmlFor, error, hint, children }) {
  const extra = `${control} ${error ? controlError : ""}`;
  const input = isValidElement(children)
    ? cloneElement(children, {
        className: `${extra} ${children.props.className || ""}`.trim(),
      })
    : children;

  return (
    <div className="mb-4 min-w-0 flex-1">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      {input}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600" role="alert">
          <Icon name="alert" size={13} className="shrink-0 text-red-500" /> {error}
        </p>
      )}
    </div>
  );
}
