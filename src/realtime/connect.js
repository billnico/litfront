import { Centrifuge } from "centrifuge";
import { CENTRIFUGO_URL, USE_MOCK } from "../config";
import { api } from "../api";
import { mockBus } from "../api/mock";

// One WebSocket, one personal channel per user: `user:{userId}`.
// The client only RECEIVES here. Every write (sending a message, swiping, ...) goes
// through the REST API so the backend can validate it, then the backend publishes
// the result to Centrifugo. Tokens are minted by the backend.
//
// Events delivered on the channel (see API_CONTRACT.md):
//   message.new   { match_id, message }
//   match.new     { match_id }
//   match.removed { match_id }
// Synthetic client-side event: { type: "resync" } when the stream may have gaps.
export function connectRealtime({ userId, onEvent, onStatus }) {
  if (USE_MOCK) {
    onStatus("online");
    const off = mockBus.on(userId, onEvent);
    return { close: off };
  }

  const channel = `user:${userId}`;
  const client = new Centrifuge(CENTRIFUGO_URL, {
    getToken: async () => (await api.realtime.connectionToken()).token,
  });
  const sub = client.newSubscription(channel, {
    getToken: async () => (await api.realtime.subscriptionToken(channel)).token,
  });

  client.on("connecting", () => onStatus("connecting"));
  client.on("connected", () => onStatus("online"));
  client.on("disconnected", () => onStatus("offline"));

  sub.on("publication", (ctx) => {
    if (ctx.data && ctx.data.type) onEvent(ctx.data);
  });

  let first = true;
  sub.on("subscribed", (ctx) => {
    // After a reconnect, if Centrifugo could not recover missed messages, refetch via REST.
    if (!first && !ctx.recovered) onEvent({ type: "resync" });
    first = false;
  });

  sub.subscribe();
  client.connect();

  return {
    close() {
      sub.unsubscribe();
      client.removeSubscription(sub);
      client.disconnect();
    },
  };
}
