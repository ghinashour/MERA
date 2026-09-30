'use client';
import { useEffect, useState } from 'react';
import { API, sid, money, waLink, getProducts, imgFor } from '../../lib/api';
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
  const [bag, setBag] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loadingBag, setLoadingBag] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const loadBag = async () => {
    setLoadingBag(true);
    try {
      const r = await fetch(`${API}/cart`, { headers: { 'x-session-id': sid() } });
      const j = await r.json().catch(() => []);
      setBag(Array.isArray(j) ? j : []);
    } catch {
      setBag([]);
    } finally {
      setLoadingBag(false);
    }
  };
  useEffect(() => {
    loadBag();
    getProducts().then((ps) => Array.isArray(ps) && setCatalog(ps)).catch(() => {}).finally(() => setCatalogReady(true));
  }, []);
  const imgSrc = (v: any): string | null => {
    if (typeof v !== 'string' || !v) return null;
    return v.startsWith('/public/') ? v.replace('/public/', '/') : v;
  };
  const byId = new Map(catalog.map((p: any) => [p.id, p]));
  const lines = bag.map((c: any) => {
    const p = byId.get(c?.productId);
    const title = c?.title && c.title !== 'Item' ? c.title : p?.title || c?.title || 'Item';
    const priceCents = (c?.priceCents || 0) > 0 ? c.priceCents : p?.priceCents || 0;
    const image = imgSrc(c?.image) || (p ? imgSrc(imgFor(p)) : null);
    return { ...c, title, priceCents, image };
  });
  const bagTotal = lines.reduce((a: number, b: any) => a + (b.priceCents || 0) * (b.qty || 1), 0);
  // Items the backend can actually order: known catalogue id with a real price.
  // Old bags may hold fallback ids (p1-p4) that show $0 and fail with "product not found".
  // Only flag invalid once the catalogue has loaded, to avoid false positives on first paint.
  const invalidLines = catalogReady ? lines.filter((c: any) => !byId.has(c.productId) || !(c.priceCents > 0)) : [];
  const validLines = catalogReady ? lines.filter((c: any) => byId.has(c.productId) && c.priceCents > 0) : lines;
  const removeInvalid = async () => {
    setCleaning(true);
    try {
      for (const c of invalidLines) {
        if (c?.id) await fetch(`${API}/cart/${c.id}`, { method: 'DELETE' }).catch(() => {});
      }
      await loadBag();
    } finally {
      setCleaning(false);
    }
  };
  // Registration is optional: guests check out with email only.
  // Accounts (/auth) exist for order history + faster checkout, not required.
  const pay = async () => {
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (!lines.length) { setError('Your bag is empty.'); return; }
    if (invalidLines.length) { setError('Some items in your bag are no longer available (shown as $0). Please remove them before checkout.'); return; }
    setPlacing(true);
    try {
      const cart = await (await fetch(`${API}/cart`, { headers: { 'x-session-id': sid() } })).json().catch(() => []);
      const list = Array.isArray(cart) ? cart : [];
      if (!list?.length) { setError('Your bag is empty.'); return; }
      const items = list.map((c: any) => ({ productId: c.productId, qty: c.qty, properties: c.properties }));
      const shipping = { name, phone, address };
      const res = await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, payMethod: method, items, shipping }) });
      const o = await res.json().catch(() => ({}));
      if (!res.ok || o?.statusCode >= 400 || o?.message) { setError(typeof o?.message === 'string' ? o.message : Array.isArray(o?.message) ? o.message.join(', ') : `Order failed (${res.status}).`); return; }
      if (!o?.id) { setError('Order failed — invalid response from server.'); return; }
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
    const orderShort = String((done as any)?.id || '').slice(0, 8) || 'confirmed';
    const wa = waLink(`Hello MERA! I just ordered ${orderShort} (${money(done.totalCents || 0)}). Email: ${done.email}`);
    return <div className="wrap" style={{ padding: 32, maxWidth: 640 }}>
      <h1>Thank you{''}!</h1>
      <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 20 }}>
        <p><strong>Order {orderShort} confirmed</strong></p>
        <p className="small">Receipt sent to {done.email} — Total {money(done.totalCents || 0)}</p>
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
    <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 16, marginBottom: 16 }}>
      <strong>Your gift ({lines.reduce((a: number, b: any) => a + (b.qty || 1), 0)} items) — {money(bagTotal)}</strong>
      {loadingBag && <p className="small">Loading your bag…</p>}
      {!loadingBag && invalidLines.length > 0 && (
        <div style={{ border: '1px solid #e5b4b4', background: '#fdeeee', padding: 10, marginTop: 10 }}>
          <p className="small" style={{ color: '#8a2b2b' }}>{invalidLines.length} item(s) in your bag are outdated (showing $0) and can’t be ordered. Remove them, then re-add from the shop or gift builder.</p>
          <button className="btn" onClick={removeInvalid} disabled={cleaning} style={{ padding: '8px 14px' }}>{cleaning ? 'Removing…' : 'Remove unavailable items →'}</button>
        </div>
      )}
      {!loadingBag && !lines.length ? <p className="small">Your bag is empty.</p> : lines.map((c: any) => (
        <div key={c.id || c.productId} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
          {c.image && <img src={c.image} alt={c.title} style={{ width: 56, height: 56, objectFit: 'cover' }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{c.title} × {c.qty}</div>
            <div className="small">{money(c.priceCents || 0)} each — {money((c.priceCents || 0) * (c.qty || 1))}</div>
            {(c.properties?.Occasion || c.properties?.Gift || c.properties?.Packaging || c.properties?.Note) && (
              <div className="small">
                {c.properties?.Occasion && <span>Occasion: {c.properties.Occasion} · </span>}
                {c.properties?.Gift && !c.properties?.Occasion && <span>Gift: {c.properties.Gift} · </span>}
                {c.properties?.Packaging && <span>{c.properties.Packaging} · </span>}
                {c.properties?.Note && <span>Note: “{c.properties.Note}”</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 8 }} />
    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" style={{ width: '100%', padding: 12, border: '1px solid var(--line)', marginBottom: 12 }} />
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <button className="btn" style={{ opacity: method === 'paypal' ? 1 : 0.6 }} onClick={() => setMethod('paypal')}>PayPal</button>
      <button className="btn" style={{ opacity: method === 'cod' ? 1 : 0.6 }} onClick={() => setMethod('cod')}>Pay on Delivery</button>
    </div>
    <button className="btn" onClick={pay} disabled={placing || loadingBag || !catalogReady || !validLines.length}>{placing ? 'Placing…' : 'Place order →'}</button>
    {error && <p style={{ color: 'crimson' }}>{error}</p>}
    <p><a className="u" href="/">← Home</a></p></div>;
}
