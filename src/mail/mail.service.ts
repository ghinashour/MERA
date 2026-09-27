import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type MailTransport = 'resend' | 'smtp' | 'logged';

// Real delivery via Resend HTTP API (free tier, no SMTP ports) or SMTP.
// If neither is configured, emails are logged so nothing silently "sends".
@Injectable()
export class MailService {
  private tx: nodemailer.Transporter | null = null;
  constructor() {
    if (process.env.SMTP_HOST) {
      this.tx = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
    }
  }
  status(): { transport: MailTransport; configured: boolean } {
    if (process.env.RESEND_API_KEY) return { transport: 'resend', configured: true };
    if (this.tx) return { transport: 'smtp', configured: true };
    return { transport: 'logged', configured: false };
  }
  async send(to: string, subject: string, html: string): Promise<{ sent: boolean; transport: MailTransport; id?: string }> {
    const from = process.env.MAIL_FROM || 'MERA <hello@mera.shop>';
    if (process.env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html }),
      });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`resend: ${JSON.stringify(j)}`);
      return { sent: true, transport: 'resend', id: j.id };
    }
    if (!this.tx) {
      // eslint-disable-next-line no-console
      console.log(`[mail:logged] to=${to} subject=${subject}`);
      return { sent: false, transport: 'logged' };
    }
    const info = await this.tx.sendMail({ from, to, subject, html });
    return { sent: true, transport: 'smtp', id: info.messageId };
  }
  welcomeEmail(email: string) {
    return this.send(
      email,
      'Welcome to MERA — Join Our World',
      `<div style="font-family:Georgia,serif;max-width:560px"><h1>MERA</h1><p>Welcome to our world — new arrivals, stories, meaningful moments.</p><p>As a thank-you, enjoy <strong>10% off</strong> your first order with code <strong>WELCOME10</strong>.</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/shop">Shop New Arrivals →</a></p><p style="color:#888;font-size:12px">MERA · Objects worth keeping · PayPal + Cash on Delivery</p></div>`,
    );
  }
}
