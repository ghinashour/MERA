'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin, Panel, API, fetchJSON, fmtDay } from '../_lib';

export default function ContentPage() {
  const { token, auth, ready } = useAdmin();
  const [posts, setPosts] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const [p, m, s] = await Promise.all([
        fetchJSON(`${API}/posts`).catch(() => []),
        fetchJSON(`${API}/admin/messages`, { headers: auth() }).catch(() => []),
        fetchJSON(`${API}/admin/subscribers`, { headers: auth() }).catch(() => []),
      ]);
      if (Array.isArray(p)) setPosts(p);
      if (Array.isArray(m)) setMsgs(m);
      if (Array.isArray(s)) setSubs(s);
    } catch (e: any) { setError(e?.message || 'Could not load content.'); }
  }, [token, auth]);
  useEffect(() => { load(); }, [load]);
  if (!ready) return <p>Loading…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Dashboard</a> first.</p>;
  return (
    <div>
      <div className="adm-title-row"><div><h1 className="adm-h1">Content</h1><p className="adm-sub">Journal posts, inbox messages and newsletter subscribers.</p></div></div>
      {error && <p className="adm-err">{error} <button className="adm-retry" onClick={load}>Retry</button></p>}
      <div className="adm-grid2">
        <Panel title={`Inbox (${msgs.length})`}>
          {msgs.map((m: any) => (
            <div className="adm-task" key={m.id}>
              <div><div className="tt"><strong>{m.name}</strong> <span className="adm-sub">{m.email}</span></div><div className="adm-sub">{m.text}</div></div>
              <span className="dt">{fmtDay(m.createdAt)}</span>
            </div>
          ))}
          {!msgs.length && <p className="adm-sub">Inbox zero.</p>}
        </Panel>
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel title={`Journal posts (${posts.length})`}>
            {posts.map((p: any) => <p key={p.id} className="adm-sub" style={{ margin: '6px 0' }}><strong style={{ color: '#3c3831' }}>{p.title}</strong> <span>/{p.slug}</span></p>)}
            {!posts.length && <p className="adm-sub">No posts yet.</p>}
          </Panel>
          <Panel title={`Subscribers (${subs.length})`}>
            {subs.slice(0, 8).map((s: any) => <p key={s.id} className="adm-sub" style={{ margin: '6px 0' }}>{s.email} <span>· {fmtDay(s.createdAt)}</span></p>)}
            {!subs.length && <p className="adm-sub">No subscribers yet.</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
