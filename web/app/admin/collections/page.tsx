'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Panel, API, fetchJSON } from '../_lib';

export default function CollectionsPage() {
  const { token, auth, ready } = useAdmin();
  const [cols, setCols] = useState<any[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const c = await fetchJSON(`${API}/collections`);
      if (Array.isArray(c)) setCols(c); else setError('Unexpected response from the API.');
    } catch (e: any) { setError(e?.message || 'Could not load collections.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!ready) return <p>Loading…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Dashboard</a> first.</p>;
  return (
    <div>
      <div className="adm-title-row"><div><h1 className="adm-h1">Collections</h1><p className="adm-sub">Curated groupings across the store.</p></div></div>
      {error && <p className="adm-err">{error} <button className="adm-retry" onClick={load}>Retry</button></p>}
      <Panel title={`All collections (${cols.length})`}>
        {cols.map((c: any) => (
          <div className="adm-prod" key={c.id}>
            <div><div className="pn">{c.title}</div><div className="pc">/{c.handle} · {(c.products || []).length} products</div></div>
          </div>
        ))}
        {!cols.length && !error && <p className="adm-sub">No collections yet.</p>}
      </Panel>
    </div>
  );
}
