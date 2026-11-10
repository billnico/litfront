import { SUBSCRIPTION_FEE } from "./config";

export function isSubscribed(user) {
  const sub = user?.subscription;
  if (sub?.status !== "active" || !sub.current_period_end) return false;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

export function formatFee(amount = SUBSCRIPTION_FEE.amount, currency = SUBSCRIPTION_FEE.currency) {
  return `${currency} ${Number(amount).toLocaleString("en-MW")}`;
}
