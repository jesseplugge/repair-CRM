'use client';

import { useRouter } from 'next/navigation';
import { SignatureCapture } from '@/components/SignatureCapture';

export function OndertekenenClient({
  repairId,
  termsContent,
  termsVersionLabel,
}: {
  repairId: string;
  termsContent: string;
  termsVersionLabel: string;
}) {
  const router = useRouter();
  return (
    <SignatureCapture
      repairId={repairId}
      termsContent={termsContent}
      termsVersionLabel={termsVersionLabel}
      onSuccess={() => router.refresh()}
    />
  );
}
