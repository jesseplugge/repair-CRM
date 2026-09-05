/**
 * Money and VAT helpers. Everything is rounded to whole cents at the point of
 * calculation and stored that way — never re-derived at render time — so a
 * printed receipt always matches what was actually charged (see §19).
 */

export function formatEuro(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Given an amount excl. VAT and a rate, returns { exclVat, vatAmount, inclVat }, each rounded to the cent. */
export function calculateFromExclVat(amountExclVat: number, vatRate: number) {
  const exclVat = roundCents(amountExclVat);
  const vatAmount = roundCents(exclVat * (vatRate / 100));
  return { exclVat, vatAmount, inclVat: roundCents(exclVat + vatAmount) };
}

/** Given an amount incl. VAT and a rate, back-calculates the excl.-VAT amount. */
export function calculateFromInclVat(amountInclVat: number, vatRate: number) {
  const inclVat = roundCents(amountInclVat);
  const exclVat = roundCents(inclVat / (1 + vatRate / 100));
  const vatAmount = roundCents(inclVat - exclVat);
  return { exclVat, vatAmount, inclVat };
}

export type RepairLine = {
  quantity: number;
  sellingPriceExclVat: number;
  vatRate: number;
  discount?: number;
};

/** Sums a set of repair/invoice lines into subtotal / VAT / total, grouped by rate isn't needed for a single overall total. */
export function sumLines(lines: RepairLine[]) {
  let subtotalExclVat = 0;
  let totalVat = 0;

  for (const line of lines) {
    const lineExcl = roundCents(line.quantity * line.sellingPriceExclVat - (line.discount ?? 0));
    const { vatAmount } = calculateFromExclVat(lineExcl, line.vatRate);
    subtotalExclVat = roundCents(subtotalExclVat + lineExcl);
    totalVat = roundCents(totalVat + vatAmount);
  }

  return {
    subtotalExclVat,
    totalVat,
    totalInclVat: roundCents(subtotalExclVat + totalVat),
  };
}

export function formatPaymentDescription(amount: number, method: string) {
  return `Betaling ${formatEuro(amount)} – ${method}`;
}
