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

- Raw ESC/POS thermal printing — current approach is a tall fixed-size PDF page, which the person
  using this confirmed is fine since they're printing to a normal printer, not a receipt printer

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

## Increment 5 additions (latest)

- **Outstanding-invoices report + PDF export** — Rapportages now shows currently unpaid invoices
  (sent/partially paid/overdue) with a per-invoice remaining balance computed from actual payments
  and a due date derived from `payment_terms_days`, independent of the selected date range. A "PDF
  export" button sits next to the existing CSV export, rendering the same numbers as a document
  (`src/lib/pdf/ReportDocument.tsx`). The query logic is now shared between the page and the PDF
  export via `src/lib/reports/data.ts` so the two can never disagree.
- **Multi-employee invites** — Instellingen → Gebruikers now has "Teamlid uitnodigen" (owners only):
  enter an email + role, get a secure 7-day invite link. If `RESEND_API_KEY` is configured it's
  emailed automatically; otherwise the link is shown to copy and send manually. The invite
  acceptance page (`/uitnodiging/[token]`, public) handles both a brand-new signup and someone
  returning after confirming their email. See `supabase/migrations/0004_invites.sql` — **you need
  to run this migration** for the feature to work. It also tightens a real gap in the original
  schema: the old `users_insert` RLS policy only checked `id = auth.uid()`, so any authenticated
  user could previously insert themselves into `public.users` with an arbitrary `business_id` and
  `role = 'owner'`, granting themselves access to any business's data. That policy is now dropped;
  the only ways to create a `users` row are the `create_business_and_owner` and `accept_invite`
  `security definer` functions, both unaffected by RLS.
- **Document template editor** — Instellingen → Documentsjablonen (owners only) lets you customize
  the notes/footers that appear on PDFs (intake terms note, receipt/invoice footer text) without
  touching code, stored in the existing `document_templates` table. Deliberately scoped to text
  content rather than a full layout designer — layout and all computed numbers stay fixed React
  components, so the "numbers are always computed correctly, never hand-editable" guarantee holds.
- **Next.js bumped to 14.2.35** (from 14.2.15) to close a large batch of known CVEs, including an
  auth-bypass-in-Middleware advisory that mattered here since every route is gated through
  middleware. Deliberately *not* jumped to Next 16 (what `npm audit fix --force` suggests) — that's
  a breaking major version (async `cookies()`/route params across every page) for advisories that
  don't apply to this app's actual surface (no `next/image`, no custom server, no Pages Router
  i18n, not self-hosted).
- `package-lock.json` is now committed. A previous fresh `npm install` (no lockfile) had silently
  pulled a much newer `@supabase/supabase-js` that broke `@supabase/ssr@0.5.2`'s internal typing —
  every Supabase query resolved to `never`. Fixed by bumping `@supabase/ssr` to `^0.12.6` and
  committing the lockfile so this can't happen again unnoticed.

## Setup — new migration

Run, in order if starting fresh: `0001_init.sql`, `0002_pos_payments_invoices.sql`,
`0003_branding.sql`, then **`0004_invites.sql`** (new — required for the invite feature above).
If your project already has 0001–0003 applied, just run 0004 now.

## Setup — env vars

`.env.local.example` lists `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional) — needed for the
"E-mail" buttons and for invite emails to send automatically; without it, invites still work via
the copyable link. Run `npm install` again to pick up the dependency updates above.

## Next steps

Run migration 0004, then test: inviting a teammate (both the immediate-signup path and, if your
Supabase project requires email confirmation, the "confirm then return to the link" path), editing
a document template and confirming it shows up on the relevant PDF, and the outstanding-invoices
report/PDF export. Report back what breaks.

