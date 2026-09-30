'use client';
import { useEffect, useState } from 'react';
import { API, getProducts, imgFor, money, sid, waLink, type Product } from '../lib/api';
import { SearchOverlay } from '../components/search-overlay';
import { WhatsAppLink } from '../components/whatsapp-icon';

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
  const [occasion, setOccasion] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [pack, setPack] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);
  const [giftMsg, setGiftMsg] = useState('');
  const [q, setQ] = useState('');
  const [news, setNews] = useState('');
  const [newsMsg, setNewsMsg] = useState('');
  const [menu, setMenu] = useState(false);

  useEffect(() => { getProducts().then(setProducts); }, []);
  const count = items.reduce((a: number, b: any) => a + (b.qty || 1), 0);

  const add = async (productId: string) => {
    const p = products.find((x) => x.id === productId);
    await fetch(`${API}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sid() }, body: JSON.stringify({ productId, qty: 1, title: p?.title, priceCents: p?.priceCents, image: p ? imgFor(p) : undefined, slug: p?.slug }) });
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
  // Merge bag rows with the live catalogue so the drawer always shows real
  // title/price/image — even if the API enrichment fell back to $0 / "Item".
  const productById = new Map(products.map((p) => [p.id, p]));
  const displayItems = items.map((i: any) => {
    const p = productById.get(i.productId);
    const title = i.title && i.title !== 'Item' ? i.title : p?.title || i.title || 'Item';
    const priceCents = (i.priceCents || 0) > 0 ? i.priceCents : p?.priceCents || i.priceCents || 0;
    const image = i.image || (p ? imgFor(p) : '/hero-home.png');
    const slug = i.slug || p?.slug || null;
    return { ...i, title, priceCents, image, slug };
  });
  const subtotal = displayItems.reduce((a: number, b: any) => a + (b.priceCents || 0) * (b.qty || 1), 0);
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
    if (!occasion || !sel.length || !pack) {
      setGiftMsg('Please complete each step — choose an occasion, at least one item, and packaging.');
      setStep(!occasion ? 1 : !sel.length ? 2 : 3);
      return;
    }
    setGiftMsg('');
    for (let k = 0; k < sel.length; k++) {
      const p = products.find((x) => x.id === sel[k]);
      await fetch(`${API}/cart/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sid() }, body: JSON.stringify({ productId: sel[k], qty: 1, title: p?.title, priceCents: p?.priceCents, image: p ? imgFor(p) : undefined, slug: p?.slug, properties: k === 0 ? { Occasion: occasion, Packaging: pack, Note: note } : { Gift: occasion } }) });
    }
    await load(); setOpen(true);
  };

  return (
    <>
      <header className="top"><div className="wrap top-in">
        <button className="burger" aria-label="Menu" onClick={() => setMenu((o) => !o)}>☰</button>
        <a className="logo" href="/">MERA</a>
        <nav className={'main' + (menu ? ' open' : '')} onClick={() => setMenu(false)}><a href="/shop">Shop</a><a href="/shop">New</a><a href="/shop">Collections</a><a href="#story">Story</a><a href="#journal">Journal</a></nav>
        <div className="icons"><SearchOverlay /><button onClick={() => setOpen(true)} style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer' }}>Bag ({count})</button></div>
      </div></header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Curated for a more meaningful everyday</div>
          <h1>Objects<br />worth keeping.</h1>
          <p style={{ color: '#4a463f' }}>Considered pieces for living, gifting, and keeping — scarves, ceramics, notebooks, candles and more, for a home and a life you love.</p>
          <div className="hero-actions">
            <a className="btn-pill btn-primary" href="/shop">Shop New Arrivals <span aria-hidden="true">→</span></a><a className="btn-pill btn-secondary" href="#story">Our Story</a>
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

      <section className="gift" id="build-gift">
        <h2 style={{ fontSize: 32 }}>Build a Gift</h2>
        <p className="small">Answer one simple question at a time — we will pack it beautifully. PayPal or Pay on Delivery at checkout.</p>
        <div className="wiz">
          <ol className="gift-progress">
            {['Occasion', 'Items', 'Packaging', 'Note & Review'].map((label, i) => {
              const n = i + 1;
              const done = (n === 1 && !!occasion) || (n === 2 && sel.length > 0) || (n === 3 && !!pack) || (n === 4 && step === 4 && !!occasion && sel.length > 0 && !!pack);
              const current = step === n;
              const clickable = n < step || done;
              return (
                <li key={label} className={current ? 'current' : done ? 'done' : ''}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setStep(n)}
                    aria-current={current ? 'step' : undefined}
                  >
                    <span className="gift-dot">{done && !current ? '✓' : n}</span> {label}
                    {n === 2 && sel.length > 0 && <em> ({sel.length})</em>}
                  </button>
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <div className="gift-step">
              <h3>Step 1 — What&apos;s the occasion?</h3>
              <p className="small">Choose one to continue.</p>
              <div className="gift-grid">
                {[
                  { id: 'Birthday', desc: 'Cake, candles, and something to keep.' },
                  { id: 'Thank you', desc: 'A small gesture that says a lot.' },
                  { id: 'New home', desc: 'Warm up their new space.' },
                  { id: 'Just because', desc: 'No reason needed.' },
                ].map((o) => (
                  <button key={o.id} type="button" className={'gift-card' + (occasion === o.id ? ' sel' : '')} onClick={() => { setOccasion(o.id); setGiftMsg(''); }}>
                    <strong>{o.id}</strong><span>{o.desc}</span>
                    {occasion === o.id && <span className="gift-check" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
              <div className="gift-nav">
                <span className="small">{occasion ? `Selected: ${occasion}` : 'Please choose one option.'}</span>
                <button className="btn-pill btn-primary" disabled={!occasion} onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="gift-step">
              <h3>Step 2 — Pick your pieces</h3>
              <p className="small">Choose at least one item. You can pick several.</p>
              <div className="gift-items">
                {products.map((p) => {
                  const active = sel.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={'gift-item' + (active ? ' sel' : '')}
                      onClick={() => { setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])); setGiftMsg(''); }}
                      aria-pressed={active}
                    >
                      <img src={imgFor(p)} alt={p.title} />
                      <strong>{p.title}</strong>
                      <span>{money(p.priceCents)}</span>
                      {active && <span className="gift-check" aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
              {!products.length && <p className="small">No products available right now.</p>}
              <div className="gift-nav">
                <button className="btn-pill btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <span className="small">{sel.length ? `${sel.length} selected` : 'Select at least 1 item.'}</span>
                <button className="btn-pill btn-primary" disabled={!sel.length} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="gift-step">
              <h3>Step 3 — How should we wrap it?</h3>
              <p className="small">Choose one packaging style.</p>
              <div className="gift-grid">
                {[
                  { id: 'Kraft + ribbon', desc: 'Signature kraft paper with cotton ribbon.' },
                  { id: 'Linen pouch', desc: 'Reusable natural linen pouch.' },
                  { id: 'Keepsake box', desc: 'Sturdy box worth keeping.' },
                ].map((o) => (
                  <button key={o.id} type="button" className={'gift-card' + (pack === o.id ? ' sel' : '')} onClick={() => { setPack(o.id); setGiftMsg(''); }}>
                    <strong>{o.id}</strong><span>{o.desc}</span>
                    {pack === o.id && <span className="gift-check" aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
              <div className="gift-nav">
                <button className="btn-pill btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <span className="small">{pack ? `Selected: ${pack}` : 'Please choose one option.'}</span>
                <button className="btn-pill btn-primary" disabled={!pack} onClick={() => setStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="gift-step">
              <h3>Step 4 — Add a note &amp; review</h3>
              <p className="small">Optional note, then check everything looks right.</p>
              <textarea
                className="gift-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Write a short message for the card… (optional)"
              />
              <div className="gift-summary">
                <div><strong>Occasion:</strong> {occasion || '—'}</div>
                <div><strong>Packaging:</strong> {pack || '—'}</div>
                <div>
                  <strong>Items ({sel.length}):</strong>
                  <ul>
                    {sel.map((id) => {
                      const p = products.find((x) => x.id === id);
                      return <li key={id}>{p ? `${p.title} — ${money(p.priceCents)}` : id}</li>;
                    })}
                  </ul>
                  <div><strong>Total: </strong>{money(products.filter((p) => sel.includes(p.id)).reduce((a, b) => a + b.priceCents, 0))}</div>
                </div>
              </div>
              {giftMsg && <p className="small" role="alert" style={{ color: '#a33' }}>{giftMsg}</p>}
              <div className="gift-nav">
                <button className="btn-pill btn-secondary" onClick={() => setStep(3)}>← Back</button>
                <button className="u" type="button" onClick={() => { setStep(1); setGiftMsg(''); }} style={{ background: 'none', border: 0, cursor: 'pointer' }}>Start over</button>
                <button className="btn-pill btn-primary" onClick={addGift} disabled={!sel.length}>Add Gift to Bag →</button>
              </div>
            </div>
          )}
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
        <div><div className="logo">MERA</div><p className="small">Everyday objects for a more intentional life.</p><p><WhatsAppLink href={waLink('Hello MERA! I have a question.')} /></p></div>
      </div><div className="bottom"><span>© 2026 MERA</span><span>PayPal + Cash on Delivery • United States (USD)</span></div></footer>

      <div className={'drawer' + (open ? ' open' : '')}>
        <div className="bk" onClick={() => setOpen(false)} />
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 18, borderBottom: '1px solid var(--line)' }}><strong>Bag ({count})</strong><button onClick={() => setOpen(false)}>Close</button></div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {!displayItems.length ? <p>Your bag is empty.</p> : displayItems.map((i: any) => (
              <div key={i.id} style={{ display: 'flex', gap: 12, marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                <a href={i.slug ? `/shop/${i.slug}` : '/shop'} style={{ width: 72, height: 72, flexShrink: 0, background: '#ece4d6', overflow: 'hidden' }}>
                  <img src={i.image ? (i.image.startsWith('/public/') ? i.image.replace('/public/', '/') : i.image) : '/hero-home.png'} alt={i.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </a>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div className="small">{money(i.priceCents || 0)} each{i.variantTitle ? ` · ${i.variantTitle}` : ''}</div>
                  {(i.properties?.Occasion || i.properties?.Gift || i.properties?.Packaging || i.properties?.Note) && (
                    <div className="small" style={{ marginTop: 4 }}>
                      {i.properties?.Occasion && <div>Occasion: {i.properties.Occasion}</div>}
                      {i.properties?.Gift && !i.properties?.Occasion && <div>Gift: {i.properties.Gift}</div>}
                      {i.properties?.Packaging && <div>Packaging: {i.properties.Packaging}</div>}
                      {i.properties?.Note && <div>Note: “{i.properties.Note}”</div>}
                    </div>
                  )}
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
          <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>{displayItems.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong>Subtotal</strong><strong>{money(subtotal)}</strong></div>}<a className="btn" href="/checkout" style={{ width: '100%', justifyContent: 'center' }}>Checkout →</a></div>
        </div>
      </div>
    </>
  );
}
