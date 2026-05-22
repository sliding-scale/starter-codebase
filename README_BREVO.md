# Brevo Email Setup Guide

How to wire up Brevo (formerly Sendinblue) transactional emails for this app. The infrastructure is in place — this doc tells you what to create in Brevo and how to call the email functions from your code.

---

## TL;DR

1. Create templates in Brevo dashboard (one per email kind below)
2. Set `brevoTemplateId` for each kind in `packages/backend/convex/email/templates.ts`
3. Set `BREVO_API_KEY` in **Convex** env (not Next.js)
4. Call `internal.email.actions.send<Kind>Email` from any action or mutation

---

## Important: where the API key lives

`BREVO_API_KEY` only needs to be set in **Convex env vars** — not in `apps/web/.env.local` or `apps/admin/.env.local`. All email sending happens server-side inside Convex actions; the browser never touches Brevo.

If you've already added it to the Next.js `.env` files, that's harmless (it just won't be read), but you can clean those up. The only place it matters is:

**Convex Dashboard → Settings → Environment variables → `BREVO_API_KEY`**

---

## 1. Get your Brevo API key

**Brevo Dashboard → SMTP & API → API Keys → Generate a new API key**

Copy the v3 API key (long alphanumeric string starting with `xkeysib-...`).

---

## 2. Configure your sender

**Brevo Dashboard → Senders, Domains & Dedicated IPs → Senders → Add a sender**

Brevo requires sender verification before you can send. Either:

- **Verify a single email address** (easiest for development) — they email you a confirmation link
- **Authenticate your domain** (required for production) — add DKIM/SPF DNS records

Two ways to set the sender for your emails:

- **Inside each template** (recommended) — set it once in the template editor; nothing to configure in code
- **Override via env vars** — set `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME` in Convex env to override the template's default sender for every email

---

## 3. Create the 6 templates

**Brevo Dashboard → Campaigns → Templates → New template → Transactional**

Create one template for each of these kinds. Each template's body uses Brevo's `{{params.varName}}` syntax to reference the dynamic data we pass in.

After creating each template, copy its **numeric ID** (shown in the templates list and in the URL when editing).

| Kind                       | What it's for                                                        | Params passed                                                       |
|----------------------------|----------------------------------------------------------------------|---------------------------------------------------------------------|
| **welcome**                | New user just signed up                                              | `name`, `appUrl`                                                    |
| **adminInvited**           | An existing admin invited a new admin                                | `inviterName`, `inviteUrl`                                          |
| **subscriptionActivated**  | Stripe checkout succeeded, user is now on a paid plan                | `name`, `planName`, `amount`, `nextBillingDate`, `manageUrl`        |
| **subscriptionCanceled**   | User canceled — still has access until period end                    | `name`, `planName`, `accessUntilDate`, `reactivateUrl`              |
| **paymentFailed**          | Recurring charge failed — user moved to grace period                 | `name`, `planName`, `updatePaymentUrl`                              |
| **passwordChanged**        | Security notice: password just changed                               | `name`, `url`                                                       |

Inside each Brevo template body, use the variables like this:

```html
<p>Hi {{params.name}},</p>
<p>Welcome to the app! You can sign in at <a href="{{params.appUrl}}">{{params.appUrl}}</a>.</p>
```

> **Don't change the param names** — they must match exactly what the backend sends, or the placeholders will render blank. The list of param names per template lives in `packages/backend/convex/email/templates.ts`, which is the source of truth.

---

## 4. Wire template ids in code

Open `packages/backend/convex/email/templates.ts` and set `brevoTemplateId` for each email you use. Copy the numeric id from **Brevo → Campaigns → Templates**.

```ts
passwordChanged: {
  brevoTemplateId: 12, // ← your Brevo template id
  // ...
},
```

Only set ids for templates you're actually sending. Leave others at `0`.

---

## 5. Set Convex env vars

**Convex Dashboard → Settings → Environment variables**

| Variable | Value | Notes |
|----------|-------|-------|
| `BREVO_API_KEY` | `xkeysib-...` | **Required** — from step 1 |
| `BREVO_SENDER_EMAIL` | e.g. `noreply@yourapp.com` | Optional — overrides template sender |
| `BREVO_SENDER_NAME` | e.g. `Your App` | Optional |
| `SUPPORT_EMAIL` | e.g. `support@yourapp.com` | Optional — password-changed emails |

---

## 6. Sending an email from your code

Each template has its own internal Convex action with **typed args** — so call sites are type-checked.

### From another action

```ts
await ctx.runAction(internal.email.actions.sendWelcomeEmail, {
  to: user.email,
  params: {
    name: user.name,
    appUrl: process.env.APP_URL ?? "",
  },
});
```

### From a mutation

Mutations can't call actions directly — schedule them instead:

```ts
await ctx.scheduler.runAfter(0, internal.email.actions.sendWelcomeEmail, {
  to: user.email,
  params: {
    name: user.name,
    appUrl: process.env.APP_URL ?? "",
  },
});
```

`runAfter(0, ...)` runs the action as soon as the mutation commits.

### Fire-and-forget vs. await

The actions throw a `ConvexError` on failure. Decide based on the use case:

- **Critical confirmation email** (e.g. password reset) — `await` it. If it fails, surface the error to the user.
- **Nice-to-have notification** (e.g. "subscription activated") — wrap in try/catch and log. Don't fail the parent flow just because email is down.

```ts
try {
  await ctx.runAction(internal.email.actions.sendSubscriptionActivatedEmail, {
    to: user.email,
    params: { name: user.name, planName: "Pro", amount: "$19", nextBillingDate: "2026-06-22", manageUrl: `${appUrl}/billing` },
  });
} catch (err) {
  console.error("Subscription activated email failed (non-blocking):", err);
}
```

---

## 6. Common wiring points (suggestions)

These are the natural places to plug each email in. None are wired up yet — do it as you build out each feature.

| Email kind                | Where to call it                                                                                                             |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `welcome`                 | In `http.ts` Clerk webhook, on `user.created` — after `createOrUpdateFromClerk`                                              |
| `adminInvited`            | In `user/actions.ts:inviteAdmin`, after Clerk's invitation API call. Pass through the `inviteUrl` Clerk returns              |
| `subscriptionActivated`   | In `stripe/webhookProcessor.ts`, inside the `checkout.session.completed` branch after `upsertFromStripeSub`                  |
| `subscriptionCanceled`    | In `stripe/webhookProcessor.ts`, inside `customer.subscription.updated` when `cancel_at_period_end` becomes `true`           |
| `paymentFailed`           | In `stripe/webhookProcessor.ts`, inside the `invoice.payment_failed` branch                                                  |
| `passwordChanged`         | In `password-change-form.tsx` flow — after the Clerk `updatePassword` call resolves, call a new mutation that schedules this |

---

## 7. Testing

### Send a test email

From the Convex dashboard, run any of the email actions directly:

```js
// Function: email/actions:sendWelcomeEmail
{
  "to": "your-email@example.com",
  "params": {
    "name": "Test User",
    "appUrl": "https://localhost:3001"
  }
}
```

You should see the email arrive within a few seconds. If not, check **Brevo Dashboard → Statistics → Email Activity** for the delivery status — it'll tell you if it was sent, bounced, or rejected.

### Common issues

| Symptom                                       | Likely cause                                                                  |
|-----------------------------------------------|-------------------------------------------------------------------------------|
| `BREVO_NOT_CONFIGURED` | `BREVO_API_KEY` missing on the Convex deployment |
| `BREVO_TEMPLATE_NOT_CONFIGURED` | Set `brevoTemplateId` in `convex/email/templates.ts` for that kind |
| `BREVO_SEND_FAILED (400)`                     | Template id doesn't exist, or sender isn't verified — check the error body    |
| `BREVO_SEND_FAILED (401)`                     | API key is wrong or revoked                                                   |
| Email sends but `{{params.x}}` shows literally | Template uses `{{x}}` instead of `{{params.x}}` — Brevo requires the prefix   |
| Email arrives blank                           | Param name mismatch between template and what you pass in code                |

---

## 8. Adding a new template

1. Create the template in Brevo dashboard, note its numeric id
2. Add an entry to `EMAIL_TEMPLATES` in `templates.ts` with its `brevoTemplateId`
3. Add an entry to `EMAIL_TEMPLATES` in `packages/backend/convex/email/templates.ts` documenting the param names
4. Add a typed action in `packages/backend/convex/email/actions.ts` with Convex validators matching those params
5. Call it from your code via `ctx.runAction(internal.email.actions.send<MyKind>Email, {...})`

Keeping `templates.ts` documentation in sync with the actual Brevo template is on you — there's no runtime check that the params you send actually appear in the template body.

---

## Architecture

```
your Convex action/mutation
        │
        ▼
internal.email.actions.send<Kind>Email   (typed Convex action — validates params)
        │
        ▼
sendBrevoEmail()                          (low-level HTTP wrapper)
        │
        ▼
POST https://api.brevo.com/v3/smtp/email
        │
        ▼
Brevo renders template + params + sends
```

The `email/` folder is fully isolated — it has no dependencies on the rest of the backend, so you can copy it into other Convex projects easily.
