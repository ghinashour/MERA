'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducts, imgFor, money } from '../lib/api';

// Inline search: opens a search box over the page and filters the collection live.
// Enter (or "See all results") goes to /search?q=… — a full results page where
// every match links to its item page and has an Add to bag button.
export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open ]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    const term = q.trim();
    if (!term) { setRes([]); setSearched(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const list = await getProducts(term);
        setRes(list.filter((p) => (p.stock ?? 1) > 0));
      } catch {
        setRes([]);
      } finally { setLoading(false); setSearched(true); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const term = q.trim();
  const goAll = () => {
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer', padding: 0 }}>Search</button>
      {open && (
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, background: '#fffdf9', borderBottom: '1px solid var(--line)', zIndex: 40, boxShadow: '0 12px 30px rgba(0,0,0,.08)' }}>
          <div className="wrap" style={{ paddingTop: 16, paddingBottom: 20 }}>
            <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); goAll(); }}>
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scarves, mugs…" style={{ padding: 12, flex: 1, border: '1px solid var(--line)' }} />
              <button className="btn" type="submit" disabled={!term}>Search →</button>
              <button className="btn" type="button" onClick={() => setOpen(false)} style={{ opacity: 0.7 }}>Close</button>
            </form>
            {loading && <p className="small">Searching…</p>}
            {searched && !loading && res.length === 0 && <p>That item couldn&apos;t be found.</p>}
            {!!res.length && (
              <>
                <div className="grid4" style={{ marginTop: 16 }}>
                  {res.slice(0, 8).map((p) => (
                    <Link className="card" key={p.id} href={`/shop/${p.slug}`} onClick={() => setOpen(false)}>
                      <div className="im"><img src={imgFor(p)} alt={p.title} /></div>
                      <div className="tx">{p.title} — {money(p.priceCents)}</div>
                    </Link>
                  ))}
                </div>
                <p style={{ marginTop: 12 }}>
                  <button onClick={goAll} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                    See all {res.length} result{res.length === 1 ? '' : 's'} for “{term}” — add to bag →
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
