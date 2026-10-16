# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The iOS and Android apps (Capacitor, `capacitor.config.ts`) are shells that load the deployed site at repair-crm.vercel.app; they don't have their own native design language.

## Users

Today: one owner-operator running a phone-repair shop in the Netherlands. They do intake, repairs, sales at the till, invoicing and stock themselves, usually with a customer standing at the counter.

Later: other independent repair shops, each with an owner and possibly staff (user invites already exist). Not yet in use by anyone else.

## Product Purpose

Run a phone-repair shop from one place: take a device in, track the repair to pickup, sell parts and accessories, invoice and get paid, and keep stock and the books right. Success is a fast, error-free counter: the right price charged to the cent, the right paperwork signed, and nothing forgotten on the bench.

## Positioning

Built by and for a working repair counter rather than as a generic CRM: the intake flow, signed terms, repair statuses, receipts and invoices follow how a Dutch repair shop actually operates (BTW, Algemene Voorwaarden, kassa, kassalade). Undecided: how it will be positioned against other repair-shop software once sold to other shops.

## Operating Context

- Used mainly on a laptop or PC at the counter, and on a tablet (for example for customer signatures). Phone use is secondary.
- Typical moments: a customer drops off a device (intake, condition check, signature, intake receipt), the repair moves through statuses, the customer is called and picks up (payment, completion receipt), walk-in sales at the kassa, opening and closing the cash drawer.
- Paperwork: intake receipts, completion receipts, invoices and credit notes as PDFs in A4, A5, 80 mm and 58 mm thermal formats; e-mailed via Resend.

## Capabilities and Constraints

- Customers and their devices; repairs with statuses, line items, photos, payments, refunds, warranty claims and an activity timeline.
- Repair intake picks lines from products (the separate repair catalog is unused) and takes products out of stock.
- Products, categories, suppliers, stock levels and stock movements; low-stock warnings.
- Kassa (POS) with cash, card (pin) and bank transfer; kassalade (cash drawer) open and close.
- Invoices with a status lifecycle, credit notes, receipts archive, reports with CSV export.
- Multi-tenant: every record belongs to a business; each business has its own logo and accent color.
- Interface languages: Dutch (primary), English, German, French, Spanish, Turkish.
- Stack: Next.js 14 (App Router, server actions) and Supabase (Postgres, Auth, RLS), deployed on Vercel.
- Money rule: the incl.-BTW price is the source of truth for products and lines; totals come from real line items, never re-derived at render time.
- Tips (payments.tip_amount) are taxable turnover here, not a pass-through gratuity: 21% BTW-inclusive, counted in revenue, VAT, and profit everywhere money actually paid/handled is totaled (dashboard, reports, customer lifetime spend, receipts, cash-drawer reconciliation). They are deliberately excluded from payment_status/remaining-balance math — a tip doesn't pay down the service price owed.
- Legal/sequential records (invoices, credit notes, signatures, terms versions, activity logs) are corrected, never edited or deleted. Payments are the one exception since 2026-10-16: amount, method, transaction ID, tip and paid-at time can be edited directly on a payment the owner entered wrong — the payment_status on its repair/invoice is recomputed after every edit, same as after recording or refunding one.
- Terminology in the product: reparatie, klant, apparaat, kassa, kassalade, bon, factuur, BTW, Gereed, Opgehaald.

## Brand Commitments

- Product name in use: "Reparatie CRM" (working name).
- Dutch is the primary language and voice of the interface.
- Each shop can set its own logo and accent color, which matters more once other shops use it.

## Evidence on Hand

- Real shop data in Supabase project PRJ: 58 products with prices, a handful of real repairs and customers.
- No customers other than the owner, no testimonials, reviews, pricing or sales claims exist. Future work must not invent them.

## Product Principles

1. The counter comes first: anything used while a customer waits must be fast and impossible to get wrong.
2. Money and paperwork are exact: prices to the cent, signed terms snapshotted, records corrected rather than rewritten.
3. Nothing gets forgotten on the bench: open work, waiting customers and unpaid amounts are always visible.
4. Build for one shop, keep it ready for many: per-shop branding, roles and languages stay intact.
