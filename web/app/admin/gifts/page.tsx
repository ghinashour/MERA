'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Panel, money, API, fetchJSON, orderNo, fmtDay, nameForEmail } from '../_lib';

const PACKAGING = [
  { name: 'Kraft + ribbon', fee: 0 },
  { name: 'Linen pouch', fee: 600 },
  { name: 'Keepsake box', fee: 1200 },
];

export default function GiftsPage() {
  const { token, auth, ready } = useAdmin();
  const [gifted, setGifted] = useState<any[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const o = await fetchJSON(`${API}/admin/orders?limit=200`, { headers: auth() });
      if (Array.isArray(o)) setGifted(o.filter((x: any) => x.gift || (x.items || []).some((i: any) => i.properties && Object.keys(i.properties).length)));
      else setError('Unexpected response from the API.');
    } catch (e: any) { setError(e?.message || 'Could not load gift orders.'); }
  }, [token, auth]);
  useEffect(() => { load(); }, [load]);
  if (!ready) return <p>Loading…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Dashboard</a> first.</p>;
  return (
    <div>
      <div className="adm-title-row"><div><h1 className="adm-h1">Gift Sets</h1><p className="adm-sub">Packaging options and recent gifted orders.</p></div></div>
      {error && <p className="adm-err">{error} <button className="adm-retry" onClick={load}>Retry</button></p>}
      <div className="adm-grid2">
        <Panel title="Packaging">
          {PACKAGING.map((p) => (
            <div className="adm-prod" key={p.name}>
              <div><div className="pn">{p.name}</div><div className="pc">{p.fee ? `+ ${money(p.fee)} per order` : 'Included'}</div></div>
            </div>
          ))}
        </Panel>
        <Panel title={`Gifted orders (${gifted.length})`} viewHref="/admin/orders">
          {gifted.slice(0, 8).map((o: any) => (
            <div className="adm-task" key={o.id}>
              <div className="tt">{orderNo(o.id)} · {nameForEmail(o.email)} · {(o.items || []).map((i: any) => `${i.title} ×${i.qty}`).join(' · ')}</div>
              <span className="dt">{fmtDay(o.createdAt)}</span>
            </div>
          ))}
          {!gifted.length && !error && <p className="adm-sub">No gifted orders yet.</p>}
        </Panel>
      </div>
    </div>
  );
}
