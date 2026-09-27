# MERA API (NestJS)

Full e-commerce website MERA: Objects worth keeping.

## Run

```
cp .env.example .env
docker compose up -d db   # or skip — falls back to ./dev.sqlite
npm install
npm run seed
npm run start:dev
# http://localhost:3000/api/health
# images restored to /public
```

Your PNGs were backed up and restored to `public/` for serving.

## Endpoints

- `GET /api/products?q=` `GET /api/products/:slug` `POST /api/admin/products`
- `GET /api/collections`
- `POST /api/auth/register` `POST /api/auth/login`
- `GET /api/cart` `POST /api/cart/add` (header `x-session-id`) `DELETE /api/cart/clear`
- `POST /api/orders` {email, payMethod:'paypal'|'cod', items:[{productId,qty}], shipping, gift:{occasion,packaging,note}}
- `POST /api/payments/paypal/create` `POST /api/payments/paypal/capture` `POST /api/payments/cod/confirm`
- `POST /api/upload` (multipart `files`) -> `/public/...`

## PayPal + COD

- Set PAYPAL_CLIENT_ID/SECRET in `.env`, MODE=sandbox then live.
- Flow: create order -> paypal/create -> approve -> capture -> POST /orders with paypalOrderId. COD: POST /orders with payMethod cod -> status pending-confirmation.
