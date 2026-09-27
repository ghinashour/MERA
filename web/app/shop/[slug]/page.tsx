'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, getProduct, getProducts, imgFor, money, sid } from '../../../lib/api';

export default function Detail({ params }: { params: { slug: string } }) {
  const [p, setP] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', rating: 5, text: '' });
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [related, setRelated] = useState<any[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus('loading'); setLoadError('');
      try {
        const j = await getProduct(params.slug);
        if (!alive) return;
        if (!j) {
          setP(null); setStatus('missing');
          // Offer alternatives instead of a dead end.
          try {
            const all = await getProducts();
            if (alive) setRelated(all.filter((x) => (x.stock ?? 1) > 0).slice(0, 4));
          } catch { /* ignore */ }
          return;
        }
        setP(j); setStatus('ready');
        try {
          const x = await (await fetch(`${API}/reviews?productId=${j.id}`, { cache: 'no-store' })).json();
          if (alive && Array.isArray(x)) setReviews(x);
        } catch { /* reviews are optional */ }
      } catch {
        if (!alive) return;
        setStatus('error');
        setLoadError('Could not load this item — please try again.');
      }
    })();
    return () => { alive = false; };
  }, [params.slug]);

  const add = async () => {
    if (!p) return;
    try {
      const r = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sid() },
        body: JSON.stringify({ productId: p.id, qty: 1 }),
      });
      if (!r.ok) throw 0;
      setNotice('Added to bag.');
    } catch {
      setNotice('Could not add to bag — please try again.');
    }
  };
  const sendReview = async () => {
    if (!p) return;
    try {
      const r = await fetch(`${API}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, ...form }) });
      if (!r.ok) throw 0;
      setForm({ name: '', rating: 5, text: '' });
      const x = await (await fetch(`${API}/reviews?productId=${p.id}`)).json();
      if (Array.isArray(x)) setReviews(x);
    } catch {
      setNotice('Could not submit the review — please try again.');
    }
  };

  if (status === 'loading') return <div className="wrap" style={{ padding: 32 }}>Loading…</div>;
  if (status === 'error') return (
    <div className="wrap" style={{ padding: 32 }}>
      <h1>Something went wrong</h1>
      <p>{loadError}</p>
      <p><Link className="u" href="/shop">← Shop</Link> · <Link className="u" href="/search">Search again</Link></p>
    </div>
  );
  if (status === 'missing' || !p) return (
    <div className="wrap" style={{ padding: 32 }}>
      <h1>That item couldn&apos;t be found.</h1>
      <p className="small">It may be sold out or removed — here are some alternatives:</p>
      <div className="grid4" style={{ marginTop: 16 }}>
        {related.map((r: any) => (
          <Link className="card" key={r.id} href={`/shop/${r.slug}`}>
            <div className="im"><img src={imgFor(r)} alt={r.title} /></div>
            <div className="tx">{r.title} — {money(r.priceCents)}</div>
          </Link>
        ))}
      </div>
      <p><Link className="u" href="/shop">← Shop</Link> · <Link className="u" href="/search">Search again</Link></p>
    </div>
  );

  return <div className="wrap" style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
    <img src={imgFor(p)} alt={p.title} />
    <div>
      <h1>{p.title}</h1>
      <p>{money(p.priceCents)} • {p.stock} in stock</p>
      <p className="small">{p.description}</p>
      <button className="btn" onClick={add}>Add to Bag →</button>
      {notice && <p className="small" role="status">{notice}</p>}
      <h3>Reviews ({reviews.length})</h3>
      {reviews.map((r: any) => <p key={r.id} className="small"><strong>{r.name}</strong> {r.rating}/5 — {r.text}</p>)}
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" style={{ display: 'block', marginBottom: 8, padding: 8, width: '100%' }} />
      <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Review" style={{ display: 'block', padding: 8, width: '100%' }} />
      <button className="btn" style={{ marginTop: 8 }} onClick={sendReview}>Submit review</button>
      <p><Link className="u" href="/shop">← Shop</Link></p>
    </div>
  </div>;
}
