'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createCategory, updateCategory, deleteCategory } from '@/lib/actions/products';
import { Button, Card, Input } from '@/components/ui/primitives';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete-button';
import { Plus } from 'lucide-react';

type Category = { id: string; name: string; productCount: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('categoryManager');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('add')}
    </Button>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [name, setName] = useState(category.name);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('categoryManager');

  function saveIfChanged() {
    if (name.trim() && name !== category.name) {
      startTransition(async () => {
        await updateCategory(category.id, name);
        router.refresh();
      });
    }
  }

  return (
    <div className="flex items-center gap-2 rounded border border-ink-100 px-3 py-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveIfChanged} className="flex-1" disabled={pending} />
      <span className="shrink-0 text-xs text-ink-400">{t('productCount', { count: category.productCount })}</span>
      <ConfirmDeleteButton
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirmBody', { name: category.name })}
        onConfirm={() => deleteCategory(category.id)}
      />
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createCategory, { error: '' });
  const t = useTranslations('categoryManager');

  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <CategoryRow key={c.id} category={c} />
      ))}
      {categories.length === 0 && <p className="text-sm text-ink-400">{t('empty')}</p>}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="flex items-end gap-2">
            <div className="flex-1">
              <Input name="name" required placeholder={t('namePlaceholder')} />
            </div>
            <SubmitButton />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
          </form>
          {state?.error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        </Card>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <Plus size={15} /> {t('add')}
        </button>
      )}
    </div>
  );
}
