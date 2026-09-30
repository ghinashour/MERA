# MERA — Objects Worth Keeping

MERA is a complete online gift and lifestyle store. It has a beautiful shop for customers and a full dashboard for the shop owner.

Think of it like a small Etsy-style website, but simpler and fully yours: customers can browse, search, build gifts, add to bag, and pay. You (the admin) can manage products, stock, orders, customers, and revenue — all in one place.

**Tagline:** *Objects worth keeping. A calmer, more considered way of living.*

---

## What can it do?

### For shoppers (the website)
- **Home page** — hero banner, New Arrivals, collections (For the Desk / For the Home), gift builder, brand story, newsletter signup.
- **Shop** — browse all products, filter by collection, open any product page with photos, price, stock, and description.
- **Search** — fast search across title, description, and slug. Works even if the backend is offline (shows built-in fallback products).
- **Product pages** — clean layout, related items, reviews section, quantity picker.
- **Build a Gift** — 3-step wizard: 1) pick an occasion (Birthday, Thank you, New home, Just because), 2) pick items, 3) pick packaging (Kraft + ribbon, Linen pouch, Keepsake box) + add a personal note. Keepsake box and linen pouch add a small fee automatically.
- **Bag (cart) drawer** — slide-in bag on every page. Change quantity, remove items, see subtotal live. Cart is saved per visitor (session id), no login needed.
- **Checkout** — enter email + shipping, choose **PayPal** or **Cash on Delivery (COD)**.
  - PayPal: create order → approve on PayPal → capture → order confirmed.
  - COD: order is placed right away with status `pending-confirmation`.
- **Journal, Story, Help pages** — brand stories, blog-style posts, and help/FAQ pages.
- **Account + login** — register, login, see your past orders.
- **Newsletter** — subscribe in the footer. If email is configured, you get a real welcome email with 10% off code `WELCOME10`. If not configured, it still saves you and tells you honestly.
- **WhatsApp button** — one-click chat with the shop (`NEXT_PUBLIC_WHATSAPP`). Used in header, hero, and product pages for gift help.

### For the owner (the admin dashboard at `/admin`)
- **Overview** — total orders, revenue, average order, customers, repeat buyers, low stock alerts, cancel rate, PayPal vs COD share, recent orders, best day.
- **Revenue** — sales by day (last 14 days) and by month (last 6 months), top products, payment breakdown, sales funnel (paid / pending / cancelled).
- **Orders** — filter by status and payment method, see items, shipping, and customer email. Update status (confirm, ship, deliver, cancel).
- **Stock / Products** — see price, stock, units sold, revenue per product, and stock value. Adjust stock in one click. Add, edit, or remove products (with image upload).
- **Customers** — who buys the most, how often, total spend.
- **Collections** — group products (e.g. New Arrivals, For the Desk).
- **Gifts** — see gift orders (occasion, packaging, note).
- **Content** — manage journal posts, reviews, and contact messages.
- **Settings** — see WhatsApp number, mail status (resend / smtp / logged), API health.

### Behind the scenes (the API)
- **Products + Collections** — list, search, get by slug, admin CRUD.
- **Cart** — session-based bag, enriched with real product title, price, image, and slug.
- **Orders** — validates email, checks stock, calculates totals + gift packaging fees, decrements stock automatically.
- **Payments** — PayPal REST v2 (sandbox + live, no SDK lock-in) + COD confirm.
- **Auth** — email + password with bcrypt, JWT login (7 days), admin auto-seed on first boot.
- **Newsletter + Mail** — saves subscribers, sends welcome email via Resend (easiest) or SMTP. If neither is set, it logs instead of failing silently.
- **Uploads** — upload images, served from `/public`.
- **Health checks** — `GET /api/health` for Render/uptime monitors.

---

## Tech used (simple version)

- **Backend:** NestJS + TypeORM. Postgres in production (Neon/Supabase), auto-falls back to local SQLite file when `DATABASE_URL` is missing. Great for free hosting.
- **Frontend:** Next.js 14 + React 18. Static pages where possible, dynamic for product/help pages.
- **Payments:** PayPal REST API + Cash on Delivery.
- **Email:** Resend HTTP API (recommended, free) or any SMTP (e.g. Gmail app password).
- **Hosting (free):** API on Render, database on Neon, website on Vercel. Blueprint files included.

---

## Run it on your computer

You need: Node 22+, npm, and optionally Docker (only if you want local Postgres).

### 1. Start the backend (API)

```bash
# in the project root
cp .env.example .env
npm install
npm run seed        # optional — also auto-seeds on first boot
npm run start:dev
```

Open: http://localhost:3000/api/health → should show `{"ok":true}`

- Without Docker/Postgres, it just uses a local `./dev.sqlite` file. Zero setup.
- With Docker Postgres:
  ```bash
  docker compose up -d db
  # set DATABASE_URL=postgres://mera:mera@localhost:5432/mera in .env
  ```

Default admin (change in `.env`):
- Email: `admin@mera.shop`
- Password: `MeraAdmin123!`

### 2. Start the website

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open: http://localhost:3001
Admin: http://localhost:3001/admin (login with admin email/password above)

> The website talks to the API via `NEXT_PUBLIC_API`. Local default is `http://localhost:3000/api`.

---

## Settings (environment variables)

### Backend — `.env` (see `.env.example`)

| Name | What it is | Required? |
|---|---|---|
| `DATABASE_URL` | Postgres connection string (e.g. from Neon). If empty, uses local SQLite. | No (recommended for live site: yes) |
| `DB_SSL` | Leave empty for hosted DBs (they need SSL). Set `DB_SSL=off` only for local Postgres without SSL. | No |
| `JWT_SECRET` | Secret for login tokens. Use a long random string. | Yes |
| `PORT` | API port. Default `3000`. | No |
| `FRONTEND_URL` | Your website URL (for CORS + email links). E.g. `https://mera-web.vercel.app`. Local: `http://localhost:3001`. | Yes on live |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin account, created automatically if missing. | Yes |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` / `PAYPAL_MODE` | PayPal keys. `MODE=sandbox` for testing, `live` for real money. | Only if you take PayPal |
| `RESEND_API_KEY` | Easiest email option. Get free key at resend.com. | Pick Resend OR SMTP |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Other email option (e.g. Gmail). | Pick Resend OR SMTP |
| `MAIL_FROM` | Who emails come from. E.g. `MERA <hello@mera.shop>`. | No |

### Website — `web/.env.local` (see `web/.env.example`)

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_API` | Where the API lives. Local: `http://localhost:3000/api`. Live: `https://your-api.onrender.com/api`. |
| `NEXT_PUBLIC_WHATSAPP` | WhatsApp number for chat button. Digits only, no `+`. E.g. `96181580436`. |

---

## API quick reference

Base URL is `/api`. Examples use localhost.

**Shop**
- `GET /api/products?q=scarf` — list/search products
- `GET /api/products/:slug` — one product (404 if missing)
- `GET /api/collections` — collections with products
- `GET /api/posts` / `GET /api/posts/:slug` — journal posts
- `GET /api/reviews?productId=...` — reviews
- `POST /api/reviews` — leave a review
- `POST /api/contact` — contact message
- `POST /api/newsletter` — `{ email }` → `{ ok, mailed, transport }`
- `GET /api/newsletter/status` — is email configured?

**Bag (send header `x-session-id: <random>`)**
- `GET /api/cart` — bag with product details
- `POST /api/cart/add` — `{ productId, qty, properties }`
- `PATCH /api/cart/:id` — `{ qty }` (0 removes)
- `DELETE /api/cart/:id` — remove one line
- `DELETE /api/cart/clear` — empty bag

**Orders + payments**
- `POST /api/orders` — `{ email, payMethod: 'paypal'|'cod', items: [{productId, qty}], shipping, gift: {occasion, packaging, note} }`
- `POST /api/payments/paypal/create` — `{ totalCents }` → PayPal approval link
- `POST /api/payments/paypal/capture` — `{ paypalOrderId }`
- `POST /api/payments/cod/confirm` — confirm COD order

**Auth**
- `POST /api/auth/register` — `{ email, password }`
- `POST /api/auth/login` — `{ email, password }` → `{ token }`

**Admin**
- `GET /api/admin/stats` — full dashboard numbers
- `GET /api/admin/orders?status=&pay=&limit=` — filtered orders
- `GET /api/admin/products` + `PATCH /api/admin/products/:id/stock` — stock control
- `POST /api/admin/products` / `PATCH /api/admin/products/:id` / `DELETE /api/admin/products/:id`
- `GET /api/admin/subscribers`, `GET /api/admin/messages`
- `POST /api/upload` — multipart `files` → `/public/...` URLs

**System**
- `GET /api/health` — `{ ok: true }`
- `GET /` — `{ service: 'mera-api', health: '/api/health' }`

---

## Put it live (free)

1. **Database (Neon, free):** sign up at neon.tech → New Project → copy the connection string.
2. **API (Render, free):** New → Blueprint → pick this repo (uses `render.yaml`). Fill `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_URL` (temporary placeholder is fine), PayPal + Resend keys if you have them. Deploy → check `/api/health`.
3. **Website (Vercel, free):** Add New Project → import repo → Root Directory = `web`. Set `NEXT_PUBLIC_API=https://YOUR-api.onrender.com/api` and `NEXT_PUBLIC_WHATSAPP=...`. Deploy.
4. **Link them:** back in Render, set `FRONTEND_URL` to your real Vercel URL → Save (auto-redeploys). Open your shop, go to `/admin`, login.

Details are also in `deploy.txt`.

---

## Project layout (where things live)

```
src/          → backend (NestJS)
  products/   → products + collections + search
  cart/       → shopping bag (session-based)
  orders/     → orders, totals, stock decrement, gift fees
  payments/   → PayPal create/capture + COD
  auth/ users/→ register/login, JWT, admin seed
  content/    → newsletter, posts, reviews, messages
  mail/       → Resend / SMTP / logged email
  upload/     → image uploads to /public
  admin/      → dashboard stats, revenue, stock, customers
  seed.service.ts → starter products, collections, post, admin

web/          → storefront + admin UI (Next.js)
  app/page.tsx       → home (hero, arrivals, gift builder, story)
  app/shop/          → shop + product pages
  app/search/        → search results
  app/checkout/      → PayPal / COD checkout
  app/admin/         → dashboard (overview, revenue, orders, stock, ...)
  app/journal/ story/ help/ account/ auth/
  components/        → search overlay, shared layout
  lib/api.ts         → API URL, money format, WhatsApp link, fallbacks
  public/            → images (mirrors root public/)

public/       → product + site images served at /public/*
render.yaml   → one-click Render deploy
docker-compose.yml → local Postgres
```

Images are kept in both `public/` (API serves) and `web/public/` (website serves) so the site works even before the API is up.

---

## Recent improvements (what changed)

- **Admin dashboard rebuilt** — cleaner design, real KPIs (revenue, AOV, repeat buyers, stock value, cancel/PayPal/COD rates), 14-day + 6-month charts, funnel, top products/customers, dead-stock and low-stock alerts.
- **Search fixed** — escapes `% _ \` wildcards, searches title + description + slug, handles NULL descriptions, frontend double-filters so you never see wrong results.
- **404 crash fixed** — missing products return proper 404 + friendly “not found + related items” page instead of crashing on empty JSON.
- **Postgres SSL ready** — works with Neon/Supabase out of the box (`DB_SSL=off` only for local non-SSL).
- **Cart enriched** — bag items include title, price, image, slug, and stock, not just IDs.
- **Gift fees automatic** — Keepsake box (+$12) and Linen pouch (+$6) added to order total.
- **Honest newsletter** — returns `{ mailed, transport }` so the UI can say “check inbox” vs “saved but email not configured yet”.
- **WhatsApp everywhere** — header, hero, and settings show the live number from env.
- **Deploy-ready** — `render.yaml` blueprint, health check, auto-seed admin/products/collections/post on first boot, both backends build clean (`nest build` + `next build` verified).

---

## Troubleshooting (plain language)

- **Website shows fallback products?** API is down or `NEXT_PUBLIC_API` is wrong. Check the API `/api/health` in your browser.
- **Search shows everything?** You typed `%` or `_` — now escaped, but also check API is updated.
- **Product page says “not found”?** Slug is wrong or product was deleted. It will suggest other items.
- **No welcome email?** Open `/api/newsletter/status`. If `transport: logged`, add `RESEND_API_KEY` or SMTP settings in API `.env` and redeploy.
- **PayPal error “CLIENT_ID missing”?** Add PayPal keys in `.env`. For testing use sandbox keys + `PAYPAL_MODE=sandbox`.
- **CORS error?** Set `FRONTEND_URL` in API to your exact website URL (no trailing slash).
- **Admin login fails?** Check `ADMIN_EMAIL`/`ADMIN_PASSWORD` in API env. They are only used to create the first admin — if you changed them later, login with the old one or delete the user in DB.

---

## Scripts

```bash
# backend (root)
npm run start:dev   # dev with watch
npm run build       # production build
npm run start:prod  # run built app (Render uses this)
npm run seed        # manual seed (also auto on boot)

# frontend (web/)
npm run dev         # dev on :3001
npm run build       # production build
npm run start       # run built site
```

---

© 2026 MERA — Everyday objects for a more intentional life. PayPal + Cash on Delivery. Prices in USD.
