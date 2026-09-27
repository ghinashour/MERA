'use client';
import { useState } from 'react';
import { API, waLink } from '../../../lib/api';
const COPY: Record<string, string> = {
  shipping: 'Ships in 2-3 days. Free over $75. PayPal or Cash on Delivery.',
  returns: 'Free returns within 30 days. Gift packaging refundable if unopened.',
  faq: 'Q: Pay on delivery? A: Yes — we call to confirm COD orders.',
  contact: 'Write us — we reply within a day.',
};
export default function Help({ params }: { params: { slug: string } }) {
  const [f, setF] = useState({ name: '', email: '', text: '' });
  const send = async () => { await fetch(`${API}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); alert('Message sent'); };
  return <div className="wrap" style={{ padding: 32, maxWidth: 640 }}><h1 style={{ textTransform: 'capitalize' }}>{params.slug}</h1><p>{COPY[params.slug] || 'MERA help.'}</p>
    {params.slug === 'contact' && <><p><a className="btn" href={waLink('Hello MERA! I need help.')} target="_blank" rel="noreferrer">Chat on WhatsApp →</a></p><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" style={{ width: '100%', padding: 10, marginBottom: 8 }} /><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" style={{ width: '100%', padding: 10, marginBottom: 8 }} /><textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Message" style={{ width: '100%', padding: 10 }} /><p><button className="btn" onClick={send}>Send →</button></p></>}
    <p><a className="u" href="/">← Home</a></p></div>;
}
