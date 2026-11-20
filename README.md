# Namibia Commerce — Facebook Messenger Inventory Bot (v1)

Customers message your Facebook Page to check **product availability and price** without calling the shop.

## What's in here
- `backend/` — Express + TypeScript + PostgreSQL API
  - `routes/messenger.ts` — Facebook Messenger webhook (verify + incoming messages)
  - `services/messenger.ts` — sends replies via Graph API
  - `db/schema.sql` — database schema (run once)
  - `db/index.ts` — Postgres pool
- `frontend/` — (empty for now; the bot is the UI)

---

## 1. Create a free database (Supabase)

1. Go to **https://supabase.com** → **New project** (free tier).
2. Open **SQL Editor** → paste `backend/db/schema.sql` → **Run**.
3. Insert your business + products:

   ```sql
   -- Business ID (use this one)
   INSERT INTO businesses (id, name) VALUES ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'My Shop');

   -- Sample products (you can change or add your own)
   INSERT INTO products (business_id, name, price, stock_quantity, is_active) VALUES
   ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'Rice 5kg', 69.00, 50, true),
   ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'Bread Loaf', 12.00, 120, true),
   ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'Eggs (dozen)', 38.00, 80, true),
   ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'Milk 1L', 22.00, 60, true),
   ('43a794c2-5c75-40b5-8a81-8e6ab572687c', 'Chicken Gizzard', 45.00, 30, true);
