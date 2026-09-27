'use client';
import { useAdmin, Panel } from '../_lib';
import { WHATSAPP } from '../../../lib/api';

export default function SettingsPage() {
  const { email, logout, ready, token } = useAdmin();
  if (!ready) return <p>Loading…</p>;
  if (!token) return <p className="small">Login from <a className="u" href="/admin">Dashboard</a> first.</p>;
  return (
    <div>
      <div className="adm-title-row"><div><h1 className="adm-h1">Settings</h1><p className="adm-sub">Store configuration and session.</p></div></div>
      <div className="adm-grid2">
        <Panel title="Account">
          <p className="adm-sub" style={{ margin: '6px 0' }}>Signed in as <strong style={{ color: '#3c3831' }}>{email}</strong> (Store Admin).</p>
          <p><button className="btn" onClick={logout}>Logout</button></p>
        </Panel>
        <Panel title="Store">
          <p className="adm-sub" style={{ margin: '6px 0' }}>WhatsApp click-to-chat: <strong style={{ color: '#3c3831' }}>+{WHATSAPP}</strong> <span>(NEXT_PUBLIC_WHATSAPP)</span></p>
          <p className="adm-sub" style={{ margin: '6px 0' }}>Currency: <strong style={{ color: '#3c3831' }}>USD</strong> · Payments: <strong style={{ color: '#3c3831' }}>PayPal + Cash on Delivery</strong></p>
          <p><a className="adm-view" href="/">← Back to store</a></p>
        </Panel>
      </div>
    </div>
  );
}
