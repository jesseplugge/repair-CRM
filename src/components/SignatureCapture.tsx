'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createIntakeSignature } from '@/lib/actions/signatures';
import { Button, Card } from '@/components/ui/primitives';
import { RotateCcw } from 'lucide-react';

export function SignatureCapture({
  repairId,
  termsContent,
  termsVersionLabel,
  onSuccess,
}: {
  repairId: string;
  termsContent: string;
  termsVersionLabel: string;
  onSuccess: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasSignature = useRef(false);
  const [checked, setChecked] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useTranslations('signatureCapture');

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // The canvas's drawing buffer (width/height attrs) is a fixed 600x180, but it renders
    // at whatever CSS width its container gives it — scale pointer coordinates into the
    // buffer's coordinate space, or the line drawn won't track the cursor.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getCtx();
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1C1917';
    ctx.lineTo(x, y);
    ctx.stroke();
    hasSignature.current = true;
    setHasDrawn(true);
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature.current = false;
    setHasDrawn(false);
  }

  function handleSubmit() {
    setError(null);
    if (!checked) {
      setError(t('mustCheckTerms'));
      return;
    }
    if (!hasSignature.current || !canvasRef.current) {
      setError(t('noSignatureYet'));
      return;
    }
    const dataUrl = canvasRef.current.toDataURL('image/png');
    startTransition(async () => {
      const result = await createIntakeSignature(repairId, dataUrl, checked);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          {t('termsHeading', { version: termsVersionLabel })}
        </h3>
        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-ink-100 bg-ink-50 p-3 text-sm text-ink-700">
          {termsContent}
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
          {t('termsAgree')}
        </label>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('declaration')}</h3>
        <ul className="space-y-1 text-sm text-ink-700">
          <li>• {t('declarationDeviceCondition')}</li>
          <li>• {t('declarationDeviceDataCorrect')}</li>
          <li>• {t('declarationPriceUnderstood')}</li>
          <li>• {t('declarationTermsAccepted')}</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('signature')}</h3>
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full touch-none rounded border border-dashed border-ink-300 bg-white"
          style={{ height: 180 }}
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="ghost" onClick={handleClear}>
            <RotateCcw size={15} /> {t('redo')}
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={pending || !hasDrawn}>
            {pending ? t('busy') : t('sign')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
