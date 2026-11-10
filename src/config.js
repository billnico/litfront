export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
export const CENTRIFUGO_URL =
  import.meta.env.VITE_CENTRIFUGO_URL ?? "ws://localhost:8000/connection/websocket";
// Demo mode is on unless explicitly disabled.
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

// Flat subscription charged through PayChangu standard checkout. The server
// charges this amount; the browser never sends a price of its own.
export const SUBSCRIPTION_FEE = { amount: 500, currency: "MWK", periodDays: 30 };
