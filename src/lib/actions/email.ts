'use server';

import { getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendPdfEmail } from '@/lib/email';
import {
  generateIntakePdf,
  generateCompletionPdf,
  generateInvoicePdf,
  generateSignedIntakePdf,
  generatePosReceiptPdf,
} from '@/lib/pdf/generate';
import type { DocFormat } from '@/lib/pdf/format';

type EmailResult = { error?: string; success?: boolean };

function html(businessName: string, greeting: string) {
  return `<p>Beste,</p><p>${greeting}</p><p>Met vriendelijke groet,<br/>${businessName}</p>`;
}

export async function emailIntakeDocument(repairId: string, overrideEmail?: string): Promise<EmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const pdf = await generateIntakePdf(repairId, user.business_id, user.id, 'a4' as DocFormat);
  if (!pdf) return { error: 'Reparatie niet gevonden.' };
  const to = overrideEmail || pdf.customerEmail;
  if (!to) return { error: 'Geen e-mailadres bekend voor deze klant.' };

  const result = await sendPdfEmail({
    to,
    subject: `Innamebewijs ${pdf.documentNumber}`,
    html: html('ons reparatiebedrijf', 'Hierbij ontvangt u het innamebewijs van uw reparatie.'),
    filename: pdf.filename,
    pdfBuffer: pdf.buffer,
  });
  return result.error ? { error: result.error } : { success: true };
}

export async function emailCompletionReceipt(repairId: string, overrideEmail?: string): Promise<EmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const pdf = await generateCompletionPdf(repairId, user.business_id, user.id, 'a4' as DocFormat);
  if (!pdf) return { error: 'Reparatie niet gevonden.' };
  const to = overrideEmail || pdf.customerEmail;
  if (!to) return { error: 'Geen e-mailadres bekend voor deze klant.' };

  const result = await sendPdfEmail({
    to,
    subject: `Kassabon ${pdf.documentNumber}`,
    html: html('ons reparatiebedrijf', 'Bedankt voor uw bezoek. Hierbij de kassabon van uw reparatie.'),
    filename: pdf.filename,
    pdfBuffer: pdf.buffer,
  });
  return result.error ? { error: result.error } : { success: true };
}

export async function emailInvoice(invoiceId: string, overrideEmail?: string): Promise<EmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const pdf = await generateInvoicePdf(invoiceId, user.business_id);
  if (!pdf) return { error: 'Factuur niet gevonden.' };
  const to = overrideEmail || pdf.customerEmail;
  if (!to) return { error: 'Geen e-mailadres bekend voor deze klant.' };

  const result = await sendPdfEmail({
    to,
    subject: `Factuur ${pdf.documentNumber}`,
    html: html('ons reparatiebedrijf', 'Hierbij ontvangt u de factuur.'),
    filename: pdf.filename,
    pdfBuffer: pdf.buffer,
  });
  return result.error ? { error: result.error } : { success: true };
}

export async function emailSignedIntake(repairId: string, overrideEmail?: string): Promise<EmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const pdf = await generateSignedIntakePdf(repairId, user.business_id);
  if (!pdf) return { error: 'Nog niet ondertekend.' };
  const to = overrideEmail || pdf.customerEmail;
  if (!to) return { error: 'Geen e-mailadres bekend voor deze klant.' };

  const result = await sendPdfEmail({
    to,
    subject: `Ondertekend innamebewijs ${pdf.documentNumber}`,
    html: html('ons reparatiebedrijf', 'Hierbij een kopie van het ondertekende innamebewijs.'),
    filename: pdf.filename,
    pdfBuffer: pdf.buffer,
  });
  return result.error ? { error: result.error } : { success: true };
}

export async function emailPosReceipt(saleId: string, overrideEmail?: string): Promise<EmailResult> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const pdf = await generatePosReceiptPdf(saleId, user.business_id, user.id, 'a4' as DocFormat);
  if (!pdf) return { error: 'Verkoop niet gevonden.' };
  const to = overrideEmail || pdf.customerEmail;
  if (!to) return { error: 'Geen e-mailadres bekend.' };

  const result = await sendPdfEmail({
    to,
    subject: `Bon ${pdf.documentNumber}`,
    html: html('ons reparatiebedrijf', 'Bedankt voor uw aankoop. Hierbij de bon.'),
    filename: pdf.filename,
    pdfBuffer: pdf.buffer,
  });
  return result.error ? { error: result.error } : { success: true };
}
