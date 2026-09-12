'use client';
import { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trash2, Settings2, Bell, RefreshCw } from 'lucide-react';

const S = {
  chip: (bg: string, color: string): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4,
    background: bg, color, textTransform: 'uppercase', letterSpacing: '0.05em',
  }),
};

const ruleTypeColors: Record<string, [string, string]> = {
  freight_rate:   ['#d2e4ff', '#0B1E33'],
  bunker_fuel:    ['#ffddb4', '#633f00'],
  port_congestion:['#aaefee', '#0F5E5E'],
  weather:        ['#e8d5ff', '#5b2d8e'],
  commodity_price:['#ffdad6', '#ba1a1a'],
};

const defaultNew = { name: '', ruleType: 'freight_rate', metric: 'c5_proxy_rate', condition: 'exceeds', threshold: '', unit: 'USD/MT', corridor: '', channels: ['Email', 'In-App'] };

export default function AlertsPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [newRule, setNewRule] = useState(defaultNew);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => {
        if (d.rules) setRules(d.rules);
        if (d.history) setHistory(d.history);
        window.dispatchEvent(new Event('alerts:changed'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleRule = async (id: number, isActive: number) => {
    await fetch('/api/alerts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle', isActive: isActive === 0 }),
    });
    load();
  };

  const createRule = async () => {
    if (!newRule.name || !newRule.threshold) return;
    setSaving(true);
    const isEditing = editingRule !== null;
    await fetch('/api/alerts', {
      method: isEditing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRule,
        ...(isEditing ? { id: editingRule.id, action: 'update' } : {}),
        threshold: Number(newRule.threshold),
        channels: newRule.channels,
      }),
    });
    setSaving(false);
    setShowCreate(false);
    setEditingRule(null);
    setNewRule(defaultNew);
    load();
  };

  const editRule = (rule: any) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      ruleType: rule.rule_type,
      metric: rule.metric,
      condition: rule.condition,
      threshold: String(rule.threshold),
      unit: rule.unit ?? '',
      corridor: rule.corridor ?? '',
      channels: Array.isArray(rule.channels) ? rule.channels : [],
    });
    setShowCreate(true);
  };

  const deleteRule = async (id: number) => {
    if (!window.confirm('Delete this alert rule?')) return;
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    load();
  };

  const activeCount  = rules.filter(r => r.is_active).length;
  const pausedCount  = rules.filter(r => !r.is_active).length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Watchdogs & Alert Rules</h1>
          <p style={{ fontSize: 11, color: '#74777d', margin: '4px 0 0' }}>Automated monitoring for freight rates, bunker prices, congestion, and weather.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /></button>
          <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: '7px 16px', fontSize: 12 }}>
            <Plus size={14} /> Create Rule
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Rules',   val: activeCount,          color: '#0F5E5E' },
          { label: 'Triggered (7d)', val: history.length,       color: '#ba1a1a' },
          { label: 'Paused',         val: pausedCount,          color: '#74777d' },
          { label: 'Total Channels', val: 4,                    color: '#0B1E33' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Rule cards */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33', marginBottom: 12 }}>Alert Rules ({rules.length})</div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <RefreshCw size={24} color="#0F5E5E" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : rules.map(r => {
            const [chipBg, chipColor] = ruleTypeColors[r.rule_type] ?? ['#eff4ff', '#0B1E33'];
            return (
              <div key={r.id} style={{
                background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 16,
                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16,
                borderLeft: `4px solid ${r.is_active ? '#0F5E5E' : '#c4c6cd'}`,
                opacity: r.is_active ? 1 : 0.65,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={S.chip(chipBg, chipColor)}>{r.rule_type.replace('_', ' ')}</span>
                    {r.is_active ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0F5E5E', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F5E5E', display: 'inline-block' }} /> ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase' }}>Paused</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33', marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#74777d' }}>
                    IF {r.metric} {r.condition?.replace(/_/g, ' ')} <strong style={{ color: '#0B1E33' }}>{r.threshold} {r.unit}</strong>
                    {r.corridor && <> · {r.corridor}</>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                  {(Array.isArray(r.channels) ? r.channels : []).map((c: string) => (
                    <span key={c} style={{ fontSize: 9, fontWeight: 700, border: '1px solid #c4c6cd', padding: '2px 6px', borderRadius: 4, color: '#44474d', fontFamily: 'monospace' }}>{c}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, borderLeft: '1px solid #eff4ff', paddingLeft: 12 }}>
                  <button onClick={() => toggleRule(r.id, r.is_active)}
                    style={{ padding: 7, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#74777d' }}
                    title={r.is_active ? 'Pause' : 'Activate'}
                    onMouseEnter={e => (e.currentTarget.style.background = '#eff4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {r.is_active ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button onClick={() => editRule(r)} style={{ padding: 7, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#74777d' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#eff4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Settings2 size={15} />
                  </button>
                  <button onClick={() => deleteRule(r.id)} style={{ padding: 7, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#ba1a1a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ffdad6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* History + Create form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Create Rule panel */}
          {showCreate && (
            <div style={{ background: 'white', border: '2px solid #0F5E5E', borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>{editingRule ? 'Edit Alert Rule' : 'New Alert Rule'}</div>
                <button onClick={() => { setShowCreate(false); setEditingRule(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#74777d', fontSize: 18 }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input-field" placeholder="Rule name *" value={newRule.name} onChange={e => setNewRule(n => ({...n, name: e.target.value}))} />
                <select className="input-field" value={newRule.ruleType} onChange={e => setNewRule(n => ({...n, ruleType: e.target.value}))}>
                  <option value="freight_rate">Freight Rate</option>
                  <option value="bunker_fuel">Bunker Fuel</option>
                  <option value="port_congestion">Port Congestion</option>
                  <option value="weather">Weather</option>
                  <option value="commodity_price">Commodity Price</option>
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select className="input-field" value={newRule.condition} onChange={e => setNewRule(n => ({...n, condition: e.target.value}))}>
                    <option value="exceeds">Exceeds</option>
                    <option value="drops_below">Drops Below</option>
                    <option value="rises_pct">Rises by %</option>
                    <option value="drops_pct">Drops by %</option>
                  </select>
                  <input className="input-field" placeholder="Threshold *" type="number" value={newRule.threshold} onChange={e => setNewRule(n => ({...n, threshold: e.target.value}))} />
                </div>
                <input className="input-field" placeholder="Unit (e.g. USD/MT, Days)" value={newRule.unit} onChange={e => setNewRule(n => ({...n, unit: e.target.value}))} />
                <input className="input-field" placeholder="Corridor (optional)" value={newRule.corridor} onChange={e => setNewRule(n => ({...n, corridor: e.target.value}))} />
                <button onClick={createRule} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                  {saving ? (editingRule ? 'Saving…' : 'Creating…') : (editingRule ? 'Save Changes' : 'Create Rule')}
                </button>
              </div>
            </div>
          )}

          {/* Dispatch history */}
          <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: '#d2e4ff', padding: '10px 14px', borderBottom: '1px solid #c4c6cd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0B1E33' }}>Recent Dispatches</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase' }}>Last 7 Days</span>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#74777d' }}>No recent alerts triggered.</div>
              ) : history.map((h, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid #eff4ff' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Bell size={13} color="#ba1a1a" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1E33' }}>{h.rule_name}</div>
                      <div style={{ fontSize: 10, color: '#74777d', margin: '2px 0' }}>{new Date(h.created_at).toLocaleString()}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace' }}>
                        Observed: <strong style={{ color: '#ba1a1a' }}>{h.observed_value}</strong> (threshold: {h.threshold_value})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
