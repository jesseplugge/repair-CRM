import { NewCustomerForm } from './NewCustomerForm';

export default function NieuweKlantPage({ searchParams }: { searchParams: { redirect_to?: string } }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Nieuwe klant</h1>
        <p className="text-sm text-ink-600">Alleen naam is verplicht — de rest kan later worden aangevuld.</p>
      </div>
      <NewCustomerForm redirectTo={searchParams.redirect_to} />
    </div>
  );
}
