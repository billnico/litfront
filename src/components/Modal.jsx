import { useEffect } from "react";
import Icon from "./Icon";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all duration-200"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-[420px] rounded-3xl border border-slate-100 bg-white px-6 pb-6 pt-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="x" size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
