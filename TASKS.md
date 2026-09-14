# Tasks

## Done
- Delete warranty claims (per-repair tab + global /garantie list) — 2026-09-14

## Backlog: "everything I can add, I want to be able to delete"

User's original ask was broader than warranty claims. Follow-up audit found these gaps:

- **Customer devices** — `createDevice` in `src/lib/actions/devices.ts`, listed in `klanten/[id]/page.tsx` and `klanten/[id]/apparaten/[deviceId]/page.tsx`. No delete action exists at all. Good candidate for the same `ConfirmDeleteButton` pattern.
- **Catalog repair types** — `src/app/(app)/instellingen/CatalogManager.tsx` / `src/lib/actions/settings.ts`. Only has an `active` archive toggle, no hard delete. Judgment call: may be intentional since historical repairs reference these.
- **Repair statuses** — same file/area as above, same archive-only pattern, same judgment call.
- **Repair photos** — has delete (`deleteRepairPhoto`), but no confirmation dialog (deletes immediately on click). Inconsistent UX vs. the `ConfirmDeleteButton` pattern used elsewhere.
- **Repair line items ("parts used")** — has delete (`removeRepairItem`), also no confirmation dialog.

### Intentionally left alone (audit/legal/financial records — not meant to be deletable)
- Payments (reversed via refund, not deleted)
- Invoices / credit notes (corrected via credit note, never deleted/edited)
- Intake signatures, terms versions (versioned, not deleted)
- Activity logs (audit trail)

Pattern to reuse: `src/components/ui/confirm-delete-button.tsx` (`ConfirmDeleteButton`) + a `deleteX` server action in `src/lib/actions/*.ts` scoped by `business_id`, following `deleteWarrantyClaim` in `src/lib/actions/warranty.ts` as the template.
