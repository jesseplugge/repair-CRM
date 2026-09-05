import { ComingSoon } from '@/components/ComingSoon';
import { Receipt } from 'lucide-react';

export default function BonnenPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Bonnen"
      description="Kassabonnen, intakebonnen en ondertekende reparatiebewijzen."
      nextSteps={[
        'PDF-lay-outs voor A4 / A5 / 80mm / 58mm',
        'Intakebon met ondertekening en Algemene Voorwaarden-versie (§15A)',
        'E-mail en printen',
      ]}
    />
  );
}
