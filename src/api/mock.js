// In-memory demo backend. Mirrors the shapes in API_CONTRACT.md so the UI can be
// developed and demoed without a server. Enabled by VITE_USE_MOCK (default on).
import { ApiError, tokenStore } from "./http";
import { FALLBACK_UNIVERSITIES, NONE_ID } from "../universities";
import { uid } from "../utils";
import { SUBSCRIPTION_FEE } from "../config";

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const ME_KEY = "lit.mock.me";
const PAY_KEY = "lit.mock.payments";

function inactiveSubscription() {
  return {
    status: "inactive",
    amount: SUBSCRIPTION_FEE.amount,
    currency: SUBSCRIPTION_FEE.currency,
    current_period_end: null,
    tx_ref: null,
  };
}

// ---- realtime bus (stands in for Centrifugo) -------------------------------
const listeners = new Map();
export const mockBus = {
  on(userId, fn) {
    const set = listeners.get(userId) ?? new Set();
    set.add(fn);
    listeners.set(userId, set);
    return () => set.delete(fn);
  },
  emit(userId, ev) {
    listeners.get(userId)?.forEach((fn) => fn(ev));
  },
};

// ---- seed data -------------------------------------------------------------
const people = [
  { id: "u1", display_name: "Chimwemwe Banda", gender: "female", dob: "2003-04-12", university: "unima", course: "Law", year_of_study: 3, bio: "Moot court by day, Sunday chibuku-free brunch by choice. Looking for someone who argues kindly.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80", likes_me: true },
  { id: "u2", display_name: "Thoko Phiri", gender: "female", dob: "2002-09-30", university: "mzuni", course: "Nursing", year_of_study: 4, bio: "Night shifts taught me patience. Tea > coffee. Ask me about my plant collection.", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80", likes_me: true },
  { id: "u3", display_name: "Kondwani Mwale", gender: "male", dob: "2001-01-22", university: "must", course: "Computer Science", year_of_study: 4, bio: "Building things that (mostly) work. Football on weekends, debugging on weekdays.", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80", likes_me: true },
  { id: "u4", display_name: "Mphatso Chirwa", gender: "male", dob: "2004-06-05", university: "luanar", course: "Agribusiness", year_of_study: 2, bio: "Farm kid turned city student. I'll teach you to roast maize properly.", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u5", display_name: "Yamikani Nyirenda", gender: "female", dob: "2002-12-18", university: "mubas", course: "Architecture", year_of_study: 3, bio: "I sketch buildings and judge yours. Gentle, funny, deadline-averse.", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u6", display_name: "Tadala Kachingwe", gender: "female", dob: "2003-02-27", university: "kuhes", course: "Pharmacy", year_of_study: 2, bio: "Future pharmacist, current coffee dependent. Love road trips to the lake.", avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u7", display_name: "Chikumbutso Tembo", gender: "male", dob: "2000-08-09", university: "none", course: "", year_of_study: null, bio: "Not in school right now - working in Lilongwe and meeting people.", avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u8", display_name: "Limbani Gondwe", gender: "male", dob: "2003-11-14", university: "unilia", course: "Education", year_of_study: 3, bio: "Choir tenor, amateur chef. Will cook nsima for good conversation.", avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u9", display_name: "Ulemu Kamanga", gender: "female", dob: "2002-05-03", university: "unima", course: "Journalism", year_of_study: 4, bio: "Always asking questions. Documentary nights and long walks around Zomba.", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u10", display_name: "Dalitso Chisi", gender: "male", dob: "2002-08-14", university: "mubas", course: "Electrical Engineering", year_of_study: 3, bio: "Soldering circuits, playing chess, and looking for someone to debate sci-fi movies with.", avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u11", display_name: "Chifuniro Phiri", gender: "female", dob: "2003-10-02", university: "cunima", course: "Accountancy", year_of_study: 2, bio: "Coffee enthusiast and podcast addict. Always planning my next trip up Zomba Plateau.", avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80", likes_me: true },
  { id: "u12", display_name: "Wongani Mkandawire", gender: "male", dob: "2001-04-19", university: "mzuni", course: "Fisheries & Aquatic Science", year_of_study: 4, bio: "Love the lake, swimming, and listening to reggae. Easygoing vibe always.", avatar_url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u13", display_name: "Tamanda Mataya", gender: "female", dob: "2004-01-11", university: "daeyang", course: "Information Technology", year_of_study: 1, bio: "First year figuring out university life! Graphic design, photography, and exploring Lilongwe.", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80", likes_me: false },
  { id: "u14", display_name: "Tiwonge Kumwenda", gender: "female", dob: "2002-07-21", university: "must", course: "Biomedical Engineering", year_of_study: 3, bio: "Fascinated by medical tech and good music. Looking for someone genuine and funny.", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80", likes_me: true },
  { id: "u15", display_name: "Madalitso Banda", gender: "male", dob: "2000-12-05", university: "mca", course: "Business Administration", year_of_study: 4, bio: "Final year student. Future entrepreneur. Love outdoor sports and live acoustic sessions.", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80", likes_me: false },
];

const replies = [
  "Hey! Good to meet you 😊",
  "Haha, that's funny. Tell me more?",
  "I'm free this weekend, are you?",
  "Ah okay! What do you do for fun on campus?",
  "That sounds nice. Where's your favourite spot to hang out?",
];

const age = (dob) => Math.floor((Date.now() - new Date(dob)) / 31557600000);
const publicProfile = (p) => ({
  id: p.id,
  display_name: p.display_name,
  age: age(p.dob),
  gender: p.gender,
  university: p.university,
  course: p.course || null,
  year_of_study: p.year_of_study ?? null,
  bio: p.bio || "",
  avatar_url: p.avatar_url || null,
});

const db = { swiped: {}, matches: [], messages: {}, unread: {}, seq: 0 };

function loadMe() {
  try {
    const u = JSON.parse(localStorage.getItem(ME_KEY));
    if (u && u.gender) {
      u.gender = (u.gender === "female" || u.gender === "woman") ? "female" : "male";
    }
    return u;
  } catch {
    return null;
  }
}
function saveMe(me) {
  try {
    localStorage.setItem(ME_KEY, JSON.stringify(me));
  } catch {
    /* ignore */
  }
}
function loadPayments() {
  try {
    return JSON.parse(localStorage.getItem(PAY_KEY)) || {};
  } catch {
    return {};
  }
}
function savePayments(payments) {
  try {
    localStorage.setItem(PAY_KEY, JSON.stringify(payments));
  } catch {
    /* ignore */
  }
}

let me = loadMe();

const requireMe = () => {
  if (!me || !tokenStore.get()) throw new ApiError(401, { code: "unauthorized", message: "Not signed in" });
  return me;
};

function validateUniversity(value, fields) {
  const ok = value === NONE_ID || FALLBACK_UNIVERSITIES.some((u) => u.id === value);
  if (!ok) fields.university = "Choose your university or college, or None if you're not at one.";
}

function toMatch(m) {
  const person = people.find((p) => p.id === m.user_id);
  const msgs = db.messages[m.id] ?? [];
  return {
    id: m.id,
    user: publicProfile(person),
    created_at: m.created_at,
    last_message: msgs[msgs.length - 1] ?? null,
    unread_count: db.unread[m.id] ?? 0,
  };
}

function createMatch(person) {
  const m = { id: `m-${person.id}`, user_id: person.id, created_at: new Date().toISOString() };
  db.matches.push(m);
  db.messages[m.id] = [];
  db.unread[m.id] = 0;
  setTimeout(() => mockBus.emit(me.id, { type: "match.new", match_id: m.id }), 150);
  // They say hi shortly after matching.
  setTimeout(() => pushIncoming(m.id, person.id, "Hi! Looks like we matched 👋"), 2200);
  return m;
}

function pushIncoming(matchId, senderId, text) {
  if (!me || !db.messages[matchId]) return;
  const msg = {
    id: `msg-${++db.seq}`,
    match_id: matchId,
    sender_id: senderId,
    client_id: null,
    text,
    created_at: new Date().toISOString(),
  };
  db.messages[matchId].push(msg);
  db.unread[matchId] = (db.unread[matchId] ?? 0) + 1;
  mockBus.emit(me.id, { type: "message.new", match_id: matchId, message: msg });
}

function startSession(user) {
  me = user;
  saveMe(me);
  tokenStore.set({ access_token: "mock-access", refresh_token: "mock-refresh", expires_in: 900 });
  return me;
}

// ---- api surface -----------------------------------------------------------
export const mockApi = {
  auth: {
    async register(p) {
      await delay();
      const fields = {};
      if (!p.display_name?.trim()) fields.display_name = "Enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(p.email || "")) fields.email = "Enter a valid email.";
      if ((p.password || "").length < 8) fields.password = "Use at least 8 characters.";
      if (!p.date_of_birth || age(p.date_of_birth) < 18) fields.date_of_birth = "You must be 18 or older.";
      const validGenders = ["male", "female", "man", "woman"];
      if (!p.gender || !validGenders.includes(p.gender)) {
        fields.gender = "Gender must be male or female.";
      }
      validateUniversity(p.university, fields);
      if (Object.keys(fields).length) throw new ApiError(422, { code: "validation_error", message: "Please fix the highlighted fields.", fields });
      const normalizedGender = (p.gender === "female" || p.gender === "woman") ? "female" : "male";
      return startSession({
        id: `me-${uid()}`,
        email: p.email,
        display_name: p.display_name.trim(),
        date_of_birth: p.date_of_birth,
        gender: normalizedGender,
        looking_for: p.looking_for,
        university: p.university,
        course: p.university === NONE_ID ? null : p.course || null,
        year_of_study: p.university === NONE_ID ? null : p.year_of_study ?? null,
        bio: p.bio || "",
        avatar_url: null,
        subscription: inactiveSubscription(),
      });
    },
    async login(email) {
      await delay();
      if (me && me.email === email) return startSession(me);
      if (email === "demo@lit.mw") {
        return startSession({
          id: "me-demo",
          email,
          display_name: "Demo User",
          date_of_birth: "2002-03-03",
          gender: "male",
          looking_for: "everyone",
          university: "unima",
          course: "Economics",
          year_of_study: 3,
          bio: "Trying out lit.",
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80",
          subscription: inactiveSubscription(),
        });
      }
      throw new ApiError(401, { code: "invalid_credentials", message: "Incorrect email or password." });
    },
    async logout() {
      tokenStore.set(null);
    },
  },

  me: {
    async get() {
      await delay(100);
      return requireMe();
    },
    async update(patch) {
      await delay();
      requireMe();
      const fields = {};
      if (patch.university !== undefined) validateUniversity(patch.university, fields);
      if (patch.display_name !== undefined && !patch.display_name.trim()) fields.display_name = "Enter your name.";
      if (patch.gender !== undefined) {
        const validGenders = ["male", "female", "man", "woman"];
        if (!validGenders.includes(patch.gender)) {
          fields.gender = "Gender must be male or female.";
        } else {
          patch.gender = (patch.gender === "female" || patch.gender === "woman") ? "female" : "male";
        }
      }
      if (Object.keys(fields).length) throw new ApiError(422, { code: "validation_error", message: "Please fix the highlighted fields.", fields });
      me = { ...me, ...patch };
      if (me.university === NONE_ID) {
        me.course = null;
        me.year_of_study = null;
      }
      saveMe(me);
      return me;
    },
    async uploadPhoto(file) {
      await delay();
      requireMe();
      const url = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      me = { ...me, avatar_url: url };
      saveMe(me);
      return me;
    },
  },

  async universities() {
    await delay(100);
    return { items: FALLBACK_UNIVERSITIES };
  },

  async discover({ university, cursor, limit = 5 } = {}) {
    await delay(150);
    const caller = requireMe();
    const sub = caller.subscription;
    const isSub = sub?.status === "active" && sub?.current_period_end && new Date(sub.current_period_end) > new Date();
    if (!isSub) {
      throw new ApiError(403, { code: "subscription_required", message: "Only subscribed users can discover profiles." });
    }

    // Determine start position in candidate pool from cursor
    let startIdx = 0;
    if (cursor) {
      let targetId = cursor;
      if (typeof cursor === "string" && cursor.startsWith("cur_")) {
        try {
          targetId = atob(cursor.slice(4));
        } catch {
          targetId = cursor.slice(4);
        }
      }
      const foundIdx = people.findIndex((p) => p.id === targetId);
      if (foundIdx >= 0) {
        startIdx = foundIdx + 1;
      }
    }

    // Find remaining unswiped candidates matching filter from startIdx
    const candidates = people.slice(startIdx).filter((p) => {
      if (db.swiped[p.id]) return false;
      if (university && university !== "all" && p.university !== university) return false;
      return true;
    });

    const page = candidates.slice(0, limit);
    const hasMore = candidates.length > limit;
    const lastItem = page[page.length - 1];
    const next_cursor = hasMore && lastItem ? `cur_${btoa(lastItem.id)}` : null;

    return { items: page.map(publicProfile), next_cursor };
  },

  async swipe(target_id, action) {
    await delay(150);
    requireMe();
    const person = people.find((p) => p.id === target_id);
    if (!person) throw new ApiError(404, { code: "not_found", message: "Profile not found." });
    db.swiped[target_id] = action;
    if (action === "like" && person.likes_me && !db.matches.some((m) => m.user_id === target_id)) {
      const m = createMatch(person);
      return { matched: true, match: toMatch(m) };
    }
    return { matched: false, match: null };
  },

  matches: {
    async list() {
      await delay(150);
      requireMe();
      return { items: db.matches.map(toMatch) };
    },
    async unmatch(id) {
      await delay();
      db.matches = db.matches.filter((m) => m.id !== id);
      mockBus.emit(me.id, { type: "match.removed", match_id: id });
      return null;
    },
    async messages(id, { before, limit = 30 } = {}) {
      await delay(150);
      requireMe();
      const arr = db.messages[id];
      if (!arr) throw new ApiError(404, { code: "not_found", message: "Conversation not found." });
      const end = before ? Math.max(0, arr.findIndex((m) => m.id === before)) : arr.length;
      const start = Math.max(0, end - limit);
      return { items: arr.slice(start, end), has_more: start > 0 };
    },
    async send(id, { client_id, text }) {
      await delay(120);
      requireMe();
      const arr = db.messages[id];
      if (!arr) throw new ApiError(403, { code: "not_matched", message: "You can only message your matches." });
      const clean = (text || "").trim();
      if (!clean || clean.length > 2000) throw new ApiError(422, { code: "validation_error", message: "Messages must be 1 to 2000 characters." });
      const existing = arr.find((m) => client_id && m.client_id === client_id);
      if (existing) return existing; // idempotent on client_id
      const msg = { id: `msg-${++db.seq}`, match_id: id, sender_id: me.id, client_id, text: clean, created_at: new Date().toISOString() };
      arr.push(msg);
      // Delivery goes over the realtime channel, like the real backend.
      setTimeout(() => mockBus.emit(me.id, { type: "message.new", match_id: id, message: msg }), 60);
      const match = db.matches.find((m) => m.id === id);
      setTimeout(() => pushIncoming(id, match.user_id, replies[Math.floor(Math.random() * replies.length)]), 1400 + Math.random() * 1200);
      return msg;
    },
    async markRead(id) {
      db.unread[id] = 0;
      return null;
    },
  },

  realtime: {
    async connectionToken() {
      return { token: "mock", expires_at: null };
    },
    async subscriptionToken() {
      return { token: "mock", expires_at: null };
    },
  },

  billing: {
    async checkout() {
      await delay();
      const user = requireMe();
      if (user.subscription?.status === "active" && new Date(user.subscription.current_period_end) > new Date()) {
        throw new ApiError(409, { code: "already_subscribed", message: "You already have an active subscription." });
      }
      const tx_ref = `lit_${uid()}`;
      const payments = loadPayments();
      payments[tx_ref] = { status: "pending", user_id: user.id, amount: SUBSCRIPTION_FEE.amount, currency: SUBSCRIPTION_FEE.currency };
      savePayments(payments);
      return {
        tx_ref,
        amount: SUBSCRIPTION_FEE.amount,
        currency: SUBSCRIPTION_FEE.currency,
        checkout_url: `${window.location.origin}/subscribe/checkout?tx_ref=${encodeURIComponent(tx_ref)}`,
      };
    },
    // Only the local stand-in checkout page calls this. PayChangu sets the status itself.
    async settle(tx_ref, status) {
      await delay(80);
      const user = requireMe();
      const payments = loadPayments();
      const payment = payments[tx_ref];
      if (!payment || payment.user_id !== user.id) {
        throw new ApiError(404, { code: "not_found", message: "Payment not found." });
      }
      payment.status = status === "success" ? "success" : "failed";
      savePayments(payments);
      return { tx_ref, status: payment.status };
    },
    async verify(tx_ref) {
      await delay();
      requireMe();
      const payments = loadPayments();
      const payment = payments[tx_ref];
      if (!payment || payment.user_id !== me.id) {
        throw new ApiError(404, { code: "not_found", message: "Payment not found." });
      }
      const already = me.subscription?.status === "active" && me.subscription?.tx_ref === tx_ref;
      if (!already && payment.status === "success" && payment.amount === SUBSCRIPTION_FEE.amount && payment.currency === SUBSCRIPTION_FEE.currency) {
        const end = new Date();
        end.setDate(end.getDate() + SUBSCRIPTION_FEE.periodDays);
        me = {
          ...me,
          subscription: {
            status: "active",
            amount: SUBSCRIPTION_FEE.amount,
            currency: SUBSCRIPTION_FEE.currency,
            current_period_end: end.toISOString(),
            tx_ref,
          },
        };
        saveMe(me);
      }
      return {
        subscription: me.subscription || inactiveSubscription(),
        payment: { tx_ref, status: payment.status, amount: payment.amount, currency: payment.currency },
      };
    },
  },

  safety: {
    async report() {
      await delay();
      return null;
    },
    async block(user_id) {
      await delay();
      db.matches = db.matches.filter((m) => m.user_id !== user_id);
      return null;
    },
  },
};
