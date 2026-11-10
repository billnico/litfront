import { useState } from "react";

export default function Avatar({ user, avatar_url, size = 48, className = "" }) {
  const url = avatar_url || (typeof user === "string" ? user : user?.avatar_url || null);
  const [imgError, setImgError] = useState(false);

  const initials = (user?.display_name || (typeof user === "string" ? "" : "?"))
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (url && !imgError) {
    return (
      <img
        className={`block shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white/80 ${className}`}
        style={style}
        src={url}
        alt={user?.display_name || "User avatar"}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[#ff4458] via-[#e11d48] to-[#7c3aed] font-black text-white shadow-sm ring-2 ring-white/80 ${className}`}
      style={style}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}
