'use client';

import { useEffect, useState, useTransition } from 'react';
import { checkoutPosSale, type CartLine } from '@/lib/actions/pos';
import { emailPosReceipt } from '@/lib/actions/email';
import { EmailButton } from '@/components/EmailButton';
import { PrintControls } from '@/components/PrintControls';
import { Button, Card, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { Search, Trash2, Banknote, CreditCard, Landmark, CheckCircle2, User } from 'lucide-react';

type Product = { id: string; name: string; sku: string | null; selling_price_excl_vat: number; vat_rate: number; stock_quantity: number };
type CustomerLite = { id: string; first_name: string; last_name: string; phone: string | null; email?: string | null };

const METHODS = [
  { value: 'contant', label: 'CONTANT', icon: Banknote },
  { value: 'pin', label: 'PIN', icon: CreditCard },
  { value: 'bankoverschrijving', label: 'BANK', icon: Landmark },
];

export function PosTerminal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<(CartLine & { key: string })[]>([]);
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerLite[]>([]);
  const [method, setMethod] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      setResults(res.ok ? await res.json() : []);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerQuery)}`);
      setCustomerResults(res.ok ? await res.json() : []);
    }, 200);
    return () => clearTimeout(t);
  }, [customerQuery]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key: p.id,
          productId: p.id,
          description: p.name,
          quantity: 1,
          unitPriceExclVat: p.selling_price_excl_vat,
          vatRate: p.vat_rate,
        },
      ];
    });
    setQuery('');
    setResults([]);
  }

  function updateQty(key: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)));
  }

  const totalInclVat = cart.reduce((s, l) => s + l.unitPriceExclVat * l.quantity * (1 + l.vatRate / 100), 0);

  function checkout() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutPosSale(
        cart.map(({ key, ...l }) => l),
        customer?.id ?? null,
        method
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.saleId!);
        setSuccessEmail(customer?.email ?? null);
        setCart([]);
        setCustomer(null);
        setMethod(null);
      }
    });
  }

  if (success) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 size={32} className="text-green-600" />
        <h2 className="font-display text-xl font-semibold text-ink-950">Betaling geslaagd</h2>
        <div className="flex w-full max-w-xs flex-col gap-2 pt-2">
          <PrintControls baseUrl={`/api/pos-sales/${success}/pdf`} label="Bon printen" />
          <EmailButton id={success} action={emailPosReceipt} defaultEmail={successEmail} />
        </div>
        <button onClick={() => setSuccess(null)} className="mt-4 text-sm text-[var(--accent)] underline">
          Nieuwe verkoop
        </button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Zoek product op naam of SKU…" className="pl-9" autoFocus />
        </div>
        {results.length > 0 && (
          <Card className="divide-y divide-ink-100">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-ink-50"
              >
                <div>
                  <div className="font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-400">{p.sku ?? ''} &middot; Voorraad {p.stock_quantity}</div>
                </div>
                <div className="tabular-nums text-ink-900">{formatEuro(p.selling_price_excl_vat * (1 + p.vat_rate / 100))}</div>
              </button>
            ))}
          </Card>
        )}

        <Card className="p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <User size={13} /> Klant (optioneel)
          </h3>
          {customer ? (
            <div className="flex items-center justify-between rounded border border-[var(--accent-border-soft)] bg-[var(--accent-soft)] px-3 py-2">
              <span className="text-sm font-medium">
                {customer.first_name} {customer.last_name}
              </span>
              <button onClick={() => setCustomer(null)} className="text-xs text-[var(--accent)] underline">
                Wijzigen
              </button>
            </div>
          ) : (
            <div>
              <Input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Zoek klant…" />
              {customerResults.length > 0 && (
                <div className="mt-1 divide-y divide-ink-100 rounded border border-ink-100">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQuery('');
                        setCustomerResults([]);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-sm hover:bg-ink-50"
                    >
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Cart */}
      <div>
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Winkelmandje</h3>
          <div className="space-y-2">
            {cart.map((l) => (
              <div key={l.key} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium text-ink-900">{l.description}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <button onClick={() => updateQty(l.key, l.quantity - 1)} className="px-1">
                      −
                    </button>
                    {l.quantity}
                    <button onClick={() => updateQty(l.key, l.quantity + 1)} className="px-1">
                      +
                    </button>
                  </div>
                </div>
                <div className="tabular-nums text-ink-900">{formatEuro(l.unitPriceExclVat * l.quantity * (1 + l.vatRate / 100))}</div>
                <button onClick={() => updateQty(l.key, 0)} className="ml-2 text-ink-300 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-sm text-ink-400">Nog geen producten toegevoegd.</p>}
          </div>

          <div className="mt-4 flex justify-between border-t border-ink-100 pt-3 font-display text-lg font-semibold text-ink-950">
            <span>Totaal</span>
            <span className="tabular-nums">{formatEuro(totalInclVat)}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-1 rounded border px-2 py-3 text-xs font-bold transition-colors ${
                  method === m.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>

          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            disabled={cart.length === 0 || !method || pending}
            onClick={checkout}
          >
            {pending ? 'Bezig…' : `Afrekenen ${formatEuro(totalInclVat)}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
