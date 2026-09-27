'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, imgFor, money, sid, API, type Product } from '../../lib/api';
export default function Shop() {
  const [ps, setPs] = useState<Product[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => { getProducts().then(setPs).catch(() => setPs([])); }, []);
  const add = async (id: string, title: string) => {
    try {
      const r = await fetch(`${API}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sid() }, body: JSON.stringify({ productId: id, qty: 1 }) });
      if (!r.ok) throw 0;
      setNotice(`${title} added to your bag.`);
      setTimeout(() => setNotice(''), 2500);
    } catch {
      setNotice('Could not add to bag — please try again.');
    }
  };
  return <div className="wrap" style={{ padding: 32 }}><h1>Shop All</h1>
    {notice && <p className="small" role="status">{notice}</p>}
    <div className="grid4">{ps.map((p) => (
      <div className="card" key={p.id}>
        <Link href={`/shop/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="im"><img src={imgFor(p)} alt={p.title} /></div>
          <div className="tx">{p.title} — {money(p.priceCents)}</div>
        </Link>
        <div style={{ padding: '0 12px 12px' }}><button className="btn" style={{ marginTop: 8 }} onClick={() => add(p.id, p.title)}>Add →</button></div>
      </div>))}</div>
    {!ps.length && <p className="small">No products yet.</p>}
    <p><a className="u" href="/">← Home</a></p></div>;
}
