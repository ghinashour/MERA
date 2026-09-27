'use client';
import { useState } from 'react';
import { API } from '../../lib/api';
export default function Auth() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [msg, setMsg] = useState('');
  const call = async (kind: string) => {
    const r = await fetch(`${API}/auth/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await r.json();
    if (j.access_token) { localStorage.setItem('mera-token', j.access_token); localStorage.setItem('mera-email', email); setMsg('Logged in — go to Account'); }
    else setMsg(JSON.stringify(j));
  };
  return <div className="wrap" style={{ padding: 32, maxWidth: 480 }}><h1>Account</h1>
    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: 12, marginBottom: 8 }} />
    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 12, marginBottom: 8 }} />
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" onClick={() => call('register')}>Register</button><button className="btn" onClick={() => call('login')}>Login</button><a className="btn" href="/account">My orders →</a></div>
    <p className="small">{msg}</p></div>;
}
