# boostov.ma redesign v2: app map (step 1)

Scope of the rebuild: UI only. The Supabase schema, RLS, data, API routes (`app/api/**`), auth (`middleware.ts`, `lib/session.ts`, `lib/auth.ts`) and business logic (`lib/db.ts`, `lib/reward-rules.ts`) stay untouched.

## Routes and their data contract

| Route | Who | Reads | Writes |
|---|---|---|---|
| `/` | anyone | nothing | nothing |
| `/s/[slug]` (**NFC target**) | customer | `GET /api/business/:slug` → public business (no merchant token). Optional reward from `?reward=<id>` or `localStorage["cardify:<slug>:rewardId"]` → `GET /api/rewards/:id?business_id=` | `POST /api/rewards/create {business_id, customer_name, customer_phone}`; `localStorage["cardify:<slug>:step"]`, `["cardify:<slug>:rewardId"]`; removes legacy `["cardify:<slug>:reward"]` |
| `/m/[token]` | merchant (secret link) | `GET /api/merchant/data?token=` → `{business, rewards}` | `POST /api/merchant/redeem {token, reward_id}` |
| `/admin/login` | admin | – | `POST /api/admin/login {password}` (sets signed cookie) |
| `/admin` | admin | `GET /api/admin/businesses` (with stats) | `PUT /api/admin/businesses/:id {is_active}`, `DELETE /api/admin/businesses/:id`, `POST /api/admin/logout` |
| `/admin/business/new` | admin | – | `POST /api/admin/assets` (FormData: file, kind, business_id), `POST /api/admin/businesses` |
| `/admin/business/[id]` | admin | `GET /api/admin/businesses/:id` | `POST /api/admin/assets`, `PUT /api/admin/businesses/:id` |
| `/admin/business/[id]/rewards` | admin | `GET /api/admin/businesses/:id`, then `GET /api/merchant/data?token=<merchant_token>` | `PUT /api/admin/rewards/:id/status {status:"USED"}` |

`middleware.ts` protects every `/admin/*` route except `/admin/login`.

## Customer flow (5 steps, order unchanged)

1. Thank you → 2. Google review (opens `google_review_url`) → 3. Share (Web Share API, falls back to copying the link) → 4. Details form (name + phone, client validation) → 5. Reward card (save as PNG).

Only the **step number** and the **reward id** are persisted (localStorage). Rating and sharing are not stored anywhere (no data exists for them), so "rated" and "shared" are UI-only states that reset on reload.

## Every state to design

| Screen | States |
|---|---|
| Customer | loading · business not found / disabled (404) · database not configured (503) · network error · step 1–4 · stars untouched (demo loop) / 1–3 stars / 4–5 stars (celebration) · share done (link copied) · form empty / validation errors / submitting / submit error · card exists and the customer goes back to step 4 (read-only summary, no duplicate card) · reward ACTIVE · reward USED (with `redeemed_at`) · saved reward id no longer valid (falls back to the saved step) |
| Merchant | loading · invalid token · empty list · search with no match · filters · reward detail · confirm redeem · redeeming · redeem error · redeemed |
| Admin | login (idle / error / timeout) · dashboard loading / empty / error / list · business form (new / edit / uploading / upload error / saving / saved) · rewards list loading / empty / error / filters |

**Expired**: the data model has no expiry field (rewards are only `ACTIVE` or `USED`). There is no real "expired" state to show, so none is invented.

## Live data (read-only snapshot, 2026-10-24)

4 businesses (2 active): brand colours `#000000`, `#FF0000`, `#404040`, `#7C3AED`; all have a logo (JPG/PNG) and a banner; business names 4–28 characters; customer names up to 25 characters, including non-Latin (Arabic) names. Every layout must therefore handle black and very saturated brand colours, any banner (some contain text, so it is never covered or cropped hard), any logo shape, long names, and Arabic text (`dir="auto"` and an Arabic-capable font fallback).

## Risks to existing NFC card URLs

1. **Route and slug**: NFC cards point to `https://<production-domain>/s/<slug>`. `app/s/[slug]` stays at the same path and still calls `GET /api/business/:slug` (slug normalisation is server-side and untouched).
2. **Returning customers**: their card is found through `localStorage["cardify:<slug>:rewardId"]` and `?reward=`. These keys and the query parameter are kept exactly.
3. **Inactive businesses** (`quality-ifni1`, `cardify-storage-qa-20260919`) keep showing the "not available" state, as today.
4. **Preview environment**: Vercel preview deployments only work if the Supabase env vars are also set for the *Preview* environment. Otherwise the preview shows "Configuration required".
5. **Preview writes to production data**: if Preview uses the same Supabase project, creating a card or redeeming on the preview URL writes **real** rows. Test those actions on one business you control, or use a test Supabase project for Preview.
6. **Different domain on preview**: localStorage does not carry over between the production domain and the preview domain, so a returning customer's card will not appear on the preview (expected).

## Design direction (step 2): "Gold Lacquer"

Two directions were prototyped on the review and reward screens (`docs/redesign-v2/` screenshots are kept locally):
- **A · Gold Lacquer (chosen)**: near-black lacquer stage lit by the merchant colour (gold light for neutral brands), ivory action sheet, gold metal accents. Poppins ExtraBold/Black italic for display, Plus Jakarta Sans for text, Noto Sans Arabic fallback. Depth: one key light from the top, extruded 3D objects with a contact shadow, 3D press buttons with a physical edge. Motion: directional slides between steps, spring pops for stars, unwrap for the card; transform/opacity only; haptic vibration on star taps (Android).
- **B · Street Poster**: condensed all-caps poster type and sticker stars. Bolder, but long names and Arabic break the condensed type and it reads as a promo, not a reward. Rejected.

Chosen because it matches the supplied ticket card exactly, works for any brand colour including black, and stays readable at 360px.

## Verification (step 4)
Live Supabase reads; every write blocked or mocked in the browser test harness. NFC URLs `/s/quality-ifni`, `/s/alal`, `/s/QUALITY-IFNI` resolve to the right business; `/s/quality-ifni1` (inactive) shows "Business not available".
