'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Panel, money, API, fetchJSON, nameForEmail, type Stats } from '../_lib';

export default function CustomersPage() {
  const { token, auth, ready } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const s = await fetchJSON(`${API}/admin/stats`, { headers: auth() });
      if (s?.kpis) setStats(s); else setError('Unexpected response from the API.');
    } catch (e: any) { setError(e?.message || 'Could not load customers.'); }
  }, [token, auth]);
  useEffect(() => { load(); }, [load]);
  if (!ready) return <p>Loading…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Dashboard</a> first.</p>;
  if (error) return <div><h1 className="adm-h1">Customers</h1><p className="adm-err">{error}</p><button className="btn" onClick={load}>Retry</button></div>;
  if (!stats) return <p>Loading customers…</p>;
  const top = stats.topCustomers || [];
  return (
    <div>
      <div className="adm-title-row"><div><h1 className="adm-h1">Customers</h1><p className="adm-sub">{stats.kpis.customers ?? 0} customers · {stats.kpis.repeatCustomers ?? 0} repeat buyers · {stats.kpis.subscribers ?? 0} subscribers.</p></div></div>
      <Panel title="Top customers by spend">
        <table className="adm-table">
          <thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            {top.map((c) => (
              <tr key={c.email}><td>{nameForEmail(c.email)}</td><td>{c.email}</td><td>{c.orders}</td><td>{money(c.revenue || 0)}</td></tr>
            ))}
          </tbody>
        </table>
        {!top.length && <p className="adm-sub">No customers yet.</p>}
      </Panel>
    </div>
  );
}
