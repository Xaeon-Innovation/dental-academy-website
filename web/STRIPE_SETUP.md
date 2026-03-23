# Stripe setup

Payments for course enrollments use the client's Stripe account.

## Environment variables

Add to **`.env.local`** in the `web/` folder (do not commit secrets). See **`.env.example`** for a template.

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret key (`sk_...`). Server-only (API routes, webhooks). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_...`). Browser (Stripe.js / Elements). |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`). See [Webhooks](#webhooks) below. |

---

## Local sandbox testing (test keys + Stripe CLI)

Use this flow to test payments on `http://localhost:3000` without deploying.

### 1. Stripe Dashboard — Test mode

1. Open [Stripe Dashboard](https://dashboard.stripe.com) and turn on **Test mode** (toggle top right).
2. Go to **Developers → API keys**.
3. Copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
4. Put them in `web/.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

### 2. Stripe CLI — webhooks to localhost

Stripe cannot reach `localhost` from the internet, so use the **Stripe CLI** to forward webhooks.

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run `stripe login`.
2. From a terminal, run (adjust port if your dev server is not on 3000):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. The CLI prints a **webhook signing secret** (`whsec_...`). **Paste that value** into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
4. **Restart** `npm run dev` after changing env vars.
5. Keep the `stripe listen` process running while you test; it forwards `payment_intent.succeeded` / `payment_intent.payment_failed` to your app.

> **Important:** The `whsec_` from `stripe listen` is **only for local CLI forwarding**. It is **not** the same as the secret for your production domain in the Dashboard.

#### Windows: `stripe` is not recognized (PATH)

After installing with **winget**, new terminals sometimes don’t see `stripe` until PATH is reloaded.

1. **Easiest:** Close **Cursor** (or VS Code) completely and reopen it, then open a new terminal and run `stripe --version`.
2. **This session only** — in PowerShell run:
   ```powershell
   $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
   stripe --version
   ```
3. **Without PATH** — from the `web` folder run the helper script:
   ```powershell
   .\scripts\stripe-listen.ps1
   ```
   (Forwards webhooks the same as `stripe listen --forward-to ...`.)

### 3. Run the app

```bash
cd web
npm run dev
```

### 4. Test cards

Use [Stripe test cards](https://stripe.com/docs/testing#cards), e.g. success: **4242 4242 4242 4242**, any future expiry, any CVC.

### 5. Firebase Admin

Local payment flows still need Firebase Admin configured (same as production) so the create-intent route and webhook can verify users and update Firestore. See `FIREBASE_ADMIN_SETUP.md`.

---

## Webhooks (production / Vercel)

For your **live** site (e.g. on Vercel):

1. Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**.
2. **URL:** `https://<your-domain>/api/webhooks/stripe`
3. **Events:** `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Open the endpoint → **Reveal signing secret** → set as `STRIPE_WEBHOOK_SECRET` in **Vercel** project environment variables (Production).

### Payment succeeded in Stripe but the portal still says “Pending payment”

That usually means **`payment_intent.succeeded` never updated Firestore** (wrong URL, wrong `whsec_`, missing env on Vercel, or Firebase Admin failing in that environment).

The app also calls **`POST /api/payments/sync-status`** when you return to **`/portal/dashboard?paid=<registrationId>`** (after pay), after paying in the modal, and once when the dashboard loads for any enrollment that has a `stripePaymentIntentId` but is not yet `paid`. That re-reads the PaymentIntent from Stripe and updates the registration like the webhook.

**Fix production webhooks:** confirm the Dashboard endpoint URL matches your deployed domain and `STRIPE_WEBHOOK_SECRET` is the signing secret for **that** endpoint (not the CLI `whsec_` from local testing).

---

## Switching between test and live

- **Local:** Test keys (`sk_test_` / `pk_test_`) + CLI `whsec_` in `.env.local`.
- **Vercel:** Live keys (`sk_live_` / `pk_live_`) + Dashboard webhook `whsec_` for your production URL.

Never commit real keys; use Vercel env vars for production.
