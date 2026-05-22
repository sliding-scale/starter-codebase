# Stripe Setup Guide

Everything you need to do **in Stripe** + **in Convex** to take the billing flow from "code is ready" to "real payments work."

The code is built. This document is the human checklist.

---

## TL;DR

1. Create 3 Products + Prices in Stripe
2. Add 1 Webhook endpoint pointing at Convex
3. Set 3 env vars in Convex + 1 in the web app
4. Run the seed action to link Convex products to Stripe prices
5. Test with Stripe's test cards

That's it — everything else is automatic via webhooks.

---

## 1. Get your API keys

**Stripe Dashboard → Developers → API keys**

You'll need two values:

| Key | Where it goes | Notes |
|-----|---------------|-------|
| **Secret key** (`sk_test_...` / `sk_live_...`) | Convex env: `STRIPE_SECRET_KEY` | Never expose this to the browser |
| **Publishable key** (`pk_test_...` / `pk_live_...`) | Web app `.env.local`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Only needed if you embed Stripe Elements directly. Our flow uses Checkout, so this is optional today but nice to set for forward compatibility |

> **Always start in test mode.** Toggle "View test data" in the dashboard sidebar before doing anything else. Test mode keys begin with `sk_test_` / `pk_test_`.

---

## 2. Create your Products & Prices

**Stripe Dashboard → Product catalog → Add product** (do this 3 times)

For each tier — **Free, Pro, Enterprise** — create:

- **Name**: `Free` / `Pro` / `Enterprise`
- **Pricing model**: Standard pricing
- **Price**: `$0` / `$19` / `$99` (match what's in `convex/stripe/seed.ts`, or update the seed file to match your prices)
- **Billing period**: `Monthly`
- **Currency**: `USD`

After saving, you'll see two IDs per product:

- **Product ID** — `prod_AbcXyz...`
- **Price ID** — `price_AbcXyz...`

**Save all 6 IDs somewhere** — you'll paste them into the seed command (step 6).

> **Why "Free" exists in Stripe even though it's $0:** so a downgrade from Pro → Free can be handled by the same `upgradeSubscription` flow, and so a single `products` table is the only source of truth. If you'd rather not have a Free Stripe product, remove the Free entry from `seed.ts` and let the absence of a subscription represent "Free."

---

## 3. Register the webhook endpoint

**Stripe Dashboard → Developers → Webhooks → Add endpoint**

- **Endpoint URL** — your Convex deployment's `.convex.site` HTTPS URL with `/stripe/webhook`:
  ```
  https://<your-deployment>.convex.site/stripe/webhook
  ```
  Find your deployment URL in the Convex dashboard. It looks like `aware-dog-491.convex.site` (note the `.site` ending — different from the `.cloud` API URL).

- **Description** — anything, e.g. `Convex backend webhook`

- **Events to send** — select exactly these (and nothing else):

  | Event | Purpose |
  |-------|---------|
  | `checkout.session.completed` | First-time checkout — provisions the subscription |
  | `customer.subscription.created` | New subscription created |
  | `customer.subscription.updated` | Plan changes, cancel-at-period-end toggles, period rollovers |
  | `customer.subscription.deleted` | Subscription finally ended |
  | `invoice.created` | New invoice draft |
  | `invoice.finalized` | Invoice locked in |
  | `invoice.updated` | Invoice state changes |
  | `invoice.payment_succeeded` | Payment cleared — restore from grace_period if needed |
  | `invoice.payment_failed` | Payment failed — move user to `grace_period` |

  > Don't pick "Listen to all events" — it'll spam your webhook with noise. The handler will silently drop unknown events anyway, but it's cleaner to be explicit.

- After saving, click the endpoint → **Signing secret** → reveal → copy the `whsec_...` value. This goes into `STRIPE_WEBHOOK_SECRET`.

---

## 4. Configure the Stripe Customer Portal

**Stripe Dashboard → Settings → Billing → Customer portal**

The portal is what our `Manage payment` button opens. Stripe requires you to configure it before you can call `billingPortal.sessions.create`:

- **Functionality** — at minimum enable:
  - ☑ Update payment method
  - ☑ View invoice history
  - ☑ Cancel subscriptions (optional — we handle this in-app too, but it's nice to offer both)
  - ☑ Update billing information
- **Products** — add all three of your products so users can switch plans from the portal (optional but convenient).
- **Business information** — name, support email, terms URL, privacy URL.
- **Save**.

In **test mode** you'll need to repeat this when you flip to **live mode** — they're separate configurations.

---

## 5. Set environment variables

### In the Convex dashboard

**Convex Dashboard → Settings → Environment variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) or `sk_live_...` (prod) | From step 1 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From step 3 |
| `APP_URL` | `http://localhost:3001` (dev) or `https://yourapp.com` (prod) | Used for the Checkout `success_url` and `cancel_url`. **No trailing slash.** |

> **Different deployments = different env vars.** Convex dev and prod deployments each have their own env var stores. Set these on whichever deployment you're using.

### In the web app `.env.local` (optional, for forward compat)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 6. Seed the products table

The `products` table in Convex is the source of truth the frontend reads from. You need to link each row to its corresponding Stripe `price_id`.

From the Convex dashboard → **Functions** → run:

```js
// Function: stripe/seed:seedProducts
{
  "mode": "live",
  "liveProducts": {
    "free":       "prod_xxx_from_step_2",
    "pro":        "prod_xxx_from_step_2",
    "enterprise": "prod_xxx_from_step_2"
  },
  "livePrices": {
    "free":       "price_xxx_from_step_2",
    "pro":        "price_xxx_from_step_2",
    "enterprise": "price_xxx_from_step_2"
  }
}
```

You should get back `{ inserted: 3 }`. The pricing modal will now show your real prices.

> If you change prices in Stripe later (e.g. you create a new `price_xxx` to bump from $19 → $29), re-run this command with the new IDs. Existing subscriptions stay on their original price until they upgrade.

> **No keys yet?** Run `{ "mode": "placeholder" }` instead — it'll seed dummy `price_placeholder_*` IDs so the pricing modal renders. Checkout will fail until real IDs are in place.

---

## 7. Local development webhook testing

Stripe can't reach `http://localhost`, so use the **Stripe CLI** to forward events:

```bash
# Install once (macOS)
brew install stripe/stripe-cli/stripe

# Authenticate
stripe login

# Forward webhooks to your Convex dev deployment
stripe listen --forward-to https://<your-dev-deployment>.convex.site/stripe/webhook
```

The CLI prints a **local webhook signing secret** that starts with `whsec_...`. **Use this value for `STRIPE_WEBHOOK_SECRET` in your Convex dev deployment** — it's different from the production webhook secret.

To trigger test events without making real purchases:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

---

## 8. Testing the end-to-end flow

In test mode, use Stripe's test cards:

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Insufficient funds → fires `invoice.payment_failed` → user moves to `grace_period` |
| `4000 0025 0000 3155` | Triggers 3D Secure authentication |
| `4000 0000 0000 0341` | Attaches successfully but fails on first charge |

Any future expiry (e.g. `12/34`), any 3-digit CVC, any postal code.

**Happy path checklist:**

1. Sign in, hit `/billing` — should show "Free plan"
2. Click **Upgrade** → pricing modal → **Switch to Pro**
3. Stripe Checkout opens → pay with `4242 4242 4242 4242`
4. Redirected to `/billing/success`
5. Spinner shows briefly while the webhook lands
6. ✅ Animation → auto-redirect to `/billing`
7. Billing page shows: status `active`, current plan `Pro`, renew date, "Cancel" + "Manage payment" buttons

**Failure path checklist:**

1. Subscribe with a card that succeeds at first
2. From the Stripe dashboard, manually fail an invoice (or wait for renewal with `4000 0000 0000 9995`)
3. Webhook fires `invoice.payment_failed`
4. Reload `/billing` → red **Payment failed** banner shows with **Update payment** button
5. Click → Customer Portal opens → swap to a working card
6. Webhook fires `invoice.payment_succeeded` → user restored to `active`

**Cancel path checklist:**

1. With an active subscription, click **Cancel subscription**
2. Webhook fires `customer.subscription.updated` with `cancel_at_period_end: true`
3. Yellow **Subscription ending** banner appears, showing "Access until [date]"
4. **Reactivate** undoes it
5. Otherwise, on the period end date, Stripe fires `customer.subscription.deleted` → subscription marked `canceled`, status shows "Free plan" again

---

## 9. Going live

When you're ready to flip to production:

1. **Toggle off** "View test data" in the Stripe dashboard
2. Repeat steps 2–4 with **live** Products, **live** Webhook endpoint, **live** Portal config (test/live are entirely separate)
3. Swap the Convex env vars on your **production** deployment to the live `sk_live_...` and the new live `whsec_...`
4. Set `APP_URL` to your production domain
5. Re-run `stripe/seed:seedProducts` on production with the live price IDs

---

## Architecture cheatsheet

```
Browser  ────► Convex action ────► Stripe API
                   (createCheckoutSession etc.)

Stripe   ────► https://*.convex.site/stripe/webhook
                   │
                   ▼
            handleStripeWebhook (default runtime)
                   │
                   ▼
            processWebhookEvent (node runtime)
                   │  - verifies signature
                   │  - dedupes via processedWebhookEvents table
                   ▼
            internal mutations (upsertSubscription, upsertInvoice, ...)
                   │
                   ▼
            Convex tables  ────► realtime queries  ────► UI updates
```

Stripe is **not** the source of truth for the UI. Convex is. The webhook's job is to keep Convex in sync with Stripe.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `STRIPE_NOT_CONFIGURED` toast when clicking a plan | `STRIPE_SECRET_KEY` not set in the Convex deployment you're hitting |
| Webhook gives `400 Invalid signature` | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint's signing secret. Each endpoint (test, live, CLI-forwarded) has its own secret |
| Webhook fires but billing page doesn't update | Check `processedWebhookEvents` for the event id, then check Convex logs for the action that ran — likely a missing product row (run `seedProducts`) |
| `PRODUCT_NOT_FOUND` error in webhook logs | Stripe sent a `price_id` that isn't in the `products` table. Re-run `seedProducts` with the live IDs |
| Customer Portal call fails with "No configuration provided" | Step 4 — configure the portal in Stripe dashboard for the mode (test/live) you're in |
| `APP_URL_NOT_CONFIGURED` | Set `APP_URL` in the Convex deployment env vars |
| Success page spins forever | Webhook isn't reaching Convex — check the endpoint URL in Stripe matches your deployment's `.convex.site` URL exactly |
