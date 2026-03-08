# Palette — Deploy Guide

## What's in this folder

```
palette/
├── api/
│   └── analyze.js      ← Vercel serverless function (Anthropic proxy)
├── public/
│   └── index.html      ← The full Palette app
├── vercel.json         ← Vercel routing config
└── README.md
```

## Deploy to Vercel (5 minutes)

### Option A — Drag and drop (easiest)
1. Go to vercel.com and sign in (free account)
2. Click "Add New Project"
3. Choose "Deploy from your computer" and drag this entire `palette` folder
4. Vercel will detect the config automatically

### Option B — CLI
```bash
npm i -g vercel
cd palette
vercel
```

## Set your environment variables

After deploying, go to your project in Vercel dashboard:
Settings → Environment Variables → Add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic API key) |

Then go to Deployments → click the three dots on your latest deploy → Redeploy.

## Set your Stripe key

In `public/index.html`, replace:
```
pk_test_REPLACE_WITH_YOUR_STRIPE_KEY
```
with your Stripe publishable key from dashboard.stripe.com

## Test it works

1. Open your Vercel URL
2. Go through the flow, upload photos, skip past the payment (dev mode)
3. Open the ⚙ Debug panel after results load
4. You should see: "✓ REAL API RESULT" and HTTP Status: 200

## Going live with payments

The app currently validates the card client-side but doesn't capture payment.
To fully charge users you need one more serverless function to create a
Stripe PaymentIntent. Happy to build that next.

## Costs

- Vercel hosting: Free (Hobby plan handles this easily)
- Anthropic API: ~$0.015 per analysis (10 images × claude-sonnet-4)
- Stripe: 2.9% + 30¢ per transaction

At $27/analysis your margin is ~$26.20 per user after all costs.
