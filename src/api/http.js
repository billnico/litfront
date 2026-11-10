import { API_BASE } from "../config";

const KEY = "lit.tokens";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

let tokens = load();
let onAuthLost = () => {};
let refreshing = null;

export const tokenStore = {
  get: () => tokens,
  set(t) {
    tokens = t;
    try {
      if (t) localStorage.setItem(KEY, JSON.stringify(t));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export function setAuthLostHandler(fn) {
  onAuthLost = fn;
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.code = body?.code;
    this.fields = body?.fields || {};
  }
}

function refresh() {
  if (!tokens?.refresh_token) return Promise.reject(new ApiError(401, { message: "Signed out" }));
  refreshing ??= fetch(new URL(`${API_BASE}/auth/refresh`, window.location.origin), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  })
    .then(async (r) => {
      if (!r.ok) throw new ApiError(r.status, await r.json().catch(() => null));
      tokenStore.set(await r.json());
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function http(path, { method = "GET", body, query, auth = true, _retried = false } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth && tokens?.access_token) headers.Authorization = `Bearer ${tokens.access_token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { code: "network", message: "Can't reach the server. Check your connection." });
  }

  if (res.status === 401 && auth && !_retried && tokens?.refresh_token) {
    try {
      await refresh();
    } catch (e) {
      tokenStore.set(null);
      onAuthLost();
      throw e;
    }
    return http(path, { method, body, query, auth, _retried: true });
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
