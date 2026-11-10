# lit: Backend API Contract

This is what the React frontend expects from the backend. Set `VITE_USE_MOCK=false` and point `VITE_API_BASE_URL` at it.

**Core rule:** every write goes through this REST API so the backend can validate it. The browser never publishes to Centrifugo. Centrifugo is used only to *deliver* events (new messages, new matches) from the backend to clients.

```
Browser ──REST (validate, persist)──▶ Backend ──publish (server API)──▶ Centrifugo ──WebSocket──▶ Browser(s)
```

---

## 1. Conventions

- Base path: `/api/v1`. JSON in, JSON out, UTF-8. IDs are opaque strings.
- Timestamps: ISO 8601 UTC (`2026-11-09T08:30:00Z`). Date of birth: `YYYY-MM-DD`.
- Auth: `Authorization: Bearer <access_token>` on everything except endpoints marked **public**.
- Token pair shape (`tokens`): `{ "access_token": "...", "refresh_token": "...", "expires_in": 900 }`
- Errors use one shape. `fields` is only present for validation errors and is keyed by request field name:

```json
{ "code": "validation_error", "message": "Please fix the highlighted fields.", "fields": { "university": "Choose your university or college, or None if you're not at one." } }
```

| Status | `code` examples | Frontend behaviour |
|---|---|---|
| 401 | `unauthorized`, `invalid_credentials` | One silent `/auth/refresh` + retry; if that fails, log out |
| 403 | `not_matched`, `blocked` | Message shown |
| 404 | `not_found` | Message shown |
| 422 | `validation_error` | `fields` mapped onto form inputs, `message` shown above the form |
| 429 | `rate_limited` | Message shown |

---

## 2. The university rule (enforced server-side)

Every user has a required `university` string.

- It must be either an `id` from `GET /universities`, **or the reserved value `"none"`** (user is not at a university or college).
- `null`, `""`, missing, or any unknown value on **register** or **PATCH /me** → `422` with `fields.university`.
- Never default it. A user must choose.
- When `university == "none"`, ignore/clear `course` and `year_of_study` (store `null`).
- Store as a non-null column with a FK or `CHECK (university = 'none' OR university IN (...))`.
- The frontend also redirects any logged-in user whose `university` is empty to `/profile?complete=1` (covers legacy rows), so backfill existing users with `"none"` or require them to choose.
- `GET /discover?university=<id|none>` filters on the same field.

---

## 3. Endpoints

### 3.1 Reference data

#### `GET /universities` (public)
```json
{ "items": [ { "id": "unima", "name": "University of Malawi (UNIMA)", "short_name": "UNIMA" } ] }
```
Do **not** include `none` in this list; the frontend always appends it. The backend list is the source of truth. The frontend ships a fallback list only for offline/demo use, so check it against the institutions you want to support.

### 3.2 Auth

#### `POST /auth/register` (public)
```json
{
  "display_name": "Chimwemwe Banda",
  "email": "c@example.com",
  "password": "min 8 chars",
  "date_of_birth": "2003-04-12",
  "gender": "female",
  "looking_for": "everyone",
  "university": "unima",
  "course": "Law",
  "year_of_study": 3,
  "bio": "optional, max 300"
}
```
| Field | Rule |
|---|---|
| `display_name` | 2–40 chars |
| `email` | valid, unique (case-insensitive) |
| `password` | ≥ 8 chars |
| `date_of_birth` | **age ≥ 18** |
| `gender` | `male` \| `female` |
| `looking_for` | `men` \| `women` \| `everyone` |
| `university` | **required**, see §2 |
| `course` | optional, ≤ 60; `null` if `university == "none"` |
| `year_of_study` | optional, 1–6; `null` if `university == "none"` |
| `bio` | optional, ≤ 300 |

→ `201` `{ "user": User, "tokens": Tokens }`. Duplicate email → `422` with `fields.email`.

#### `POST /auth/login` (public)
`{ "email": "...", "password": "..." }` → `200` `{ "user": User, "tokens": Tokens }`. Bad credentials → `401 invalid_credentials`.

#### `POST /auth/refresh` (public)
`{ "refresh_token": "..." }` → `200` `Tokens` (rotate the refresh token). Invalid/expired → `401`.

#### `POST /auth/logout`
`{ "refresh_token": "..." }` → `204`. Revokes the refresh token.

### 3.3 Current user

#### `GET /me` → `User`
```json
{
  "id": "u_123", "email": "c@example.com", "display_name": "Chimwemwe Banda",
  "date_of_birth": "2003-04-12", "gender": "female", "looking_for": "everyone",
  "university": "unima", "course": "Law", "year_of_study": 3,
  "bio": "…", "avatar_url": "https://…/photo.jpg",
  "subscription": {
    "status": "inactive",
    "amount": 500,
    "currency": "MWK",
    "current_period_end": null,
    "tx_ref": null
  }
}
```

#### `PATCH /me`
Any subset of: `display_name`, `gender`, `bio`, `looking_for`, `university`, `course`, `year_of_study`. Same validation as register; `gender` must be `male` or `female`. If `university` is present it must be valid (§2). → `200` `User`.

#### `PUT /me/photo`
`multipart/form-data`, field `photo` (image; frontend limits to 5 MB). → `200` `User` with new `avatar_url`.

### 3.4 Discovery

#### `GET /discover?university=<id|none>&cursor=<opaque>&limit=10`
**Subscription required:** Only users with an active subscription can discover profiles. If inactive or expired → `403` `{ "code": "subscription_required", "message": "Only subscribed users can discover profiles." }`.

`university` omitted = all. Exclude: the caller, people already swiped on, blocked users either way, and people outside the caller's `looking_for` / who aren't looking for the caller's gender. Never expose email or date of birth of others; send `age`.
```json
{
  "items": [
    { "id": "u_9", "display_name": "Thoko Phiri", "age": 22, "gender": "female",
      "university": "mzuni", "course": "Nursing", "year_of_study": 4,
      "bio": "…", "avatar_url": null }
  ],
  "next_cursor": "opaque-or-null"
}
```

#### `POST /swipes`
`{ "target_id": "u_9", "action": "like" | "pass" }` → `200`
```json
{ "matched": true, "match": Match }   // or { "matched": false, "match": null }
```
Idempotent per `(caller, target)`. If `matched` is true, also publish `match.new` to **both** users (§4.3).

### 3.5 Matches and messaging

A match has exactly one conversation. **`Match.id` is also the conversation id.**

#### `GET /matches` → `{ "items": [Match] }`
Sorted by latest activity desc.
```json
{
  "id": "m_55",
  "user": { "id": "u_9", "display_name": "Thoko Phiri", "age": 22, "gender": "female",
            "university": "mzuni", "course": "Nursing", "year_of_study": 4, "bio": "…", "avatar_url": null },
  "created_at": "2026-11-09T08:00:00Z",
  "last_message": Message | null,
  "unread_count": 2
}
```

#### `DELETE /matches/{matchId}` → `204`
Unmatch. Delete/hide the conversation and publish `match.removed` to both users.

#### `GET /matches/{matchId}/messages?before=<messageId>&limit=30`
Returns the newest `limit` messages (or the `limit` messages older than `before`), **ordered oldest → newest**.
```json
{ "items": [Message], "has_more": true }
```
`403 not_matched` / `404` if the caller isn't a participant.

#### `POST /matches/{matchId}/messages`
```json
{ "client_id": "uuid-generated-by-client", "text": "Hi!" }
```
- `text`: trimmed, 1–2000 chars.
- Caller must be a participant, match must be active, neither side blocked (`403`).
- **Idempotent on `(matchId, client_id)`**: a retry returns the original message, does not create a duplicate, and does not publish twice.
- Persist, then publish `message.new` to Centrifugo (§4.3). → `201` `Message`.
- Rate limit per user (suggest ~30 msgs/min) → `429`.

```json
{ "id": "msg_901", "match_id": "m_55", "sender_id": "u_123", "client_id": "uuid", "text": "Hi!", "created_at": "2026-11-09T08:30:00Z" }
```

#### `POST /matches/{matchId}/read`
`{ "up_to_message_id": "msg_901" }` → `204`. Marks messages from the other user up to that id as read (drives `unread_count`).

### 3.6 Safety

#### `POST /reports`
`{ "user_id": "u_9", "match_id": "m_55", "reason": "harassment" | "fake_profile" | "inappropriate_content" | "underage" | "spam" | "other", "details": "optional, ≤ 500" }` → `204`.

#### `POST /blocks`
`{ "user_id": "u_9" }` → `204`. Removes any match, hides both users from each other, publishes `match.removed`.

### 3.7 Subscription (PayChangu standard checkout)

One plan: **MWK 500** for **30 days**. The browser never talks to PayChangu and never sends an amount. The secret key stays on the server (`PAYCHANGU_SECRET_KEY`; a `sec-test-…` key is test mode, a live key is live mode).

`subscription` on `User` (also returned by the billing endpoints):

| Field | Meaning |
|---|---|
| `status` | `inactive` or `active` |
| `amount` | Always `500` |
| `currency` | Always `MWK` |
| `current_period_end` | ISO 8601 UTC when `active`, otherwise `null` |
| `tx_ref` | Last successful PayChangu reference, or `null` |

`status` is `active` only when `current_period_end` is in the future. A new user starts `inactive`. The frontend does not lock features on this flag; it shows the state on **Subscribe**.

#### `POST /billing/checkout`
No body. Requires auth.

1. If the caller already has an active subscription → `409` `{ "code": "already_subscribed" }`.
2. Create a unique `tx_ref` (for example `lit_` + uuid) and store a pending payment owned by this user: amount `500`, currency `MWK`.
3. Call PayChangu standard checkout. The secret is sent only as `Authorization: Bearer <secret>`.

`POST https://api.paychangu.com/payment`

```json
{
  "amount": "500",
  "currency": "MWK",
  "email": "c@example.com",
  "first_name": "Chimwemwe",
  "last_name": "Banda",
  "callback_url": "https://<frontend-origin>/subscribe/callback",
  "return_url": "https://<frontend-origin>/subscribe/return",
  "tx_ref": "lit_7c2e…",
  "customization": {
    "title": "lit subscription",
    "description": "30 days of lit — MWK 500"
  },
  "meta": { "user_id": "u_123" }
}
```

`callback_url` is where PayChangu sends the browser after a successful charge (it appends `tx_ref`, `transaction_id`, and `status`). `return_url` is where it sends the browser after cancel or repeated failure (`tx_ref` and `status=failed`). Split `display_name` on the first space for `first_name` / `last_name`.

→ `200`

```json
{
  "tx_ref": "lit_7c2e…",
  "amount": 500,
  "currency": "MWK",
  "checkout_url": "https://checkout.paychangu.com/923677185321"
}
```

The frontend assigns `window.location` to `checkout_url`. In demo mode that URL is the local stand-in `/subscribe/checkout` instead of PayChangu.

#### `POST /billing/verify`
`{ "tx_ref": "lit_7c2e…" }` → `200`. Called by `/subscribe/callback` when the browser returns. The `tx_ref` must belong to the caller (`404` otherwise).

Verify server-side before activating anything:

`GET https://api.paychangu.com/verify-payment/{tx_ref}`
`Authorization: Bearer <secret>`

Treat the payment as paid only when PayChangu's `data.status` is `success`, `data.currency` is `MWK`, `data.amount` is `500`, and `data.tx_ref` matches the stored row. Then set `subscription.status` to `active` and `current_period_end` to now + 30 days. Repeating verify for the same successful `tx_ref` is idempotent (do not extend the period twice).

```json
{
  "subscription": {
    "status": "active",
    "amount": 500,
    "currency": "MWK",
    "current_period_end": "2026-12-10T12:00:00Z",
    "tx_ref": "lit_7c2e…"
  },
  "payment": { "tx_ref": "lit_7c2e…", "status": "success", "amount": 500, "currency": "MWK" }
}
```

`payment.status` is `pending`, `success`, or `failed`. A non-success result leaves the subscription unchanged.

#### `POST /billing/webhook` (public, PayChangu → backend)
Optional but recommended. PayChangu notifies this URL as well as redirecting the browser. Do not trust the body alone: verify with `GET /verify-payment/{tx_ref}` using the same rules as above, then activate. Respond `200` quickly. Ignore unknown `tx_ref` values. This endpoint is not called by the frontend.

`/subscribe/return` is display-only. A cancel does not call verify and does not change the subscription.

---

## 4. Realtime (Centrifugo)

### 4.1 Connection

- WebSocket URL from `VITE_CENTRIFUGO_URL`, normally `wss://<host>/connection/websocket`.
- The client uses **centrifuge-js** with token callbacks, so the backend mints all tokens and Centrifugo stays closed to anyone else.

#### `GET /realtime/connection-token` → `{ "token": "<JWT>", "expires_at": "…" }`
Signed with the shared Centrifugo HMAC secret. Claims: `sub` = user id, `exp` (suggest 10 min; the client calls this again automatically on expiry).

#### `GET /realtime/subscription-token?channel=user:u_123` → `{ "token": "<JWT>", "expires_at": "…" }`
Claims: `sub` = user id, `channel` = the requested channel, `exp`. **Only issue it when the channel is `user:{authenticated user id}`**, otherwise `403`.

### 4.2 Channels and Single Connection Architecture

- **Single Connection Architecture**: The web application maintains exactly **one WebSocket connection** to Centrifugo per authenticated session. All real-time communication (matches, incoming direct messages, removals) is received through this single connection.
- **Client Sending via REST**: All texts and mutations are submitted directly to the backend REST API endpoints (`POST /matches/{id}/messages`), validated and persisted server-side, and then broadcast via Centrifugo.
- One personal channel per user: **`user:{userId}`**. The client subscribes to exactly this channel and nothing else. All direct messages and events for the user arrive on this single channel.

### 4.3 Events published by the backend

All publications are JSON with a `type` field. The backend publishes via the Centrifugo **server API** (API key kept only on the backend), **after** the DB write commits (outbox pattern recommended so a crash can't drop an event).

**`message.new`**: publish to **both** the recipient's and the sender's channel. The sender's echo lets the UI reconcile its optimistic bubble (matched by `client_id`) and sync their other devices.
```json
{ "type": "message.new", "match_id": "m_55", "message": { "id": "msg_901", "match_id": "m_55", "sender_id": "u_123", "client_id": "uuid", "text": "Hi!", "created_at": "2026-11-09T08:30:00Z" } }
```

**`match.new`**: to both users when a mutual like happens. The client re-fetches `GET /matches`.
```json
{ "type": "match.new", "match_id": "m_55" }
```

**`match.removed`**: to both users on unmatch or block.
```json
{ "type": "match.removed", "match_id": "m_55" }
```

### 4.4 Centrifugo settings the frontend relies on

- HMAC secret shared with the backend; tokens above signed with it.
- **Client publishing disabled** (default) so only the backend can publish.
- Allowed origins include the frontend origin.
- Enable **history + recovery** for the `user` namespace (e.g. a few hundred messages / 5 min). After a reconnect the client recovers missed publications; if recovery fails it re-fetches via REST (`/matches`, `/matches/{id}/messages`).
- Backend publishes with the server API key; never expose it to the browser.

### 4.5 Delivery guarantees the UI assumes

- At-least-once: duplicates are possible. The client de-duplicates by message `id` and `client_id`.
- Ordering within a conversation is by `created_at` then `id`. Stamp `created_at` on the server.
- REST is the source of truth. Realtime is an accelerator. Anything missed is repaired by the REST endpoints above.

---

## 5. Optional hardening (not required by the frontend)

- Verify students (e.g. university email domain) before showing a verified badge; the current rule only requires *declaring* a university or `none`.
- Moderation queue for `/reports`; auto-hide users after N reports.
- Content limits on photos (type sniffing, EXIF stripping, resizing).
