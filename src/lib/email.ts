/**
 * Sends transactional email via Resend (resend.com). Server-only — never
 * import this from a client component.
 *
 * Requires RESEND_API_KEY in .env.local. Without it, this returns an error
 * the UI surfaces directly rather than silently failing — see the "E-mail"
 * buttons throughout the app.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      error:
        'E-mail is nog niet geconfigureerd. Voeg RESEND_API_KEY en RESEND_FROM_EMAIL toe aan .env.local (zie README).',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { error: `E-mail versturen mislukt (${response.status}): ${body}` };
    }
    return { error: undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'E-mail versturen mislukt.' };
  }
}
