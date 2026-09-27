'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Card, Kpi, money, API, fetchJSON, type Stats } from '../_lib';
export default function StockPage() {
  const { token, auth, ready } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [prod, setProd] = useState({ title: '', slug: '', priceCents: 1000, stock: 10 });
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const s = await fetchJSON(`${API}/admin/stats`, { headers: auth() });
      if (s?.kpis) setStats(s); else setError('Unexpected response from the API.');
    } catch (e: any) {
      setError(e?.message || 'Could not load stock data.');
    }
  }, [token, auth]);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    if (!prod.title.trim() || !prod.slug.trim()) { setNotice('Title and slug are required.'); return; }
    if (!(prod.priceCents >= 0) || !(prod.stock >= 0)) { setNotice('Price and stock must be 0 or more.'); return; }
    try {
      await fetchJSON(`${API}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ ...prod, title: prod.title.trim(), slug: prod.slug.trim(), description: prod.title.trim(), currency: 'USD', active: true, images: [] }) });
      setNotice('Product created.');
      setProd({ title: '', slug: '', priceCents: 1000, stock: 10 }); load();
    } catch (e: any) {
      setNotice(`Could not create the product (${e?.message || 'error'}). Is the slug already used?`);
    }
  };
  const setStock = async (id: string, stock: number) => {
    if (!Number.isFinite(stock) || stock < 0) { setNotice('Stock must be 0 or more.'); return; }
    try {
      await fetchJSON(`${API}/admin/products/${id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ stock }) });
      load();
    } catch { setNotice('Could not set stock — please try again.'); }
  };
  const bump = async (id: string, delta: number) => {
    try {
      await fetchJSON(`${API}/admin/products/${id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth() }, body: JSON.stringify({ delta }) });
      load();
    } catch { setNotice('Could not adjust stock — please try again.'); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete product?')) return;
    try {
      const r = await fetch(`${API}/admin/products/${id}`, { method: 'DELETE', headers: auth() });
      if (!r.ok) throw 0;
      load();
    } catch { setNotice('Could not delete the product — please try again.'); }
  };
  if (!ready) return <p>Loading stock…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Overview</a> first.</p>;
  if (error) return <div><h1 className="adm-h1">Stock &amp; products</h1><p style={{ color: 'crimson' }}>{error}</p><button className="btn" onClick={load}>Retry</button></div>;
  if (!stats) return <p>Loading stock…</p>;
  const lowStock = stats.lowStock || [];
  const fullProducts = stats.fullProducts || [];
  return <div><h1 className="adm-h1">Stock &amp; products</h1>
    {notice && <p className="small" role="status">{notice}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
      <Kpi label="Products" value={String(stats.kpis.products ?? 0)} /><Kpi label="Stock value" value={money(stats.kpis.stockValueCents || 0)} />
      <Kpi label="Low stock ≤5" value={String(stats.kpis.lowStockCount ?? 0)} /><Kpi label="Out of stock" value={String(stats.kpis.outOfStock ?? 0)} />
      <Kpi label="Dead stock" value={String(stats.kpis.deadStockCount ?? 0)} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      <Card title="Add stock — new product">
        <div style={{ display: 'grid', gap: 8 }}><input value={prod.title} onChange={(e) => setProd({ ...prod, title: e.target.value })} placeholder="Title" style={{ padding: 10 }} /><input value={prod.slug} onChange={(e) => setProd({ ...prod, slug: e.target.value })} placeholder="slug" style={{ padding: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}><input type="number" min={0} value={prod.priceCents} onChange={(e) => setProd({ ...prod, priceCents: Number(e.target.value) })} placeholder="Price cents" style={{ padding: 10, width: '50%' }} /><input type="number" min={0} value={prod.stock} onChange={(e) => setProd({ ...prod, stock: Number(e.target.value) })} placeholder="Stock" style={{ padding: 10, width: '50%' }} /></div>
        <button className="btn" onClick={create}>Create product →</button></div>
      </Card>
      <Card title="Low stock alerts">
        {lowStock.map((p) => <p key={p.id} className="small">⚠ {p.title} — {p.stock} left <button onClick={() => bump(p.id, 20)}>+20</button></p>)}
        {!lowStock.length && <p className="small">All stocked.</p>}
      </Card>
    </div>
    <h3>All products — adjust stock inline</h3>
    {!fullProducts.length && <p className="small">No products yet.</p>}
    {fullProducts.map((p) => (
      <div key={p.id} style={{ border: '1px solid var(--line)', background: '#fff', padding: 10, marginBottom: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200 }}><strong>{p.title}</strong> <span className="small">/{p.slug} · {money(p.priceCents || 0)} · sold {p.soldQty ?? 0} ({money(p.soldRevenue || 0)}) · stock value {money(p.stockValue || 0)}</span></div>
        <button onClick={() => bump(p.id, -1)}>−1</button><strong>{p.stock}</strong><button onClick={() => bump(p.id, 1)}>+1</button><button onClick={() => bump(p.id, 10)}>+10</button>
        <button onClick={() => { const v = prompt(`Set stock for ${p.title}:`, String(p.stock)); if (v !== null && v.trim() !== '') setStock(p.id, Number(v)); }}>Set…</button>
        <button onClick={() => remove(p.id)} style={{ color: 'crimson' }}>Delete</button>
      </div>))}
  </div>;
}
