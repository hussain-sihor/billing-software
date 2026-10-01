# Bellavo Billing — backend + app

A billing/quotation app for Bellavo Crochet, backed by a real MongoDB Atlas
database. Products, parties, and every invoice/quotation you save live in
your own cluster — not in the browser.

## What's inside

```
bellavo-backend/
  server.js          Express app entry point
  config/db.js        MongoDB connection
  models/              Product, Party, Document (invoice/quotation), Settings
  routes/               REST API for each of the above
  client/              React + Tailwind frontend (Vite)
    src/
      pages/              Dashboard, NewDocument, SavedDocuments, Products, Parties, Settings
      components/         Sidebar, modals, items editor, product search, preview, UI primitives
      templates/          The 6 document templates + pagination + print/PDF CSS
      lib/                api, store (zustand), formatting, calc, product search
    dist/              Production build output (served by Express)
  .env                 Your MongoDB connection string (already filled in)
```

The frontend is a React + Tailwind app (Vite) under `client/`. Express serves
the production build from `client/dist`, so you must run `npm run build`
before `npm start`.

## Before you run it — rotate your database password

Your MongoDB Atlas password was shared in plain text in chat and in an
uploaded file. That's fine for getting this running, but once everything
works, go to **Atlas → Database Access → your user → Edit → Edit Password**
and generate a new one, then update `MONGODB_URI` in `.env` to match. Treat
`.env` itself as a secret — it's already excluded from git via `.gitignore`,
so don't paste its contents anywhere public.

## Also check: Atlas Network Access

Your Atlas cluster only accepts connections from IP addresses you've
allow-listed. In the Atlas dashboard go to **Network Access** and add either
your current machine's IP, or `0.0.0.0/0` (allow from anywhere — fine for
testing, but loosen this back down for anything beyond that). If this step
is skipped, the server will fail to connect with a timeout error.

## Invoice & quotation formats

There are 6 built-in layouts to choose from — pick a default in **Settings →
Invoice / quotation format**, or switch on the fly from the Preview screen
before printing/downloading:

1. **Classic Tally (Serif)** — the original layout, black borders, serif font.
2. **GST Detailed (with HSN/SAC)** — closest to a standard Tally GST tax
   invoice: adds an HSN/SAC column per item and an HSN-wise Central
   Tax/State Tax summary table beneath the items, matching the format
   GST-registered businesses typically use.
3. **Modern Minimal** — clean sans-serif, teal accent header, light borders.
4. **Compact Simple** — smaller and denser, useful for bills with many lines.
5. **Bold Header** — a bold dark banner header with a striped items table.
6. **Classic Ledger** — traditional double-border, monospace-numbers look.

Only the content (Sl No, description, qty, unit, rate, discount, amount,
GST) changes what's shown — switching templates is purely a layout choice
and never changes your saved data.

HSN/SAC codes are optional and only matter if you use the GST Detailed
template: set a default per product in the **Products** tab, or type one
directly on a line item when building a bill (it's the small field under
the description). Every other template simply ignores it.

## Running it

You'll need [Node.js](https://nodejs.org) 18 or newer installed.

### Production (one server serves everything)

```bash
cd bellavo-backend
npm install          # backend deps, only needed once
npm run client:install   # client deps, only needed once
npm run build        # builds the React app into client/dist
npm start
```

You should see:

```
[db] connected to MongoDB database "bellavo_billing"
[server] Bellavo Billing running at http://localhost:5000
```

Open **http://localhost:5000** — Express serves the React app and the API
from the same origin, and every save goes straight into your MongoDB Atlas
cluster. Rerun `npm run build` whenever you change anything under `client/`.

### Development (hot-reloading frontend)

Run the backend and the Vite dev server in two terminals:

```bash
# terminal 1 — API on :5000
npm start

# terminal 2 — React dev server on :5173 (proxies /api to :5000)
npm run client:dev
```

Then open **http://localhost:5173**. Edits to the React code hot-reload
instantly; API calls are proxied to the backend on 5000.

Go to **Settings** first and fill in your company name, GSTIN, bank
details, and jurisdiction line — these appear on every bill and quotation.
Then add your parties and products before creating your first bill.

## How the data is organized (for your own reference)

- **products** — your crochet items: name, description, unit, default rate.
- **parties** — your buyers: name, GSTIN, email, phone, address. GSTIN is
  enforced unique when you provide one (an index prevents accidental
  duplicate entries for the same buyer).
- **documents** — every invoice and quotation, in one collection
  distinguished by a `type` field. Each one is numbered uniquely within its
  own series (bills and quotations each have their own counter), and stores
  a **snapshot** of the party's and your company's details as they were at
  the moment you saved it — so an old invoice won't change if you later
  edit that party's address or your own bank details.
- **settings** — a single document holding your company profile, bank
  details, jurisdiction text, and the running invoice/quotation numbers.

Indexes are in place for the lookups the app actually does: recent bills
per type, a party's full document history, date-range searches, and
name/GSTIN lookups when picking a party — so these stay fast even once
you've got hundreds of invoices.

## If something won't connect

- **"Failed to connect to MongoDB"** on startup — almost always the Network
  Access allow-list above, or a typo'd password in `.env` (special
  characters in a password sometimes need URL-encoding).
- **The app loads but shows "Can't reach the server"** — the backend isn't
  running, or crashed. Check the terminal where you ran `npm start`.
- **A save fails with "Number ... is already used"** — two documents of the
  same type got the same number (usually from editing the number field by
  hand). Adjust the number and save again.

## Known limitation

This sandbox environment (where I built this) has no route to the public
internet beyond a short allow-list of package registries, so I was not able
to actually connect to your live Atlas cluster or run this end-to-end
myself. Everything here is verified for syntax and for the Express/routing
layer working correctly in isolation — the actual MongoDB read/write path
will get its first real test when you run it on your own machine. If
anything doesn't behave as described, tell me the exact error message and
I'll fix it.
