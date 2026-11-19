# Namibia Commerce — Facebook Messenger Inventory Bot (v1)

Customers message your Facebook Page to check **product availability and price** without calling the shop.

## What's in here
- `backend/` — Express + TypeScript + PostgreSQL API
  - `routes/messenger.ts` — Facebook Messenger webhook (verify + incoming messages)
  - `services/messenger.ts` — sends replies via Graph API
  - `db/schema.sql` — database schema (run once)
  - `db/index.ts` — Postgres pool
- `frontend/` — (empty for now; bot is the UI)

## 1. Create a free database (Supabase)
1. Go to https://supabase.com → New project (free tier).
2. SQL Editor → paste `backend/db/schema.sql` → Run.
3. Insert your business + products, e.g.:
   ```sql
   INSERT INTO businesses (id, name) VALUES ('YOUR-UUID', 'My Shop');
   INSERT INTO products (business_id, name, price, stock_quantity, is_active)
   VALUES ('YOUR-UUID', 'Rice 5kg', 120.00, 30, true);
   ```
4. Copy the connection string (Settings → Database → Connection string → URI) into `DATABASE_URL`.

## 2. Facebook / Meta setup (free)
You only have a Facebook Page today. You also need:
1. A Meta Developer account: https://developers.facebook.com → "Get Started".
2. Create an App → type "Business" → add the "Messenger" product.
3. Connect your Facebook Page to the app (Messenger → Settings → Access Tokens → generate a Page Access Token). Save as `MESSENGER_PAGE_ACCESS_TOKEN`.
4. Set a verify token of your choice → `MESSENGER_VERIFY_TOKEN`.

## 3. Configure env
```bash
cd backend
cp .env.example .env
# fill DATABASE_URL, BUSINESS_ID, MESSENGER_* values
```

## 4. Run locally
```bash
cd backend
npm install
npm run dev
# server on http://localhost:3000
```

## 5. Expose webhook (local testing)
Use ngrok (free): `ngrok http 3000`
Then in Meta app → Messenger → Webhooks:
- Callback URL: `https://<ngrok>/messenger/webhook`
- Verify token: your `MESSENGER_VERIFY_TOKEN`
- Subscribe to: `messages`

## 6. Deploy free (Render)
1. Push this folder to GitHub.
2. https://render.com → New → Web Service → connect repo.
3. Root directory: `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add all env vars from `.env.example` in Render's Environment tab.
7. Update Meta webhook Callback URL to `https://<your-render-app>.onrender.com/messenger/webhook`.

## Bot commands
- `hi` / `help` — welcome + instructions
- any product name (e.g. `rice`) — stock & price
- `list` — all active products

## Notes
- WhatsApp/mobile-money/payments modules are scaffolded but not wired in v1.
- Free Render tier sleeps after 15 min of inactivity; first message may take ~30s to wake.
