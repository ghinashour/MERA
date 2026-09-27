'use client';
import { useEffect, useState } from 'react';
import { API } from '../../lib/api';
export default function Account() {
  const [email, setEmail] = useState(''); const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { setEmail(localStorage.getItem('mera-email') || ''); }, []);
  const load = async () => { const r = await fetch(`${API}/orders?email=${encodeURIComponent(email)}`); setOrders(await r.json()); };
  return <div className="wrap" style={{ padding: 32 }}><h1>My Orders</h1>
    <div style={{ display: 'flex', gap: 8 }}><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: 10, width: 280 }} /><button className="btn" onClick={load}>Load</button></div>
    {orders.map((o: any) => <div key={o.id} style={{ border: '1px solid var(--line)', padding: 12, marginTop: 12 }}><div><strong>{o.id.slice(0, 8)}</strong> — {(o.totalCents / 100).toFixed(2)} — {o.payMethod} — {o.status}</div><div className="small">{o.items?.map((i: any) => `${i.title}×${i.qty}`).join(', ')}</div></div>)}
  </div>;
}
