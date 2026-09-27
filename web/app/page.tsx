'use client';
import { useEffect, useState } from 'react';
import { API, getProducts, imgFor, money, sid, waLink, type Product } from '../lib/api';
import { SearchOverlay } from '../components/search-overlay';

function useCart() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = async () => {
    try { const r = await fetch(`${API}/cart`, { headers: { 'x-session-id': sid() } }); setItems(await r.json()); } catch {}
  };
  useEffect(() => { load(); }, []);
  return { items, open, setOpen, load };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const { items, open, setOpen, load } = useCart();
  const [occasion, setOccasion] = useState('Birthday');
  const [sel, setSel] = useState<string[]>([]);
  const [pack, setPack] = useState('Kraft + ribbon');
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [news, setNews] = useState('');
  const [newsMsg, setNewsMsg] = useState('');
  const [menu, setMenu] = useState(false);

  useEffect(() => { getProducts().then(setProducts); }, []);
  const count = items.reduce((a: number, b: any) => a + (b.qty || 1), 0);

  const add = async (productId: string) => {
    await fetch(`${API}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sid() }, body: JSON.stringify({ productId, qty: 1 }) });
    await load(); setOpen(true);
  };
  const setQty = async (id: string, qty: number) => {
    await fetch(`${API}/cart/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qty }) });
    await load();
  };
  const removeItem = async (id: string) => {
    await fetch(`${API}/cart/${id}`, { method: 'DELETE' });
    await load();
  };
  const subtotal = items.reduce((a: number, b: any) => a + (b.priceCents || 0) * (b.qty || 1), 0);
  const subscribe = async (e: any) => {
    e.preventDefault();
    if (!news.includes('@')) { setNewsMsg('Please enter a valid email.'); return; }
    const r = await fetch(`${API}/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: news }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) { setNewsMsg('Subscription failed — try again.'); return; }
    setNewsMsg(j.mailed ? 'Welcome! Check your inbox for 10% off (WELCOME10).' : 'Saved! Email delivery is not configured yet — no welcome email was sent. Add RESEND_API_KEY in API .env.');
    setNews('');
  };
  const addGift = async () => {
    for (let k = 0; k < sel.length; k++) {
      await fetch(`${API}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sid() }, body: JSON.stringify({ productId: sel[k], qty: 1, properties: k === 0 ? { Occasion: occasion, Packaging: pack, Note: note } : { Gift: occasion } }) });
    }
    await load(); setOpen(true);
  };

  return (
    <>
      <header className="top"><div className="wrap top-in">
        <button className="burger" aria-label="Menu" onClick={() => setMenu((o) => !o)}>☰</button>
        <a className="logo" href="/">MERA</a>
        <nav className={'main' + (menu ? ' open' : '')} onClick={() => setMenu(false)}><a href="/shop">Shop</a><a href="/shop">New</a><a href="/shop">Collections</a><a href="#story">Story</a><a href="#journal">Journal</a></nav>
        <div className="icons"><SearchOverlay /><a href={waLink('Hello MERA! I have a question.')} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>WhatsApp</a><button onClick={() => setOpen(true)} style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer' }}>Bag ({count})</button></div>
      </div></header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Curated for a more meaningful everyday</div>
          <h1>Objects<br />worth keeping.</h1>
          <p style={{ color: '#4a463f' }}>Considered pieces for living, gifting, and keeping — scarves, ceramics, notebooks, candles and more, for a home and a life you love.</p>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', marginTop: 12 }}>
            <a className="btn" href="/shop">Shop New Arrivals →</a><a className="u" href="#story">Our Story</a><a className="btn" href={waLink('Hello MERA! I want help choosing a gift.')} target="_blank" rel="noreferrer">WhatsApp us →</a>
          </div>
        </div>
        <div className="hero-media"><img src="/hero-home.png" alt="MERA" /><div className="hand" style={{ position: 'absolute', top: 32, right: 36 }}>A calmer,<br />more considered<br />way of living.</div></div>
      </section>

      <section className="arr">
        <div><h2 style={{ fontSize: 32 }}>New Arrivals</h2><a href="/shop" className="eyebrow" style={{ textDecoration: 'none' }}>SHOP ALL →</a></div>
        <div className="grid4">
          {products.slice(0, 4).map((p) => (
            <div className="card" key={p.id}>
              <div className="im"><img src={imgFor(p)} alt={p.title} /></div>
              <div className="tx"><div>{p.title}</div><div>{money(p.priceCents)}</div>
                <button className="btn" style={{ marginTop: 8, padding: '8px 14px' }} onClick={() => add(p.id)}>Add →</button></div>
            </div>
          ))}
        </div>
      </section>

      <section className="split">
        <div><div className="tx"><h2>For the Desk</h2><p className="small">Thoughtful tools for a more intentional day.</p><a className="u" href="/shop">Explore the Collection →</a></div><img src="/collection-desk.png" alt="Desk" /></div>
        <div><div className="tx"><h2>For the Home</h2><p className="small">Everyday objects to make your space feel more like you.</p><a className="u" href="/shop">Explore the Collection →</a></div><img src="/collection-home.png" alt="Home" /></div>
      </section>

      <section className="gift">
        <h2 style={{ fontSize: 32 }}>Build a Gift</h2>
        <p className="small">Create a personal, beautifully packed gift in just a few steps. PayPal or Pay on Delivery at checkout.</p>
        <div className="wiz">
          <div className="tabs"><button className="on">1 Occasion: {occasion}</button><button className="on">2 Items ({sel.length})</button><button className="on">3 {pack}</button></div>
          <div className="opts">{['Birthday', 'Thank you', 'New home', 'Just because'].map((o) => <div key={o} className={'opt' + (o === occasion ? ' sel' : '')} onClick={() => setOccasion(o)}>{o}</div>)}</div>
          <div className="opts">{products.map((p) => <div key={p.id} className={'opt' + (sel.includes(p.id) ? ' sel' : '')} onClick={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}><img src={imgFor(p)} alt="" /><div style={{ fontSize: 12 }}>{p.title} — {money(p.priceCents)}</div></div>)}</div>
          <div className="opts">{['Kraft + ribbon', 'Linen pouch', 'Keepsake box'].map((o) => <div key={o} className={'opt' + (o === pack ? ' sel' : '')} onClick={() => setPack(o)}>{o}</div>)}</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: 10, border: '1px solid var(--line)' }} placeholder="A little something for a brighter tomorrow…" />
          <p><button className="btn" onClick={addGift} disabled={!sel.length}>Add Gift to Bag →</button></p>
        </div>
        <div className="steps" style={{ marginTop: 18 }}>
          {[1, 2, 3, 4].map((n) => <div className="step" key={n}><span className="num">{n}</span><img src={`/gift-${n}.png`} alt="" /><div style={{ fontSize: 13, fontWeight: 600 }}>{['Choose Occasion', 'Choose Items', 'Select Packaging', 'Add a Note'][n - 1]}</div></div>)}
        </div>
      </section>

      <section className="story" id="story">
        <img src="/story.png" alt="Story" />
        <div className="tx"><div className="eyebrow">Our story</div><h2 style={{ fontSize: 40 }}>A More Meaningful Everyday</h2><p>MERA brings together carefully selected objects — made by small creators and trusted makers — to create a more beautiful, intentional everyday.</p><a className="u" href="/shop">Learn More →</a><div className="hand">Smaller objects.<br />Brighter days.</div></div>
      </section>

      <footer><div className="fgrid">
        <div><div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Join Our World</div><p className="small">New arrivals, stories, meaningful moments.</p><form className="news" onSubmit={subscribe}><input placeholder="Your email address" value={news} onChange={(e) => setNews(e.target.value)} /><button>Subscribe</button></form>{newsMsg && <p className="small">{newsMsg}</p>}</div>
        <div><strong>Shop</strong><br /><span className="small">All / New / Gift Sets / Sale</span></div>
        <div><strong>About</strong><br /><span className="small">Story / Makers / Journal</span></div>
        <div><strong>Help</strong><br /><span className="small">Shipping / Returns / Contact</span></div>
        <div><div className="logo">MERA</div><p className="small">Everyday objects for a more intentional life.</p></div>
      </div><div className="bottom"><span>© 2026 MERA</span><span>PayPal + Cash on Delivery • United States (USD)</span></div></footer>

      <div className={'drawer' + (open ? ' open' : '')}>
        <div className="bk" onClick={() => setOpen(false)} />
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 18, borderBottom: '1px solid var(--line)' }}><strong>Bag ({count})</strong><button onClick={() => setOpen(false)}>Close</button></div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {!items.length ? <p>Your bag is empty.</p> : items.map((i: any) => (
              <div key={i.id} style={{ display: 'flex', gap: 12, marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                <a href={i.slug ? `/shop/${i.slug}` : '/shop'} style={{ width: 72, height: 72, flexShrink: 0, background: '#ece4d6', overflow: 'hidden' }}>
                  <img src={i.image ? (i.image.startsWith('/public/') ? i.image.replace('/public/', '/') : i.image) : '/hero-home.png'} alt={i.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </a>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div className="small">{money(i.priceCents || 0)} each{i.properties?.Note ? ' · Gift note' : ''}{i.variantTitle ? ` · ${i.variantTitle}` : ''}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <button onClick={() => setQty(i.id, (i.qty || 1) - 1)} aria-label="Decrease">−</button>
                    <span>{i.qty} {i.qty === 1 ? 'item' : 'items'}</span>
                    <button onClick={() => setQty(i.id, (i.qty || 1) + 1)} aria-label="Increase">+</button>
                    <button onClick={() => removeItem(i.id)} style={{ marginLeft: 'auto', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{money((i.priceCents || 0) * (i.qty || 1))}</div>
                </div>
              </div>))}
          </div>
          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>{items.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong>Subtotal</strong><strong>{money(subtotal)}</strong></div>}<a className="btn" href="/checkout" style={{ width: '100%', justifyContent: 'center' }}>Checkout →</a></div>
        </div>
      </div>
    </>
  );
}
