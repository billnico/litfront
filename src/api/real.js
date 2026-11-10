import { http, tokenStore } from "./http";

// Every call here maps 1:1 to an endpoint in API_CONTRACT.md.
export const realApi = {
  auth: {
    async register(payload) {
      const r = await http("/auth/register", { method: "POST", body: payload, auth: false });
      tokenStore.set(r.tokens);
      return r.user;
    },
    async login(email, password) {
      const r = await http("/auth/login", { method: "POST", body: { email, password }, auth: false });
      tokenStore.set(r.tokens);
      return r.user;
    },
    async logout() {
      try {
        await http("/auth/logout", {
          method: "POST",
          body: { refresh_token: tokenStore.get()?.refresh_token },
        });
      } catch {
        /* ignore: we are signing out locally regardless */
      } finally {
        tokenStore.set(null);
      }
    },
  },

  me: {
    get: () => http("/me"),
    update: (patch) => http("/me", { method: "PATCH", body: patch }),
    uploadPhoto(file) {
      const fd = new FormData();
      fd.append("photo", file);
      return http("/me/photo", { method: "PUT", body: fd });
    },
  },

  universities: () => http("/universities", { auth: false }),

  discover: ({ university, cursor, limit } = {}) =>
    http("/discover", { query: { university, cursor, limit } }),

  swipe: (target_id, action) => http("/swipes", { method: "POST", body: { target_id, action } }),

  matches: {
    list: () => http("/matches"),
    unmatch: (id) => http(`/matches/${id}`, { method: "DELETE" }),
    messages: (id, { before, limit = 30 } = {}) =>
      http(`/matches/${id}/messages`, { query: { before, limit } }),
    send: (id, { client_id, text }) =>
      http(`/matches/${id}/messages`, { method: "POST", body: { client_id, text } }),
    markRead: (id, up_to_message_id) =>
      http(`/matches/${id}/read`, { method: "POST", body: { up_to_message_id } }),
  },

  realtime: {
    connectionToken: () => http("/realtime/connection-token"),
    subscriptionToken: (channel) => http("/realtime/subscription-token", { query: { channel } }),
  },

  billing: {
    checkout: () => http("/billing/checkout", { method: "POST", body: {} }),
    verify: (tx_ref) => http("/billing/verify", { method: "POST", body: { tx_ref } }),
  },

  safety: {
    report: (payload) => http("/reports", { method: "POST", body: payload }),
    block: (user_id) => http("/blocks", { method: "POST", body: { user_id } }),
  },
};
