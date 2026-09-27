'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin, Card, Kpi, money, API, fetchJSON, type Stats } from '../_lib';
function OrdersInner() {
  const { token, auth, ready } = useAdmin();
  const params = useSearchParams();
  const searchQ = (params.get('q') || '').trim().toLowerCase();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [fStatus, setFStatus] = useState(''); const [fPay, setFPay] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const s = await fetchJSON(`${API}/admin/stats`, { headers: auth() }).catch(() => null);
      if (s?.kpis) setStats(s);
      const q = new URLSearchParams({ ...(fStatus ? { status: fStatus } : {}), ...(fPay ? { pay: fPay } : {}), limit: '200' });
      const o = await fetchJSON(`${API}/admin/orders?${q}`, { headers: auth() }).catch(() => null);
      if (Array.isArray(o)) setOrders(o);
      else { setOrders([]); setError('Could not load orders.'); }
    } catch (e: any) {
      setError(e?.message || 'Could not load orders.');
    }
  }, [token, auth, fStatus, fPay]);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id: string, status: string) => {
    try {
      await fetchJSON(`${API}/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ status }) });
      setNotice(`Order → ${status}.`);
      load();
    } catch {
      setNotice('Could not update the order — please try again.');
    }
  };
  const csv = () => {
    const rows = [['id', 'email', 'total', 'pay', 'status', 'date'], ...orders.map((o: any) => [o.id, o.email, ((o.totalCents || 0) / 100).toFixed(2), o.payMethod, o.status, o.createdAt])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })); a.download = 'mera-orders.csv'; a.click();
  };
  if (!ready) return <p>Loading orders…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Overview</a> first.</p>;
  const byStatus = stats?.byStatus || {};
  const byPay = stats?.byPay || {};
  const paid = stats ? stats.funnel.paid : 0;
  const totalOrders = stats?.kpis.orders || 1;
  const shown = searchQ
    ? orders.filter((o: any) =>
        (o.email || '').toLowerCase().includes(searchQ) ||
        (o.id || '').toLowerCase().includes(searchQ) ||
        (o.status || '').toLowerCase().includes(searchQ) ||
        (o.items || []).some((i: any) => (i.title || '').toLowerCase().includes(searchQ)))
    : orders;
  return <div><h1 className="adm-h1">Orders &amp; payments</h1>
    {error && <p style={{ color: 'crimson' }}>{error} <button onClick={load} style={{ textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>Retry</button></p>}
    {notice && <p className="small" role="status">{notice}</p>}
    {stats && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
      <Kpi label="Total orders" value={String(stats.kpis.orders ?? 0)} /><Kpi label="Paid" value={String(paid)} />
      <Kpi label="Pending" value={String(stats.funnel.pending ?? 0)} /><Kpi label="Cancelled" value={String(stats.funnel.cancelled ?? 0)} />
      <Kpi label="PayPal orders" value={`${byPay['paypal']?.orders || 0} (${money(byPay['paypal']?.revenue || 0)})`} />
      <Kpi label="COD orders" value={`${byPay['cod']?.orders || 0} (${money(byPay['cod']?.revenue || 0)})`} />
    </div>}
    <Card title="Pipeline by status">
      {Object.entries(byStatus).map(([s, n]) => <p key={s} className="small">{s}: {n} ({(((n as number) / Math.max(1, totalOrders)) * 100).toFixed(1)}%)</p>)}
      {!Object.keys(byStatus).length && <p className="small">No orders yet.</p>}
    </Card>
    <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
      <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ padding: 10 }}><option value="">All statuses</option>{Object.keys(byStatus).map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={fPay} onChange={(e) => setFPay(e.target.value)} style={{ padding: 10 }}><option value="">PayPal + COD</option><option value="paypal">PayPal</option><option value="cod">COD</option></select>
      <button className="btn" onClick={load}>Filter</button><button className="btn" onClick={csv}>Export CSV</button>
    </div>
    {searchQ && <p className="small">Search: “{params.get('q')}” — {shown.length} of {orders.length} orders.</p>}
    {shown.map((o: any) => <div key={o.id} style={{ border: '1px solid var(--line)', padding: 10, marginBottom: 8, background: '#fff' }}>
      <div><strong>{o.email}</strong> — {money(o.totalCents || 0)} — {o.payMethod} — <strong>{o.status}</strong> <span className="small">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</span></div>
      <div className="small">{(o.items || []).map((i: any) => `${i.title} ×${i.qty}`).join(' · ')}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{['confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => <button key={s} onClick={() => setStatus(o.id, s)}>{s}</button>)}</div>
    </div>)}
    {!shown.length && !error && <p className="small">No orders match.</p>}
  </div>;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading orders…</p>}>
      <OrdersInner />
    </Suspense>
  );
}
