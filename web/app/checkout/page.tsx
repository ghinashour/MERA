'use client';
import { useState } from 'react';
import { API, sid, money, waLink } from '../../lib/api';
type Done = { id: string; email: string; totalCents: number; payMethod: string; approve?: string; note?: string };
export default function Checkout() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState<'paypal' | 'cod'>('paypal');
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  // Registration is optional: guests check out with email only.
  // Accounts (/auth) exist for order history + faster checkout, not required.
  const pay = async () => {
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    setPlacing(true);
    try {
      const cart = await (await fetch(`${API}/cart`, { headers: { 'x-session-id': sid() } })).json();
      if (!cart?.length) { setError('Your bag is empty.'); return; }
      const items = cart.map((c: any) => ({ productId: c.productId, qty: c.qty, properties: c.properties }));
      const shipping = { name, phone, address };
      const o = await (await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, payMethod: method, items, shipping }) })).json();
      if (o?.statusCode >= 400 || o?.message) { setError(typeof o.message === 'string' ? o.message : 'Order failed.'); return; }
      if (method === 'cod') {
        setDone({ ...o, note: 'Pay cash/card on delivery. We will call to confirm.' });
      } else {
        const pp = await (await fetch(`${API}/payments/paypal/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ totalCents: o.totalCents }) })).json().catch(() => null);
        const link = pp?.links?.find((l: any) => l.rel === 'approve')?.href;
        setDone({ ...o, approve: link });
      }
      await fetch(`${API}/cart/clear`, { method: 'DELETE', headers: { 'x-session-id': sid() } }).catch(() => {});
    } catch { setError('Checkout failed — is the API running on :3000?'); }
    finally { setPlacing(false); }
  };
  if (done) {
    const wa = waLink(`Hello MERA! I just ordered ${done.id} (${money(done.totalCents)}). Email: ${done.email}`);
    return <div className="wrap" style={{ padding: 32, maxWidth: 640 }}>
      <h1>Thank you{''}!</h1>
      <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 20 }}>
        <p><strong>Order {done.id.slice(0, 8)} confirmed</strong></p>
        <p className="small">Receipt sent to {done.email} — Total {money(done.totalCents)}</p>
        {done.note && <p>{done.note}</p>}
        {method === 'paypal' && (done.approve
          ? <p><a className="btn" href={done.approve}>Approve on PayPal →</a></p>
          : <p className="small">PayPal approval link unavailable — set PAYPAL_CLIENT_ID/SECRET in API .env. You can also pay on delivery or via WhatsApp.</p>)}
        <p><a className="btn" href={wa} target="_blank" rel="noreferrer">Confirm on WhatsApp →</a></p>
        <p><a className="u" href="/shop">Continue shopping →</a></p>
      </div></div>;
  }
  return <div className="wrap" style={{ padding: 32, maxWidth: 640 }}><h1>Checkout</h1>
    <p className="small">Guest checkout — no account needed. <a className="u" href="/auth">Register / login</a> for order history.</p>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 12 }} />
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <button className="btn" style={{ opacity: method === 'paypal' ? 1 : 0.6 }} onClick={() => setMethod('paypal')}>PayPal</button>
      <button className="btn" style={{ opacity: method === 'cod' ? 1 : 0.6 }} onClick={() => setMethod('cod')}>Pay on Delivery</button>
    </div>
    <button className="btn" onClick={pay} disabled={placing}>{placing ? 'Placing…' : 'Place order →'}</button>
    {error && <p style={{ color: 'crimson' }}>{error}</p>}
    <p><a className="u" href="/">← Home</a></p></div>;
}
