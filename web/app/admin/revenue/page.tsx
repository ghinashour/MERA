'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Card, Bar, Kpi, money, API, fetchJSON, type Stats } from '../_lib';
export default function RevenuePage() {
  const { token, auth, ready } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const s = await fetchJSON(`${API}/admin/stats`, { headers: auth() });
      if (s?.kpis) setStats(s); else setError('Unexpected response from the API.');
    } catch (e: any) {
      setError(e?.message || 'Could not load revenue data.');
    }
  }, [token, auth]);
  useEffect(() => { load(); }, [load]);
  if (!ready) return <p>Loading revenue…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Overview</a> first.</p>;
  if (error) return <div><h1 className="adm-h1">Revenue &amp; sales analysis</h1><p style={{ color: 'crimson' }}>{error}</p><button className="btn" onClick={load}>Retry</button></div>;
  if (!stats) return <p>Loading revenue…</p>;
  const months = stats.months || [];
  const topProducts = stats.topProducts || [];
  const topCustomers = stats.topCustomers || [];
  const deadStock = stats.deadStock || [];
  const maxM = Math.max(1, ...months.map((m) => m.revenue || 0));
  const maxP = Math.max(1, ...topProducts.map((p) => p.revenue || 0));
  return <div><h1 className="adm-h1">Revenue &amp; sales analysis</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
      <Kpi label="Total revenue" value={money(stats.kpis.revenueCents || 0)} /><Kpi label="Avg order" value={money(stats.kpis.avgOrderCents || 0)} />
      <Kpi label="Live orders" value={String(stats.kpis.orders ?? 0)} /><Kpi label="Cancel rate" value={`${stats.kpis.cancelRate ?? 0}%`} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      <Card title="Revenue by month — last 6">
        {months.map((m) => <div key={m.month} style={{ marginBottom: 8 }}><div className="small">{m.month} · {m.orders} orders · {money(m.revenue || 0)}</div><Bar v={m.revenue || 0} max={maxM} /></div>)}
        {!months.length && <p className="small">No sales yet.</p>}
      </Card>
      <Card title="Top products by revenue">
        {topProducts.map((p) => <div key={p.id} style={{ marginBottom: 8 }}><div className="small">{p.title} · {p.qty} sold · {money(p.revenue || 0)}</div><Bar v={p.revenue || 0} max={maxP} /></div>)}
        {!topProducts.length && <p className="small">No sales yet.</p>}
        {deadStock.length > 0 && <p className="small">Dead stock ({deadStock.length}): {deadStock.slice(0, 5).map((p) => p.title).join(', ')}</p>}
      </Card>
      <Card title="Top customers by spend">
        {topCustomers.map((c) => <p key={c.email} className="small">{c.email} — {c.orders} orders · {money(c.revenue || 0)}</p>)}
        {!topCustomers.length && <p className="small">No customers yet.</p>}
        <p className="small">Repeat buyers: {stats.kpis.repeatCustomers ?? 0} of {stats.kpis.customers ?? 0}</p>
      </Card>
    </div></div>;
}
