'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Button } from '@/components/ui/primitives';
import { AlertTriangle } from 'lucide-react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <AlertTriangle size={28} strokeWidth={1.5} className="text-danger-600" />
        <p className="text-sm font-medium text-ink-900">{t('errorTitle')}</p>
        <Button variant="primary" onClick={reset}>
          {t('errorTryAgain')}
        </Button>
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="focus-ring text-xs text-ink-400 underline decoration-dotted underline-offset-2 hover:text-ink-600"
        >
          {t('errorDetails')}
        </button>
        {showDetails && (
          <pre className="w-full overflow-x-auto rounded bg-ink-50 p-3 text-left text-xs text-ink-500">
            {error.message}
            {error.digest ? `\n\n${error.digest}` : ''}
          </pre>
        )}
      </Card>
    </div>
  );
}
