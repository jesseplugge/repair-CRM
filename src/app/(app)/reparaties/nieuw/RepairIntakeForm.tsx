'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRepair } from '@/lib/actions/repairs';
import { Button, Card, Field, Input, Textarea, Label } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { Search, Check, User, Smartphone, Wrench } from 'lucide-react';

type CustomerLite = { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; customer_number: string };
type DeviceLite = { id: string; brand: string; model: string; imei: string | null; color: string | null; storage_capacity: string | null };
type CatalogLite = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  selling_price: number;
  vat_rate: number;
  warranty_months: number | null;
};

const CONDITION_FIELDS: { key: string; label: string }[] = [
  { key: 'cond_screen', label: 'Schermschade' },
  { key: 'cond_back', label: 'Achterglas beschadigd' },
  { key: 'cond_frame', label: 'Frame beschadigd' },
  { key: 'cond_camera', label: 'Camera beschadigd' },
  { key: 'cond_buttons', label: 'Knoppen' },
  { key: 'cond_port', label: 'Laadconnector' },
  { key: 'cond_water', label: 'Waterschade' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? 'Bezig…' : 'Reparatie aanmaken'}
    </Button>
  );
}

export function RepairIntakeForm({
  initialCustomer,
  initialDevice,
}: {
  initialCustomer: CustomerLite | null;
  initialDevice: DeviceLite | null;
}) {
  const [state, formAction] = useFormState(createRepair, { error: '' });

  // --- customer ---
  const [customer, setCustomer] = useState<CustomerLite | null>(initialCustomer);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerLite[]>([]);
  const [newCustomer, setNewCustomer] = useState(false);

  useEffect(() => {
    if (customer || customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerQuery)}`);
      setCustomerResults(res.ok ? await res.json() : []);
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery, customer]);

  // --- device ---
  const [device, setDevice] = useState<DeviceLite | null>(initialDevice);
  const [customerDevices, setCustomerDevices] = useState<DeviceLite[]>([]);
  const [newDevice, setNewDevice] = useState(false);

  useEffect(() => {
    if (!customer) {
      setCustomerDevices([]);
      return;
    }
    fetch(`/api/customers/${customer.id}/devices`)
      .then((r) => (r.ok ? r.json() : []))
      .then((devices: DeviceLite[]) => {
        setCustomerDevices(devices);
        if (devices.length === 0) setNewDevice(true);
      });
  }, [customer]);

  // --- repair type ---
  const [catalogItem, setCatalogItem] = useState<CatalogLite | null>(null);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogLite[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualPrice, setManualPrice] = useState('');

  useEffect(() => {
    if (catalogItem || catalogQuery.trim().length < 2) {
      setCatalogResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(catalogQuery)}`);
      setCatalogResults(res.ok ? await res.json() : []);
    }, 250);
    return () => clearTimeout(t);
  }, [catalogQuery, catalogItem]);

  const estimatedTotal = catalogItem
    ? catalogItem.selling_price * (1 + catalogItem.vat_rate / 100)
    : parseFloat(manualPrice || '0');

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. Customer */}
      <Card className="p-5">
        <SectionTitle icon={User} title="1. Klant" />
        {customer ? (
          <SelectedRow
            title={`${customer.first_name} ${customer.last_name}`}
            subtitle={`${customer.customer_number}${customer.phone ? ' · ' + customer.phone : ''}`}
            onChange={() => {
              setCustomer(null);
              setDevice(null);
              setNewCustomer(false);
            }}
          />
        ) : newCustomer ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Voornaam">
                <Input name="new_customer_first_name" required />
              </Field>
              <Field label="Achternaam">
                <Input name="new_customer_last_name" required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefoonnummer">
                <Input name="new_customer_phone" placeholder="06 12345678" />
              </Field>
              <Field label="E-mail">
                <Input name="new_customer_email" type="email" />
              </Field>
            </div>
            <button type="button" onClick={() => setNewCustomer(false)} className="text-sm text-[var(--accent)] underline">
              Toch bestaande klant zoeken
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Zoek op naam of telefoonnummer…"
                className="pl-9"
                autoFocus
              />
            </div>
            {customerResults.length > 0 && (
              <div className="mt-2 divide-y divide-ink-100 rounded border border-ink-100">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCustomer(c)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50"
                  >
                    <span className="font-medium text-ink-900">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-ink-400">{c.phone ?? c.email ?? c.customer_number}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setNewCustomer(true)} className="mt-2 text-sm text-[var(--accent)] underline">
              + Nieuwe klant aanmaken
            </button>
          </div>
        )}
      </Card>

      {/* 2. Device */}
      {(customer || newCustomer) && (
        <Card className="p-5">
          <SectionTitle icon={Smartphone} title="2. Apparaat" />
          {device ? (
            <SelectedRow
              title={`${device.brand} ${device.model}`}
              subtitle={device.imei ? `IMEI ${device.imei}` : 'Geen IMEI'}
              onChange={() => setDevice(null)}
            />
          ) : (
            <div className="space-y-3">
              {customerDevices.length > 0 && !newDevice && (
                <div className="divide-y divide-ink-100 rounded border border-ink-100">
                  {customerDevices.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDevice(d)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50"
                    >
                      <span className="font-medium text-ink-900">
                        {d.brand} {d.model}
                      </span>
                      <span className="text-ink-400">{d.color ?? ''}</span>
                    </button>
                  ))}
                </div>
              )}
              {!newDevice ? (
                <button type="button" onClick={() => setNewDevice(true)} className="text-sm text-[var(--accent)] underline">
                  + Nieuw apparaat toevoegen
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Merk">
                      <Input name="new_device_brand" required placeholder="Apple" />
                    </Field>
                    <Field label="Model">
                      <Input name="new_device_model" required placeholder="iPhone 13" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Kleur">
                      <Input name="new_device_color" />
                    </Field>
                    <Field label="Opslag">
                      <Input name="new_device_storage" placeholder="128GB" />
                    </Field>
                    <Field label="IMEI (optioneel)">
                      <Input name="new_device_imei" />
                    </Field>
                  </div>
                  {customerDevices.length > 0 && (
                    <button type="button" onClick={() => setNewDevice(false)} className="text-sm text-[var(--accent)] underline">
                      Toch een bestaand apparaat kiezen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 3. Repair type */}
      {(customer || newCustomer) && (device || newDevice) && (
        <Card className="p-5">
          <SectionTitle icon={Wrench} title="3. Reparatietype" />
          {catalogItem ? (
            <SelectedRow
              title={catalogItem.name}
              subtitle={`${formatEuro(catalogItem.selling_price * (1 + catalogItem.vat_rate / 100))} incl. BTW · Garantie ${catalogItem.warranty_months ?? '–'} mnd`}
              onChange={() => setCatalogItem(null)}
            />
          ) : manualMode ? (
            <div className="space-y-3">
              <Field label="Omschrijving">
                <Input name="manual_description" required placeholder="Bijv. Batterij vervangen" />
              </Field>
              <div className="grid grid-cols-3 gap-3 items-end">
                <Field label="Prijs">
                  <Input
                    name="manual_price"
                    type="number"
                    step="0.01"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                  />
                </Field>
                <Field label="BTW-tarief">
                  <select name="manual_vat_rate" defaultValue="21" className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
                    <option value="21">21%</option>
                    <option value="9">9%</option>
                    <option value="0">0%</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 pb-2 text-sm text-ink-600">
                  <input type="checkbox" name="manual_price_includes_vat" defaultChecked />
                  Prijs is incl. BTW
                </label>
              </div>
              <button type="button" onClick={() => setManualMode(false)} className="text-sm text-[var(--accent)] underline">
                Toch reparatietype uit catalogus kiezen
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <Input
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="Bijv. iPhone 13 scherm…"
                  className="pl-9"
                />
              </div>
              {catalogResults.length > 0 && (
                <div className="mt-2 divide-y divide-ink-100 rounded border border-ink-100">
                  {catalogResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCatalogItem(c)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50"
                    >
                      <span className="font-medium text-ink-900">{c.name}</span>
                      <span className="tabular-nums text-ink-600">
                        {formatEuro(c.selling_price * (1 + c.vat_rate / 100))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setManualMode(true)} className="mt-2 text-sm text-[var(--accent)] underline">
                + Handmatige regel invoeren
              </button>
            </div>
          )}
        </Card>
      )}

      {/* 4. Condition & notes */}
      {(catalogItem || manualMode) && (
        <Card className="p-5">
          <SectionTitle icon={Smartphone} title="4. Staat van het apparaat & klacht" />
          <div className="space-y-4">
            <div>
              <Label>Zichtbare schade</Label>
              <div className="flex flex-wrap gap-4">
                {CONDITION_FIELDS.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm text-ink-700">
                    <input type="checkbox" name={f.key} />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Overige schade / opmerkingen">
              <Textarea name="cond_other" rows={2} />
            </Field>
            <Field label="Klacht van klant">
              <Textarea name="customer_complaint" rows={2} placeholder="Wat meldt de klant?" />
            </Field>
            <Field label="Technische notities (intern)">
              <Textarea name="technician_notes" rows={2} />
            </Field>
          </div>
        </Card>
      )}

      {/* 5. Summary & submit */}
      {(catalogItem || manualMode) && (
        <Card className="flex items-center justify-between p-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-400">Geschatte prijs</div>
            <div className="font-display text-2xl font-semibold tabular-nums text-ink-950">
              {formatEuro(isNaN(estimatedTotal) ? 0 : estimatedTotal)}
            </div>
          </div>

          {/* hidden inputs carrying resolved selection state into the server action */}
          {customer && <input type="hidden" name="customer_id" value={customer.id} />}
          {device && <input type="hidden" name="device_id" value={device.id} />}
          {catalogItem && <input type="hidden" name="catalog_repair_type_id" value={catalogItem.id} />}

          {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
          <SubmitButton />
        </Card>
      )}
    </form>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
      <Icon size={16} className="text-[var(--accent)]" />
      {title}
    </div>
  );
}

function SelectedRow({ title, subtitle, onChange }: { title: string; subtitle: string; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-[var(--accent-border-soft)] bg-[var(--accent-soft)] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Check size={16} className="text-[var(--accent)]" />
        <div>
          <div className="text-sm font-medium text-ink-900">{title}</div>
          <div className="text-xs text-ink-500">{subtitle}</div>
        </div>
      </div>
      <button type="button" onClick={onChange} className="text-xs font-medium text-[var(--accent)] underline">
        Wijzigen
      </button>
    </div>
  );
}
