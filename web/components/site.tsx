'use client';
import { useState } from 'react';
import { waLink } from '../lib/api';
import { SearchOverlay } from './search-overlay';
export function Header({ count, onCart }: { count: number; onCart: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="top"><div className="wrap top-in">
      <button className="burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>
      <a className="logo" href="/">MERA</a>
      <nav className={'main' + (open ? ' open' : '')} onClick={() => setOpen(false)}><a href="/shop">Shop</a><SearchOverlay /><a href="/journal">Journal</a><a href="/story">Story</a><a href="/help/shipping">Help</a><a href="/admin">Admin</a><a href={waLink('Hello MERA! I have a question.')} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>WhatsApp</a></nav>
      <div className="icons"><a href="/auth">Account</a><button onClick={onCart} style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer' }}>Bag ({count})</button></div>
    </div></header>
  );
}
export function Footer() {
  const sub = async (e: any) => {
    e.preventDefault();
    const email = e.target.email.value;
    const API = process.env.NEXT_PUBLIC_API || 'http://localhost:3000/api';
    const r = await fetch(`${API}/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    alert(!j.ok ? 'Subscription failed — try again.' : j.mailed ? 'Subscribed — check your inbox for 10% off!' : 'Saved! Email delivery is not configured yet — no welcome email was sent.');
    e.target.reset();
  };
  return (
    <footer><div className="fgrid">
      <div><div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Join Our World</div>
        <form className="news" onSubmit={sub}><input name="email" placeholder="Your email address" required /><button>Subscribe</button></form></div>
      <div><strong>Shop</strong><br /><span className="small"><a href="/shop">All</a> / <a href="/search">Search</a></span></div>
      <div><strong>About</strong><br /><span className="small"><a href="/story">Story</a> / <a href="/journal">Journal</a></span></div>
      <div><strong>Help</strong><br /><span className="small"><a href="/help/shipping">Shipping</a> / <a href="/help/returns">Returns</a> / <a href="/help/contact">Contact</a></span></div>
      <div><div className="logo">MERA</div><p className="small">PayPal + Cash on Delivery</p><p><a className="btn" href={waLink('Hello MERA! I have a question.')} target="_blank" rel="noreferrer">WhatsApp us →</a></p></div>
    </div><div className="bottom"><span>© 2026 MERA</span><span>United States (USD)</span></div></footer>
  );
}
