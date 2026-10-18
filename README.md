# Directory Platform

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-c5f74f) ![Stripe](https://img.shields.io/badge/Stripe-subscriptions-635bff)

A subscription-based professional directory (designed around vetted boudoir photographers and supporting professionals). Professionals apply, pay a monthly subscription, and are listed after manual admin approval. Visitors search by name, location, and category, and can leave reviews.

Features in the code: name/location/category search with Google geocoding, professional profiles with portfolios (UploadThing), reviews with admin moderation, Stripe checkout/portal/webhook for subscription tiers, an admin area (applications, professionals, reviews, blog), and a professional dashboard.

## Stack

Next.js (App Router), React 19, TypeScript, Tailwind CSS, Drizzle ORM on Neon PostgreSQL, NextAuth v5, Stripe, UploadThing, Google Maps Geocoding API.

## Getting started

```bash
npm install
```

Create `.env.local` with:

```
DATABASE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_MAPS_API_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

UploadThing also needs its own token variables (see the UploadThing docs).

```bash
npm run db:migrate   # apply migrations
npm run db:seed      # demo data; requires ADMIN_PASSWORD
npm run dev
```

Other scripts: `build`, `start`, `lint`, `db:generate`, `db:studio`.

## Structure

- `src/app/` - pages and API route handlers (admin, dashboard, search, stripe, auth)
- `src/components/` - layout and UI components
- `src/db/` - Drizzle schema, migrations, seed script
- `src/lib/` - db, Stripe, UploadThing helpers
- `docs/plans/` - original design and implementation plans

## License

MIT - see [LICENSE](LICENSE).
