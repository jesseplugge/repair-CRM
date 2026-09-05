# Reparatie CRM — increments 1 + 2

Dutch CRM/POS for a phone-repair shop. Next.js 14 (App Router) + Supabase (Postgres, Auth, RLS).

## What's built

**Increment 1** — customers, devices, repair catalogue, the fast intake flow, the repair detail
screen, dashboard.

**Increment 2** (this update) adds:

- **Real payments ledger** — partial/split payments and refunds against repairs and invoices,
  replacing the old one-shot "mark paid" flag. Payment history shown on both.
- **PDF generation** (`@react-pdf/renderer`, no headless browser needed) — drop-off/intake bon,
  completion/kassabon, and Dutch invoices, each adapting layout for A4/A5/80mm/58mm thermal.
  Thermal pages use a generously tall fixed page size since PDF pages can't be truly
  variable-height — see `src/lib/pdf/format.ts` for the trade-off and future ESC/POS note.
- **§15A signature flow** — `/reparaties/[id]/ondertekenen`: canvas signature (touch/mouse/stylus
  via pointer events), scrollable Algemene Voorwaarden with a required "gelezen en akkoord"
  checkbox, generates a signed PDF that snapshots the exact terms version accepted. Instellingen →
  Algemene Voorwaarden lets you version the terms; old versions are never edited or deleted, so a
  signature made under v1.3 keeps referencing v1.3 forever even after v1.4 goes live.
- **Producten & Voorraad** — product CRUD, stock levels, low-stock warnings, quick +/− adjustment.
- **Kassa (POS)** — product search, cart, optional customer link, contant/pin/bankoverschrijving
  checkout, receipt PDF, stock auto-decrements.
- **Kassalade** (`/kassa/kassalade`) — open with a starting float, log withdrawals/deposits/refunds,
  close out with expected-vs-actual cash count and the difference.
- **Facturen** — create from a repair (auto-fills lines) or manually (customer + free-form lines),
  status lifecycle (concept/verzonden/betaald/gedeeltelijk betaald/vervallen/geannuleerd), PDF,
  payments against the invoice.
- **Rapportages** — omzet/BTW/onderdelenkosten/brutowinst for a date range (presets + custom),
  revenue by source, top repair types, CSV export.

Every number that matters (VAT, totals, numbering) is still computed from real line items and a
transaction-safe Postgres function — never re-derived at render time or entered by hand.

## What's still simplified / not built

- **Credit notes** — schema exists (`credit_notes`), no UI yet.
- **Document template editor** — `document_templates` table exists for future customization; PDFs
  are currently hardcoded React components rather than DB-driven templates. This was a deliberate
  trade-off for reliability in a first pass — a template editor is meaningfully more work and risk.
- **Email sending** — no SMTP/email provider is wired up, so "e-mail naar klant" isn't implemented;
  PDFs open in a new tab for now (print/save from there). Wiring up Resend or similar is
  straightforward to add next.
- **Thermal printing** is approximated via a tall fixed-size PDF page rather than raw ESC/POS
  commands to a receipt printer — works for "print via a PDF viewer," not a direct USB/network
  thermal print API.
- **Categories/suppliers** for products exist in the schema but have no management UI — products
  are flat for now.
- Editable repair statuses, multiple-employee management, and BTW-rate-level breakdowns in
  reporting are still open.

## Setup

1. Run **both** migrations in order in your Supabase SQL editor (or `supabase db push`):
   `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_pos_payments_invoices.sql`.
   If you already ran 0001 previously, just run 0002 now — it's additive.
2. If your project predates this update, you won't have an active Algemene Voorwaarden yet (the
   auto-seed trigger only fires for *new* businesses). Go to **Instellingen → Algemene
   Voorwaarden** and add v1.0 before testing the signature flow.
3. `.env.local`, `npm install`, `npm run dev` — same as before.
4. New dependency: `@react-pdf/renderer`. If you're updating an existing checkout rather than
   re-unzipping, run `npm install` again to pick it up.

## Increment 3 additions (latest)

- **Credit notes** (§18) — create against an invoice from the invoice detail page, full or partial,
  with a reason. A credit note matching the invoice's full amount marks the invoice cancelled;
  partial ones are just logged. Never deletes or edits the original invoice.
- **Editable repair statuses** (§7) — Instellingen now has full add/rename/recolor/reorder/
  activate-deactivate for statuses, not just the seeded defaults.
- **Email sending** — "E-mail" buttons on the repair's Documenten card, the invoice page, the
  signature confirmation screen, and the POS success screen. Requires `RESEND_API_KEY` and
  `RESEND_FROM_EMAIL` in `.env.local` (free tier at resend.com works fine for testing) — without
  them, the button surfaces a clear inline error rather than failing silently. PDF generation was
  refactored into shared functions (`src/lib/pdf/generate.tsx`) so the download routes and the
  email actions render the exact same document.
- **Product categories & suppliers** — quick-add inline from the product form (a "+" next to each
  dropdown opens a small add form without leaving the page).
- **Gebruikers** section in Instellingen — read-only team list. Inviting teammates with scoped
  roles is still deferred: it needs secure invite tokens and an acceptance flow, which is
  meaningfully more work/risk than the rest of this pass, and the original spec explicitly said
  "even if initially there is only one user" — the data model (business_id + role per user) already
  supports it whenever you want to build the invite UI.
- **BTW-per-rate breakdown** added to Rapportages (21% / 9% / 0% totals for the selected period).

## What's still open

- Multi-employee invite flow (see above)
- Document template editor — PDFs are hardcoded React components, not DB-driven templates
  (`document_templates` table exists for this, unused so far)
- Raw ESC/POS thermal printing — current approach is a tall fixed-size PDF page, which the person
  using this confirmed is fine since they're printing to a normal printer, not a receipt printer
- Outstanding-invoices report, PDF export of reports (CSV export already works)

## Increment 4 additions (latest)

- **Direct printing** — every "Printen" button now opens the OS print dialog directly (via a hidden
  iframe pointed at the PDF route) instead of requiring you to open a PDF tab and press Ctrl+P
  yourself. A format dropdown (A4/A5/80mm/58mm) sits next to it wherever the document type supports
  more than one layout; a small download icon next to it still opens the PDF in a new tab as a
  fallback (some browsers block cross-origin iframe printing — the download link always works).
- **Signing embedded on the repair screen** — no more forced navigation to a separate page. The
  repair detail screen's Documenten card now shows either "✓ Ondertekend op …" or a "Klant laten
  ondertekenen" button that opens the same canvas-signing flow in a modal, right there at the
  counter. The standalone `/reparaties/[id]/ondertekenen` page still exists (e.g. for handing a
  tablet to the customer directly) — both now share one component, `src/components/SignatureCapture.tsx`.
- **Brand accent color** — Instellingen → Merk & huisstijl has a color picker (plus presets) that
  recolors every primary button, active sidebar item, and link throughout the app. Technically:
  one hex value is expanded into hover/light/soft-background/soft-border variants
  (`src/lib/utils/color.ts`) and injected as CSS custom properties on the app shell — every
  Tailwind class that used to say `bg-teal-600` etc. now reads `bg-[var(--accent)]`. Deliberately
  scoped to this rather than full light/dark theming — see the note further down on why.
- **Logo upload** — also in Merk & huisstijl. Uploads to a new Supabase Storage bucket (`logos`,
  public-read, write-scoped per business) and shows up in the sidebar and on all three PDF
  templates (receipts, invoices, signed intake).

### Why not full light/dark theming

Every component in this codebase uses literal Tailwind color classes (`bg-white`, `text-ink-900`,
etc.), not CSS variables. Real dark-mode support means adding a `dark:` variant to essentially
every one of them and getting contrast right — and I have no way to visually render this app to
check that, so shipping it "unverified" felt like the wrong trade-off versus the accent-color
approach above, which is contained, mechanical, and I could exhaustively grep for correctness.
If you want dark mode specifically (not just brand color), say so and I'll take it on properly.

## Setup — new migration

Run `supabase/migrations/0003_branding.sql` in the SQL editor (adds `businesses.accent_color` and
creates the `logos` storage bucket with its RLS policies). `0001` and `0002` are unchanged.

## Setup — env vars

`.env.local.example` now also lists `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional, only needed
for the email buttons). Everything else is unchanged from before — just `npm install` again if
you're updating an existing checkout, to pick up `@react-pdf/renderer`.

## Next steps

Test the credit note flow, status editing, and — if you set up a Resend key — the email buttons.
Report back what breaks. After that, the document template editor and multi-employee invites are
the natural remaining scope, whenever useful to you.

