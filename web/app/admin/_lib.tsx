'use client';
import { useCallback, useEffect, useState } from 'react';
import { API, money } from '../../lib/api';

export type Stats = {
  kpis: { orders: number; revenueCents: number; avgOrderCents: number; subscribers: number; messages: number; customers: number; repeatCustomers: number; products: number; lowStockCount: number; outOfStock: number; stockValueCents: number; deadStockCount: number; cancelRate: number; paypalShare: number; codShare: number };
  byStatus: Record<string, number>; byPay: Record<string, { orders: number; revenue: number }>;
  funnel: { paid: number; pending: number; cancelled: number };
  days: { day: string; orders: number; revenue: number }[];
  months: { month: string; orders: number; revenue: number }[];
  bestDay: { day: string; orders: number; revenue: number } | null;
  topProducts: { id: string; title: string; qty: number; revenue: number }[];
  lowStock: { id: string; title: string; slug: string; stock: number }[];
  fullProducts: { id: string; title: string; slug: string; priceCents: number; stock: number; active: boolean; soldQty: number; soldRevenue: number; stockValue: number }[];
  deadStock: { id: string; title: string; stock: number }[];
  topCustomers: { email: string; orders: number; revenue: number }[];
  recent: any[];
};

// Safe JSON fetch: checks r.ok first so 404/500 HTML never crashes a dashboard
// with "Unexpected token < in JSON" — instead it throws a readable Error.
export async function fetchJSON(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(body || `Request failed (${r.status})`);
  }
  const text = await r.text();
  if (!text) return null;
  return JSON.parse(text);
}

export function useAdmin() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false); // true once localStorage has been read
  useEffect(() => {
    setToken(localStorage.getItem('mera-token') || '');
    setEmail(localStorage.getItem('mera-email') || '');
    setReady(true);
  }, []);
  const saveToken = useCallback((t: string, e?: string) => {
    setToken(t);
    if (t) localStorage.setItem('mera-token', t); else localStorage.removeItem('mera-token');
    if (e !== undefined) { setEmail(e); localStorage.setItem('mera-email', e); }
  }, []);
  const auth = useCallback((t = token) => ({ Authorization: `Bearer ${t}` }), [token]);
  const logout = useCallback(() => {
    setToken(''); localStorage.removeItem('mera-token');
  }, []);
  return { token, setToken: saveToken, email, setEmail, auth, logout, ready };
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ border: '1px solid var(--line)', background: '#fff', padding: 14 }}><h3 style={{ marginTop: 0 }}>{title}</h3>{children}</div>;
}
export function Bar({ v, max }: { v: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round(((v || 0) / max) * 100)) : 0;
  return <div style={{ background: '#eee', height: 10, borderRadius: 5 }}><div style={{ width: `${pct}%`, background: '#1a1a1a', height: 10, borderRadius: 5 }} /></div>;
}
export function Kpi({ label, value }: { label: string; value: string }) {
  return <div style={{ border: '1px solid var(--line)', background: '#fff', padding: 12 }}><div className="small">{label}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div></div>;
}

// --- Shared presenters for the dashboard mock layout (live data) ---
export function Panel({ title, viewHref, children }: { title: string; viewHref?: string; children: React.ReactNode }) {
  return (
    <section className="adm-panel">
      <div className="adm-panel-h"><h3>{title}</h3>{viewHref && <a className="adm-view" href={viewHref}>View All →</a>}</div>
      {children}
    </section>
  );
}

// Mini bar sparkline from a numeric series (e.g. daily revenue).
export function Spark({ data, height = 44 }: { data: number[]; height?: number }) {
  const vals = data.length ? data.slice(-10) : [0];
  const max = Math.max(1, ...vals);
  return (
    <div className="adm-spark" style={{ height }} aria-hidden>
      {vals.map((v, i) => <i key={i} style={{ height: `${Math.max(8, Math.round((v / max) * 100))}%` }} />)}
    </div>
  );
}

// "Emily Carter" from "emily.carter@mail.com"; falls back to the raw email.
export function nameForEmail(email?: string) {
  const prefix = (email || '').split('@')[0];
  if (!prefix) return '—';
  const words = prefix.split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.length ? words.join(' ') : prefix;
}

// Short order tag like #MERA-1042 from a uuid.
export function orderNo(id?: string) {
  const h = (id || '').replace(/-/g, '').slice(-4).toUpperCase();
  return `#MERA-${h || '————'}`;
}

// "Apr 30, 2024" from an ISO date; '' when missing.
export function fmtDay(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Bucket a backend order status into a display pill.
export function statusKind(status?: string): { label: string; cls: string } {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return { label: 'Cancelled', cls: 'cancelled' };
  if (s.includes('ship')) return { label: 'Shipped', cls: '' };
  if (s.includes('deliver')) return { label: 'Delivered', cls: '' };
  return { label: 'Processing', cls: 'processing' };
}

// Month-over-month style delta between two numbers; null when not computable.
export function deltaPct(curr: number, prev: number): number | null {
  if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

// Rough product category for the Top Products panel (no category field in API yet).
export function categoryFor(title = '') {
  const t = title.toLowerCase();
  if (t.includes('journal') || t.includes('notebook')) return 'Journals';
  if (t.includes('mug') || t.includes('cup') || t.includes('ceramic')) return 'Drinkware';
  if (t.includes('scarf') || t.includes('silk') || t.includes('wear')) return 'Accessories';
  if (t.includes('candle') || t.includes('home')) return 'Home';
  if (t.includes('bag') || t.includes('pouch') || t.includes('box')) return 'Gifting';
  return 'Goods';
}
export { money, API };
