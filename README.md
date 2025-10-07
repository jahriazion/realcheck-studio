# RealCheck v5

See `.env.example` for configuration. Run:
```
npm install
npx prisma migrate dev --name init
cp .env.example .env  # or copy on Windows
# Generate secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
npm run dev
```

## Stripe (optional)
- Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`.
- Start dev webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- For local testing without Stripe, set `RC_DEV_ALL_PRO=true` to treat all users as Pro.
