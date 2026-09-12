'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Search, RefreshCw, ArrowRight } from 'lucide-react';

const S = {
  chip: (bg: string, color: string): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4,
    background: bg, color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
  }),
};

export default function ReportsPage() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/forecast').then(r => r.json()),
      fetch('/api/data?type=reports_kpis').then(r => r.json()),
    ]).then(([forecastData, kpiData]) => {
      if (forecastData.forecasts) setForecasts(forecastData.forecasts);
      setKpis(kpiData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = forecasts.filter(f =>
    !search || [f.origin_port, f.destination_port, f.commodity, f.recommendation].some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    const header = ['ID', 'Date', 'Origin', 'Destination', 'Commodity', 'Vessel', 'Volume (MT)', 'Recommendation', 'Confidence', 'TLC ($)'].join(',');
    const rows = forecasts.map(f => [
      `FQ-${String(f.id).padStart(4, '0')}`,
      new Date(f.created_at).toLocaleDateString(),
      f.origin_port, f.destination_port, f.commodity, f.vessel_class,
      f.cargo_volume, f.recommendation, f.confidence, f.total_landed_cost,
    ].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `freightiq-audit-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Reports & Audit History</h1>
          <p style={{ fontSize: 11, color: '#74777d', margin: '4px 0 0' }}>Immutable ledger of all generated forecasts and AI directives.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#74777d" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, port, commodity…" className="input-field"
              style={{ paddingLeft: 30, width: 240, fontSize: 12 }}/>
          </div>
          <button onClick={load} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}><RefreshCw size={13} /> Refresh</button>
          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}><Download size={13} /> Export CSV</button>
        </div>
      </div>

      {/* KPI Row — real data from /api/data?type=reports_kpis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Forecasts',     value: kpis?.totalForecasts ?? forecasts.length ?? 0,  suffix: `${kpis?.totalRoutes ?? 0} routes tracked` },
          { label: 'Procurement Savings', value: kpis?.totalSavings != null ? `$${Math.abs(Math.round(kpis.totalSavings)).toLocaleString()}` : '$0', suffix: 'vs spot market', color: '#0F5E5E' },
          { label: 'Decision Accuracy',   value: kpis?.avgConfidence != null ? `${kpis.avgConfidence}%` : '—', suffix: 'avg confidence score', color: '#0F5E5E' },
          { label: 'Active Watchdogs',    value: kpis?.activeWatchdogs ?? 0, suffix: `${kpis?.triggeredToday ?? 0} triggered today`, color: kpis?.triggeredToday > 0 ? '#ba1a1a' : '#74777d' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 20, boxShadow: '0 1px 8px rgba(11,30,51,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: (k as any).color || '#0B1E33', fontFamily: 'monospace' }}>{k.value}</div>
            {k.suffix && <div style={{ fontSize: 11, color: (k as any).color || '#74777d', marginTop: 4 }}>{k.suffix}</div>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 8px rgba(11,30,51,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr style={{ background: '#d2e4ff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#44474d' }}>
              {['ID / Date', 'Corridor', 'Cargo Profile', 'AI Signal', 'Projected TLC', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid #c4c6cd' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#74777d' }}>
                <RefreshCw size={20} color="#0F5E5E" style={{ animation: 'spin 1s linear infinite' }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#74777d', fontSize: 13 }}>
                No forecasts yet — <Link href="/new-forecast" style={{ color: '#0F5E5E', fontWeight: 700 }}>generate your first forecast →</Link>
              </td></tr>
            ) : filtered.map((f, i) => (
              <tr key={f.id}
                style={{ borderBottom: '1px solid #eff4ff', transition: 'background 0.12s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33', fontSize: 12 }}>FQ-{String(f.id).padStart(4, '0')}</div>
                  <div style={{ fontSize: 10, color: '#74777d' }}>{new Date(f.created_at).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#0B1E33', fontSize: 12 }}>{f.origin_port} → {f.destination_port}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#0B1E33', fontSize: 12 }}>{f.commodity}</div>
                  <div style={{ fontSize: 10, color: '#74777d', marginTop: 2 }}>{f.vessel_class} • {Number(f.cargo_volume/1000).toFixed(0)}k MT</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={S.chip(
                    f.recommendation === 'BUY_NOW' ? '#aaefee' : f.recommendation === 'WAIT' ? '#ffddb4' : '#0B1E33',
                    f.recommendation === 'BUY_NOW' ? '#0F5E5E' : f.recommendation === 'WAIT' ? '#633f00' : 'white'
                  )}>
                    {f.recommendation.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: 10, color: '#74777d', marginTop: 4 }}>Conf: {f.confidence}%</div>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33', fontSize: 13 }}>
                  ${Number(f.total_landed_cost).toLocaleString()}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Link href={`/forecast-results?id=${f.id}`} style={{ color: '#0F5E5E', fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
