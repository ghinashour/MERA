'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAdmin, Panel, Spark, money, API, fetchJSON,
  nameForEmail, orderNo, fmtDay, statusKind, deltaPct, categoryFor, type Stats,
} from './_lib';
import { getProducts, imgFor } from '../../lib/api';

type Task = { id: string; text: string; due: string; href: string };

function deltaLine(d: number | null, caption: string) {
  if (d === null || !Number.isFinite(d)) return <span>— <span>· {caption}</span></span>;
  const up = d >= 0;
  return <span><b className={up ? 'up' : 'dn'}>{up ? '↗' : '↘'} {up ? '+' : ''}{d.toFixed(0)}%</b> <span>· {caption}</span></span>;
}

export default function AdminDashboard() {
  const { token, setToken, email, setEmail, auth, ready } = useAdmin();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [range, setRange] = useState<'7' | '14'>('14');
  const [done, setDone] = useState<Record<string, boolean>>({});

  const login = async () => {
    setErr('');
    try {
      const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const j = await r.json().catch(() => ({}));
      if (j.access_token) { setToken(j.access_token, email); load(j.access_token); }
      else setErr('Invalid admin credentials.');
    } catch {
      setErr('Login failed — is the API running?');
    }
  };

  const load = useCallback(async (t = token) => {
    if (!t) return;
    setLoadError('');
    try {
      const s = await fetchJSON(`${API}/admin/stats`, { headers: auth(t) });
      if (s?.kpis) setStats(s);
      fetchJSON(`${API}/admin/messages`, { headers: auth(t) }).then((m) => { if (Array.isArray(m)) setMsgs(m); }).catch(() => {});
      getProducts().then((ps) => {
        const m: Record<string, string> = {};
        for (const p of ps) m[p.id] = imgFor(p);
        setImages(m);
      }).catch(() => {});
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load dashboard data.');
    }
  }, [token, auth]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const tasks: Task[] = useMemo(() => {
    if (!stats) return [];
    const out: Task[] = [];
    for (const p of (stats.lowStock || []).slice(0, 2))
      out.push({ id: `reorder-${p.id}`, text: `Reorder ${p.title} — only ${p.stock} left`, due: 'Low stock', href: '/admin/stock' });
    const pending = (stats.recent || []).filter((o: any) => /pending|awaiting|confirm/i.test(o.status || '')).slice(0, 2);
    for (const o of pending)
      out.push({ id: `confirm-${o.id}`, text: `Confirm order ${orderNo(o.id)} (${nameForEmail(o.email)})`, due: fmtDay(o.createdAt) || 'Today', href: '/admin/orders' });
    for (const m of msgs.slice(0, 2))
      out.push({ id: `reply-${m.id}`, text: `Reply to ${m.name || m.email || 'a customer'}`, due: fmtDay(m.createdAt) || 'Inbox', href: '/admin/content' });
    const dead = (stats.deadStock || [])[0];
    if (dead && out.length < 5) out.push({ id: `dead-${dead.id}`, text: `Review slow seller: ${dead.title}`, due: 'Analytics', href: '/admin/revenue' });
    return out.slice(0, 5);
  }, [stats, msgs]);

  if (!ready) return <p>Loading admin…</p>;
  if (!token) return (
    <div className="adm-login">
      <h1>Admin login</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button className="btn" onClick={login}>Login →</button>
      {err && <p className="adm-err">{err}</p>}
    </div>
  );

  const k = stats?.kpis;
  const days = (stats?.days || []).slice(-Number(range));
  const months = stats?.months || [];
  const ml = months.length;
  const ordersDelta = ml >= 2 ? deltaPct(months[ml - 1].orders, months[ml - 2].orders) : null;
  const revenueDelta = ml >= 2 ? deltaPct(months[ml - 1].revenue, months[ml - 2].revenue) : null;
  const repeatShare = k && k.customers ? Math.round(((k.repeatCustomers || 0) / k.customers) * 100) : 0;
  const maxRev = Math.max(1, ...days.map((d) => d.revenue || 0));
  const yTop = maxRev >= 100000 ? `$${Math.round(maxRev / 1000)}K` : money(maxRev);
  const recent = (stats?.recent || []).slice(0, 8);
  const top = (stats?.topProducts || []).slice(0, 4);

  return (
    <div>
      <div className="adm-title-row">
        <div><h1 className="adm-h1">Dashboard</h1><p className="adm-sub">An overview of your store performance and activity.</p></div>
        <label className="adm-range">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <select value={range} onChange={(e) => setRange(e.target.value as '7' | '14')} aria-label="Chart range">
            <option value="14">Last 14 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </label>
      </div>

      {loadError && <p className="adm-err">{loadError} <button className="adm-retry" onClick={() => load()}>Retry</button></p>}
      {!stats && !loadError && <p>Loading dashboard…</p>}

      {k && (
        <div className="adm-kpis">
          <div className="adm-kpi">
            <span className="lb">Total Orders</span><span className="dots">···</span>
            <span className="vl">{k.orders ?? 0}</span>
            <Spark data={days.map((d) => d.orders)} />
            <span className="dl">{deltaLine(ordersDelta, 'vs. last month')}</span>
          </div>
          <div className="adm-kpi">
            <span className="lb">Revenue</span><span className="dots">···</span>
            <span className="vl">{money(k.revenueCents || 0)}</span>
            <Spark data={days.map((d) => d.revenue)} />
            <span className="dl">{deltaLine(revenueDelta, 'vs. last month')}</span>
          </div>
          <div className="adm-kpi">
            <span className="lb">Low Stock Items</span><span className="dots">···</span>
            <span className="vl">{k.lowStockCount ?? 0}</span>
            <Spark data={days.map((d) => d.orders)} />
            <span className="dl">{(k.outOfStock || 0) > 0
              ? <span><b className="dn">↑ {k.outOfStock}</b> <span>· out of stock</span></span>
              : <span><b className="up">✓</b> <span>· all stocked</span></span>}</span>
          </div>
          <div className="adm-kpi">
            <span className="lb">Returning Customers</span><span className="dots">···</span>
            <span className="vl">{repeatShare}%</span>
            <Spark data={days.map((d) => d.orders)} />
            <span className="dl"><b className="up">{k.repeatCustomers ?? 0}</b> <span>· of {k.customers ?? 0} customers</span></span>
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="adm-grid2">
            <Panel title="Recent Orders" viewHref="/admin/orders">
              <table className="adm-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {recent.map((o: any) => {
                    const st = statusKind(o.status);
                    return (
                      <tr key={o.id}>
                        <td>{orderNo(o.id)}</td>
                        <td>{nameForEmail(o.email)}</td>
                        <td>{fmtDay(o.createdAt)}</td>
                        <td>{money(o.totalCents || 0)}</td>
                        <td><span className={`adm-pill ${st.cls}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!recent.length && <p className="adm-sub">No orders yet.</p>}
            </Panel>
            <Panel title="Top Products" viewHref="/admin/stock">
              {top.map((p) => (
                <div className="adm-prod" key={p.id}>
                  <img src={images[p.id] || '/hero-home.png'} alt={p.title} />
                  <div><div className="pn">{p.title}</div><div className="pc">{categoryFor(p.title)}</div></div>
                  <div className="ps">{p.qty}</div>
                  <div className="pr">{money(p.revenue || 0)}</div>
                </div>
              ))}
              {!top.length && <p className="adm-sub">No sales yet.</p>}
            </Panel>
          </div>

          <div className="adm-grid2">
            <Panel title="Weekly Sales">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <span className="adm-sub">Last {range} days</span>
              </div>
              <div className="adm-chart-wrap">
                <div className="adm-y"><span>{yTop}</span><span>{maxRev >= 100000 ? `$${Math.round(maxRev / 2000)}K` : money(Math.round(maxRev / 2))}</span><span>$0</span></div>
                <div className="adm-chart">
                  {days.map((d) => (
                    <div className="col" key={d.day} title={`${d.day} · ${d.orders} orders · ${money(d.revenue || 0)}`}>
                      <div className="bar" style={{ height: `${Math.max(4, Math.round(((d.revenue || 0) / maxRev) * 100))}%` }} />
                      <div className="xl">{new Date(d.day + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                  {!days.length && <p className="adm-sub">No sales in this period.</p>}
                </div>
              </div>
            </Panel>
            <Panel title="Tasks & Notes" viewHref="/admin/content">
              {tasks.map((t) => (
                <div className="adm-task" key={t.id}>
                  <button className={`adm-check${done[t.id] ? ' done' : ''}`} onClick={() => setDone((s) => ({ ...s, [t.id]: !s[t.id] }))} aria-label={done[t.id] ? 'Mark open' : 'Mark done'}>
                    {done[t.id] ? '✓' : ''}
                  </button>
                  <a href={t.href} className={`tt${done[t.id] ? ' done' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>{t.text}</a>
                  <span className="dt">{t.due}</span>
                </div>
              ))}
              {!tasks.length && <p className="adm-sub">All clear — nothing needs attention.</p>}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
