import { Injectable } from '@nestjs/common';

// PayPal REST v2 via fetch — no SDK lock-in. COD needs no provider.
@Injectable()
export class PaymentsService {
  private base() { return process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'; }
  private async token(): Promise<string> {
    const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_SECRET;
    if (!id || !secret) throw new Error('PAYPAL_CLIENT_ID/SECRET missing');
    const r = await fetch(`${this.base()}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const j: any = await r.json();
    return j.access_token;
  }
  async createPaypalOrder(totalCents: number, currency = 'USD') {
    const t = await this.token();
    const r = await fetch(`${this.base()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: currency, value: (totalCents / 100).toFixed(2) } }] }),
    });
    return r.json();
  }
  async capturePaypalOrder(paypalOrderId: string) {
    const t = await this.token();
    const r = await fetch(`${this.base()}/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } });
    return r.json();
  }
}
