'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API, getProducts, imgFor, money, sid } from '../../lib/api';

// Results page for a matching word: every item links to its item page
// AND has an Add to bag button. Supports deep links like /search?q=mug.
function SearchInner() {
  const params = useSearchParams();
  const initial = params.get('q') || '';
  const [q, setQ] = useState(initial);
  const [res, setRes] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');

  const go = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) { setRes([]); setSearched(false); return; }
    setLoading(true); setError('');
    try {
      setRes((await getProducts(t)).filter((p) => (p.stock ?? 1) > 0));
    } catch {
      setError('Search failed — please try again.');
      setRes([]);
    } finally { setLoading(false); setSearched(true); }
  }, []);

  // Auto-run when opened via /search?q=… (e.g. from the header search).
  useEffect(() => { if (initial.trim()) go(initial); }, [initial, go]);
  // Keep the box in sync if the ?q= param changes while staying on this page.
  useEffect(() => { setQ(initial); }, [initial]);

  const add = async (id: string, title: string) => {
    try {
      const r = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sid() },
        body: JSON.stringify({ productId: id, qty: 1 }),
      });
      if (!r.ok) throw 0;
      setAdded(`${title} added to your bag.`);
      setTimeout(() => setAdded(''), 2500);
    } catch {
      setAdded('Could not add to bag — please try again.');
    }
  };

  return (
    <div className="wrap" style={{ padding: 32 }}>
      <h1>Search</h1>
      <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); go(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="scarves, mugs…" style={{ padding: 12, width: 320, border: '1px solid var(--line)' }} />
        <button className="btn" type="submit">Search</button>
      </form>
      {added && <p className="small" role="status">{added}</p>}
      {loading && <p className="small">Searching…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {searched && !loading && !error && res.length === 0 && <p>That item couldn&apos;t be found.</p>}
      <div className="grid4" style={{ marginTop: 16 }}>
        {res.map((p) => (
          <div className="card" key={p.id}>
            <Link href={`/shop/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="im"><img src={imgFor(p)} alt={p.title} /></div>
              <div className="tx">{p.title} — {money(p.priceCents)}</div>
            </Link>
            <div style={{ padding: '0 12px 12px' }}>
              <button className="btn" style={{ marginTop: 8 }} onClick={() => add(p.id, p.title)}>Add to bag →</button>
            </div>
          </div>
        ))}
      </div>
      {!!res.length && <p><Link className="u" href="/shop">← Shop all</Link></p>}
    </div>
  );
}

export default function Search() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: 32 }}>Loading search…</div>}>
      <SearchInner />
    </Suspense>
  );
}
