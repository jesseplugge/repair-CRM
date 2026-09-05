import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { RepairIntakeForm } from './RepairIntakeForm';

export default async function NieuweReparatiePage({
  searchParams,
}: {
  searchParams: { customer_id?: string; device_id?: string };
}) {
  const user = await getCurrentUser();
  const supabase = createClient();

  let initialCustomer = null;
  if (searchParams.customer_id) {
    const { data } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone, email, customer_number')
      .eq('id', searchParams.customer_id)
      .eq('business_id', user!.business_id)
      .single();
    initialCustomer = data;
  }

  let initialDevice = null;
  if (searchParams.device_id) {
    const { data } = await supabase.from('devices').select('*').eq('id', searchParams.device_id).single();
    initialDevice = data;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Nieuwe reparatie</h1>
        <p className="text-sm text-ink-600">Klant → apparaat → reparatietype → intake. Eén keer invullen.</p>
      </div>
      <RepairIntakeForm initialCustomer={initialCustomer} initialDevice={initialDevice} />
    </div>
  );
}
