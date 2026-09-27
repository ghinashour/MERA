'use client';
import { useEffect, useState } from 'react';
import { API } from '../../lib/api';
export default function Journal() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => { fetch(`${API}/posts`).then((r) => r.json()).then((j) => setPosts(Array.isArray(j) ? j : [])); }, []);
  return <div className="wrap" style={{ padding: 32 }}><h1>Journal</h1>
    {!posts.length ? <p className="small">Stories on intentional living — posts created in Admin appear here.</p> : posts.map((p: any) => <div key={p.id} style={{ marginBottom: 16 }}><h2>{p.title}</h2><p className="small">{p.body?.slice(0, 160)}</p></div>)}
  </div>;
}
