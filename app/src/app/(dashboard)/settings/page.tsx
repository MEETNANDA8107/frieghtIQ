'use client';
import { useState, useEffect } from 'react';
import { User, Database, Bell, Shield, CreditCard, Check, ExternalLink } from 'lucide-react';

const tabs = [
  { id: 'profile',    label: 'Account & Profile',    icon: User },
  { id: 'feeds',      label: 'Data Feeds & APIs',    icon: Database },
  { id: 'notifs',     label: 'Notifications',        icon: Bell },
  { id: 'security',   label: 'Security & SSO',       icon: Shield },
  { id: 'billing',    label: 'Billing',              icon: CreditCard },
];

const apiFeeds = [
  { id: 'aisstream', name: 'AISStream.io', desc: 'Live vessel tracking & AIS positioning', status: 'connected', color: '#0B1E33' },
  { id: 'openweather', name: 'OpenWeather API', desc: 'Maritime cyclone & swell conditions', status: 'connected', color: '#b77800' },
  { id: 'comtrade', name: 'UN Comtrade', desc: 'Global trade flows & commodity volumes', status: 'connected', color: '#0F5E5E' },
  { id: 'frankfurter', name: 'Frankfurter FX', desc: 'USD/INR & cross-currency rates (free)', status: 'connected', color: '#5b2d8e' },
  { id: 'eia', name: 'EIA Energy API', desc: 'US crude oil & energy benchmark prices', status: 'limited', color: '#74777d' },
  { id: 'platts', name: "S&P Platts / Baltic Exchange", desc: 'Official freight rate indices (paid)', status: 'not_connected', color: '#ba1a1a' },
];

function NotificationRow({ label, desc, defaultValue }: { label: string; desc: string; defaultValue: boolean }) {
  const [on, setOn] = useState(defaultValue);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eff4ff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#74777d', marginTop: 3 }}>{desc}</div>
      </div>
      <button onClick={() => setOn(value => !value)} className={`toggle ${on ? 'toggle-on' : 'toggle-off'}`} aria-label={on ? 'On' : 'Off'} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: '',
    company: '',
    phone: '',
    timezone: '',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // Show save feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Workspace Settings</h1>
        <p style={{ fontSize: 11, color: '#74777d', margin: '4px 0 0' }}>Manage organizational profiles, data integrations, and billing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                width: '100%', textAlign: 'left', padding: '9px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.15s',
                background: active ? '#d2e4ff' : 'transparent',
                color: active ? '#0B1E33' : '#44474d',
                borderLeft: active ? '3px solid #0F5E5E' : '3px solid transparent',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget.style.background = '#e5eeff'); }}
                onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent'); }}>
                <Icon size={16} color={active ? '#0F5E5E' : '#74777d'} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && (
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1E33', margin: '0 0 20px' }}>Profile Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text', disabled: false },
                  { label: 'Work Email', key: 'email', type: 'email', disabled: true },
                  { label: 'Role / Title', key: 'role', type: 'text', disabled: false },
                  { label: 'Company', key: 'company', type: 'text', disabled: false },
                  { label: 'Phone', key: 'phone', type: 'tel', disabled: false },
                  { label: 'Timezone', key: 'timezone', type: 'text', disabled: false },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input type={f.type} className="input-field" disabled={f.disabled}
                      value={(profile as any)[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ fontSize: 13, background: f.disabled ? '#eff4ff' : 'white' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleSave} className="btn-primary" style={{ padding: '9px 24px' }}>
                  {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
                </button>
                {saved && <span style={{ fontSize: 12, color: '#0F5E5E', fontWeight: 600 }}>Profile updated successfully.</span>}
              </div>
            </div>
          )}

          {activeTab === 'feeds' && (
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1E33', margin: '0 0 6px' }}>Data Feed Integrations</h2>
              <p style={{ fontSize: 12, color: '#74777d', margin: '0 0 24px' }}>Manage external API connections for real-time market data ingestion into the forecast engine.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {apiFeeds.map(feed => (
                  <div key={feed.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                    border: '1px solid #c4c6cd', borderRadius: 8, background: '#f8f9ff',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0F5E5E')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#c4c6cd')}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: feed.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
                      {feed.id.substring(0, 3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>{feed.name}</div>
                      <div style={{ fontSize: 11, color: '#74777d' }}>{feed.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: feed.status === 'connected' ? '#aaefee' : feed.status === 'limited' ? '#ffddb4' : '#ffdad6',
                        color: feed.status === 'connected' ? '#0F5E5E' : feed.status === 'limited' ? '#633f00' : '#ba1a1a',
                      }}>
                        {feed.status.replace('_', ' ')}
                      </span>
                      <button style={{ padding: '5px 12px', border: '1px solid #c4c6cd', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#0B1E33', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Configure <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: '14px 18px', background: '#d2e4ff', borderRadius: 8, fontSize: 12, color: '#0B1E33' }}>
                <strong>API keys</strong> are read from <code style={{ fontFamily: 'monospace', background: '#eff4ff', padding: '1px 5px', borderRadius: 3 }}>api_keys.env</code> in your project root.
              </div>
            </div>
          )}

          {activeTab === 'notifs' && (
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1E33', margin: '0 0 20px' }}>Notification Matrix</h2>
              {[
                { label: 'Critical Rate Dip & Arbitrage Dispatches', desc: 'Immediate push when route volatility exceeds ±3.0%', default: true },
                { label: 'Daily Executive Morning Digest', desc: 'Baltic indices and bunker spreads summary at 07:00 IST', default: true },
                { label: 'Chokepoint Congestion Surge Alerts', desc: 'When wait time exceeds configured threshold', default: true },
                { label: 'Weekly Model Performance Summary', desc: 'Accuracy metrics and procurement alpha report', default: false },
                { label: 'Webhook Data Stream', desc: 'Push forecast payloads to your own endpoint', default: false },
              ].map(n => <NotificationRow key={n.label} label={n.label} desc={n.desc} defaultValue={n.default} />)}
            </div>
          )}

          {(activeTab === 'security' || activeTab === 'billing') && (
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 40, textAlign: 'center', color: '#74777d' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'security' ? '🔐' : '💳'}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', marginBottom: 8 }}>
                {activeTab === 'security' ? 'Security & SSO' : 'Billing & Subscription'}
              </div>
              <div style={{ fontSize: 12 }}>
                {activeTab === 'security'
                  ? 'Manage SSO providers, MFA, and API key rotation in your enterprise admin portal.'
                  : 'Manage seats, plan upgrades, and invoice history through the customer portal.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
