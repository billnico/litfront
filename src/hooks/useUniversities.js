import { useEffect, useState } from "react";
import { api } from "../api";
import { FALLBACK_UNIVERSITIES, NONE_ID } from "../universities";

let cache = null;
let inflight = null;

export function useUniversities() {
  const [list, setList] = useState(cache ?? FALLBACK_UNIVERSITIES);

  useEffect(() => {
    let alive = true;
    if (!cache) {
      inflight ??= api
        .universities()
        .then((r) => (cache = r.items ?? FALLBACK_UNIVERSITIES))
        .catch(() => (cache = FALLBACK_UNIVERSITIES));
      inflight.then((v) => alive && setList(v));
    }
    return () => {
      alive = false;
    };
  }, []);

  const label = (id, short = false) => {
    if (!id) return "";
    if (id === NONE_ID) return "No university";
    const u = list.find((x) => x.id === id);
    if (!u) return id;
    return short ? u.short_name || u.name : u.name;
  };

  return { list, label };
}
