'use client';

import { useRef, useState, useTransition } from 'react';
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

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
    ctx.strokeStyle = '#14171C';
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
      setError('Vink aan dat de Algemene Voorwaarden zijn gelezen.');
      return;
    }
    if (!hasSignature.current || !canvasRef.current) {
      setError('Er is nog geen handtekening gezet.');
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
          Algemene Voorwaarden {termsVersionLabel}
        </h3>
        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-ink-100 bg-ink-50 p-3 text-sm text-ink-700">
          {termsContent}
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
          Ik heb de Algemene Voorwaarden gelezen en ga hiermee akkoord.
        </label>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Verklaring</h3>
        <ul className="space-y-1 text-sm text-ink-700">
          <li>• Het apparaat is afgegeven in de beschreven staat.</li>
          <li>• De gegevens van het apparaat zijn correct.</li>
          <li>• De geschatte prijs is begrepen, indien van toepassing.</li>
          <li>• Kennis genomen van en akkoord met de hierboven getoonde voorwaarden.</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Handtekening</h3>
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
            <RotateCcw size={15} /> Opnieuw
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={pending || !hasDrawn}>
            {pending ? 'Bezig…' : 'Ondertekenen'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
