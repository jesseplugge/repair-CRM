import { Card } from '@/components/ui/primitives';
import type { LucideIcon } from 'lucide-react';

export function ComingSoon({
  icon: Icon,
  title,
  description,
  nextSteps,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  nextSteps: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{title}</h1>
        <p className="text-sm text-ink-600">{description}</p>
      </div>
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Icon size={28} className="text-ink-300" />
        <p className="max-w-md text-sm text-ink-500">
          Deze module is onderdeel van het volgende increment (zie README, §38-volgorde). Nog te bouwen:
        </p>
        <ul className="text-sm text-ink-600">
          {nextSteps.map((step) => (
            <li key={step}>&bull; {step}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
