'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createSupplier, updateSupplier, deleteSupplier } from '@/lib/actions/products';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete-button';
import { Plus } from 'lucide-react';

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  productCount: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('supplierManager');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('add')}
    </Button>
  );
}

function SupplierRow({ supplier }: { supplier: Supplier }) {
  const [fields, setFields] = useState({
    name: supplier.name,
    contact_name: supplier.contact_name ?? '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
  });
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('supplierManager');

  function saveIfChanged() {
    const changed =
      fields.name !== supplier.name ||
      fields.contact_name !== (supplier.contact_name ?? '') ||
      fields.phone !== (supplier.phone ?? '') ||
      fields.email !== (supplier.email ?? '');
    if (fields.name.trim() && changed) {
      startTransition(async () => {
        await updateSupplier(supplier.id, fields);
        router.refresh();
      });
    }
  }

  return (
    <div className="rounded border border-ink-100 p-3">
      <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1.5fr_auto] items-center gap-2">
        <Input
          value={fields.name}
          onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
          onBlur={saveIfChanged}
          disabled={pending}
          placeholder={t('name')}
        />
        <Input
          value={fields.contact_name}
          onChange={(e) => setFields((f) => ({ ...f, contact_name: e.target.value }))}
          onBlur={saveIfChanged}
          disabled={pending}
          placeholder={t('contact')}
        />
        <Input
          value={fields.phone}
          onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
          onBlur={saveIfChanged}
          disabled={pending}
          placeholder={t('phone')}
        />
        <Input
          value={fields.email}
          onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
          onBlur={saveIfChanged}
          disabled={pending}
          placeholder={t('email')}
        />
        <ConfirmDeleteButton
          title={t('deleteConfirmTitle')}
          body={t('deleteConfirmBody', { name: supplier.name })}
          onConfirm={() => deleteSupplier(supplier.id)}
        />
      </div>
      <p className="mt-1 text-xs text-ink-400">{t('productCount', { count: supplier.productCount })}</p>
    </div>
  );
}

export function SupplierManager({ suppliers }: { suppliers: Supplier[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createSupplier, { error: '' });
  const t = useTranslations('supplierManager');

  return (
    <div className="space-y-2">
      {suppliers.map((s) => (
        <SupplierRow key={s.id} supplier={s} />
      ))}
      {suppliers.length === 0 && <p className="text-sm text-ink-400">{t('empty')}</p>}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('name')}>
                <Input name="name" required placeholder={t('namePlaceholder')} />
              </Field>
              <Field label={t('contact')}>
                <Input name="contact_name" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('phone')}>
                <Input name="phone" />
              </Field>
              <Field label={t('email')}>
                <Input name="email" type="email" />
              </Field>
            </div>
            {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
            <div className="flex gap-2">
              <SubmitButton />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <Plus size={15} /> {t('add')}
        </button>
      )}
    </div>
  );
}
