'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './admin.css';
import { API, fetchJSON, useAdmin } from './_lib';

const NAV: [string, string][] = [
  ['/admin', 'Dashboard'],
  ['/admin/orders', 'Orders'],
  ['/admin/stock', 'Products'],
  ['/admin/collections', 'Collections'],
  ['/admin/customers', 'Customers'],
  ['/admin/content', 'Content'],
  ['/admin/gifts', 'Gift Sets'],
  ['/admin/revenue', 'Analytics'],
  ['/admin/settings', 'Settings'],
];

function isActive(path: string, href: string) {
  if (href === '/admin') return path === '/admin';
  return path === href || path.startsWith(href + '/');
}

function initials(email: string) {
  const p = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const bits = p.split(' ').filter(Boolean);
  const s = ((bits[0]?.[0] || 'S') + (bits[1]?.[0] || 'A')).toUpperCase();
  return s;
}

function displayName(email: string) {
  const p = email.split('@')[0];
  if (!p) return 'Store Admin';
  return p.split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Store Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { token, email, ready } = useAdmin();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetchJSON(`${API}/admin/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((m) => { if (Array.isArray(m)) setUnread(m.length); })
      .catch(() => {});
  }, [token, path]);

  if (!ready) return <div className="adm-body"><p>Loading admin…</p></div>;
  // Not logged in: pages render their own login form / prompt.
  if (!token) return <div className="adm-body">{children}</div>;

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-logo">MERA</div>
        <nav className="adm-nav">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={isActive(path, href) ? 'on' : ''}>{label}</Link>
          ))}
        </nav>
        <div className="adm-side-foot"><Link href="/">← Store</Link></div>
      </aside>
      <div className="adm-main">
        <div className="adm-top">
          <form
            className="adm-search"
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/admin/orders?q=${encodeURIComponent(q.trim())}`); }}
          >
            <span aria-hidden>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, products, customers…" aria-label="Search orders, products, customers" />
          </form>
          <Link className="adm-bell" href="/admin/content" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && <span className="dot">{unread > 99 ? '99+' : unread}</span>}
          </Link>
          <Link className="adm-user" href="/admin/settings">
            <span className="adm-avatar">{initials(email)}</span>
            <span className="who"><span className="nm">{displayName(email)}</span><br /><span className="rl">Store Admin</span></span>
          </Link>
        </div>
        <div className="adm-body">{children}</div>
      </div>
    </div>
  );
}
