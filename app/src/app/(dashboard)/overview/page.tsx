'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Anchor, TrendingUp, TrendingDown, RefreshCw, Download } from 'lucide-react';
import RateSpreadChart from '@/components/RateSpreadChart';

const S = {
  label: { fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase' as const, letterSpacing: '0.08em', display: 'block', marginBottom: 6 },
  chip:  (bg: string, color: string): React.CSSProperties => ({ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, background: bg, color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }),
  card:  { background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 20, boxShadow: '0 1px 8px rgba(11,30,51,0.05)' } as React.CSSProperties,
};

function trendBadge(pct: number): React.ReactNode {
  const up = pct >= 0;
  return (
    <span style={S.chip(up ? '#aaefee' : '#ffdad6', up ? '#0F5E5E' : '#ba1a1a')}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('90D');
  const requestId = useRef(0);

  const load = useCallback((r: string) => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    fetch(`/api/dashboard?range=${r}`)
      .then(res => res.json())
      .then(d => {
        if (currentRequestId !== requestId.current) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (currentRequestId === requestId.current) setLoading(false);
      });
  }, []);

  useEffect(() => { load(range); }, []);

  const handleRange = (r: string) => {
    setRange(r);
    load(r);
  };

  const exportDashboard = () => {
    if (!data) return;
    const lines = [
      'FreightIQ — Dashboard Snapshot',
      `Generated: ${new Date().toLocaleString()}`,
      `Range: ${range}`,
      '',
      `BDI: ${data.tickers?.bdi}`,
      `VLSFO: $${data.tickers?.vlsfo}/MT`,
      `Capesize: $${data.tickers?.capesize}/d`,
      '',
      'Commodity Prices:',
      ...(data.commodities ?? []).map((c: any) => `  ${c.commodity}: $${c.price}/MT`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `freightiq-dashboard-${Date.now()}.txt`;
    a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={24} color="#0F5E5E" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#74777d', fontSize: 13 }}>Initializing Commercial Terminal…</span>
    </div>
  );

  const t = data?.tickers ?? {};
  const commodities: any[] = data?.commodities ?? [];
  const congestion: any[] = data?.congestion ?? [];
  const directives: any[] = data?.directives ?? [];

  // Calculate commodity MoM change inline
  const commDisplay = commodities.map((c: any, i: number) => ({
    ...c,
    changePct: Number(c.changePct ?? 0),
  }));

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E33', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            Global Freight Desk <span style={S.chip('#aaefee', '#0F5E5E')}>REALTIME DOCK</span>
          </h1>
          <p style={{ fontSize: 11, color: '#74777d', margin: '4px 0 0' }}>Macro bunker pricing, AI dispatch recommendations, and port bottleneck intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #c4c6cd', borderRadius: 6, overflow: 'hidden' }}>
            {['30D', '90D', '1Y'].map(r => (
              <button key={r} onClick={() => handleRange(r)} style={{
                padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: r === range ? '#d2e4ff' : 'white', color: r === range ? '#0B1E33' : '#74777d',
                borderBottom: r === range ? '2px solid #0F5E5E' : '2px solid transparent', transition: 'all 0.15s',
              }}>{r}</button>
            ))}
          </div>
          <button onClick={() => load(range)} style={{ padding: '6px 14px', border: '1px solid #c4c6cd', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, color: '#44474d' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={exportDashboard} style={{ padding: '6px 14px', border: '1px solid #c4c6cd', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, color: '#44474d' }}>
            <Download size={13} /> Export
          </button>
          <Link href="/new-forecast" style={{ padding: '7px 16px', background: '#0F5E5E', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            + New Forecast
          </Link>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={S.label}>Active Routes</span>
            <Anchor size={16} color="#0F5E5E" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 300, color: '#0B1E33', margin: '8px 0 0' }}>
            <b>{data?.activeRoutes ?? 0}</b> <span style={{ fontSize: 16 }}>Lanes</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#0F5E5E', fontWeight: 700, marginTop: 8 }}>
            {data?.activeRoutes > 0 ? `${data.activeRoutes} tracked corridors` : 'Generate a forecast to add routes'}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={S.label}>Baltic Dry Index (BDI)</span>
            {trendBadge(t.bdiMom ?? 3.8)}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'monospace', color: '#0B1E33', margin: '8px 0 0' }}>
            {(t.bdi ?? 1842).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 300 }}>PTS</span>
          </div>
          <div style={{ height: 36, marginTop: 8 }}>
            <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
              <path d="M0,30 Q15,28 30,20 T60,18 T100,8" fill="none" stroke="#0F5E5E" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={S.label}>VLSFO Bunker Avg</span>
            {trendBadge(t.vlsfoMom ?? 0)}
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'monospace', color: '#0B1E33', margin: '8px 0 0' }}>
            ${(t.vlsfo ?? 612.5).toFixed(2)} <span style={{ fontSize: 14, fontWeight: 300 }}>/ MT</span>
          </div>
          <div style={{ height: 36, marginTop: 8 }}>
            <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
              <path d="M0,20 Q25,18 50,14 T100,10" fill="none" stroke="#b77800" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={S.label}>Risk Alerts</span>
            <span style={{ ...S.chip('#ffdad6', '#ba1a1a'), display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ba1a1a', display: 'inline-block' }} /> Critical
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#ba1a1a', margin: '8px 0 0' }}>
            {data?.alerts?.triggered ?? 0} <span style={{ fontSize: 16, fontWeight: 300, color: '#74777d' }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: '#74777d' }}>
            <span>{data?.alerts?.active ?? 0} watchdogs monitoring</span>
            <Link href="/alerts" style={{ color: '#0F5E5E', textDecoration: 'none' }}><ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Capesize & Panamax Rate Spread</h2>
              <p style={{ fontSize: 11, color: '#74777d', margin: '2px 0 0' }}>Daily fixture averages ($/d) — {range} window from seeded CSV data</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0B1E33' }} /> C3 Capesize</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F5E5E' }} /> P2A Panamax</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 240, background: '#f4f7fc', borderRadius: 6, padding: 8 }}>
            <RateSpreadChart data={data?.rateSpread ?? []} />
          </div>
        </div>

        {/* Maritime Map */}
        <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Maritime Corridors</h2>
            <p style={{ fontSize: 11, color: '#74777d', margin: '2px 0 0' }}>Live vessel positions & chokepoint delays</p>
          </div>
          <div style={{ flex: 1, background: '#0B1E33', borderRadius: 8, position: 'relative', minHeight: 240, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', fontSize: 9, fontFamily: 'monospace', color: '#aaefee', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaefee', display: 'inline-block', flexShrink: 0 }} />
              AU/ID → IN BULK CORRIDORS ACTIVE
            </div>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
              <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="400" y1="0" x2="400" y2="300" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <line x1="600" y1="0" x2="600" y2="300" stroke="rgba(143,210,210,0.07)" strokeWidth="1"/>
              <path d="M580,220 Q620,190 680,200 T800,185 L800,300 L480,300 Z" fill="#1a324c" opacity="0.7"/>
              <path d="M260,80 Q340,55 400,100 T490,70 L490,0 L210,0 Z" fill="#1a324c" opacity="0.7"/>
              <path d="M50,20 Q100,55 130,150 T110,230 L0,200 L0,0 Z" fill="#1a324c" opacity="0.7"/>
              {/* Australia → India routes */}
              <path d="M620,210 Q490,230 380,195 Q270,165 160,145" fill="none" stroke="#aaefee" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8"/>
              <path d="M600,225 Q470,250 360,210 Q250,175 145,160" fill="none" stroke="rgba(170,239,238,0.35)" strokeWidth="1" strokeDasharray="3 5"/>
              {/* Indonesia → India routes */}
              <path d="M490,190 Q420,200 340,185 Q240,175 155,152" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7"/>
              {/* Port dots */}
              <circle cx="622" cy="208" r="5" fill="none" stroke="#F5A623" strokeWidth="2"/><circle cx="622" cy="208" r="2.5" fill="#F5A623"/>
              <circle cx="598" cy="222" r="4" fill="none" stroke="#F5A623" strokeWidth="1.5"/><circle cx="598" cy="222" r="2" fill="#F5A623"/>
              <circle cx="490" cy="188" r="4" fill="none" stroke="#F5A623" strokeWidth="1.5"/><circle cx="490" cy="188" r="2" fill="#F5A623"/>
              <circle cx="158" cy="144" r="5" fill="none" stroke="#0F5E5E" strokeWidth="2"/><circle cx="158" cy="144" r="2.5" fill="#0F5E5E"/>
              <circle cx="148" cy="160" r="4" fill="none" stroke="#0F5E5E" strokeWidth="1.5"/><circle cx="148" cy="160" r="2" fill="#0F5E5E"/>
              {/* Vessel dots */}
              <circle cx="480" cy="215" r="3" fill="white" opacity="0.9"/>
              <circle cx="390" cy="193" r="3" fill="white" opacity="0.8"/>
              <circle cx="290" cy="174" r="3" fill="white" opacity="0.7"/>
              <circle cx="400" cy="202" r="2.5" fill="#F5A623" opacity="0.8"/>
              <circle cx="315" cy="188" r="2.5" fill="#F5A623" opacity="0.7"/>
              {/* Singapore */}
              <circle cx="430" cy="198" r="3.5" fill="#aaefee"/>
              <text x="436" y="194" fill="#aaefee" fontSize="8" fontFamily="monospace">SGP</text>
              <text x="612" y="234" fill="rgba(245,166,35,0.7)" fontSize="7" fontFamily="monospace">PH</text>
              <text x="136" y="142" fill="rgba(170,239,238,0.7)" fontSize="7" fontFamily="monospace">PRD</text>
            </svg>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontSize: 8, fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>
              <span>AU/ID LOADING → IN DISCHARGE</span>
              <span>AIS: SYNCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Commodity + ETS + Chokepoints ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>

        {/* Commodity Baskets — REAL from DB */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #c4c6cd', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Commodity Baskets</h2>
            <span style={S.label}>Latest from DB</span>
          </div>
          {commDisplay.length === 0 ? (
            <div style={{ fontSize: 12, color: '#74777d', textAlign: 'center', padding: '20px 0' }}>
              Run <code>/api/init</code> to seed commodity data
            </div>
          ) : commDisplay.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < commDisplay.length - 1 ? '1px solid #eff4ff' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: '#0B1E33' }}>
                <div style={{ width: 22, height: 22, background: '#d2e4ff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#0F5E5E', fontWeight: 700 }}>
                  {String(c.commodity ?? '')[0]}
                </div>
                <span>{c.commodity}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace' }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>${Number(c.price).toFixed(2)}/MT</span>
                <span style={{ fontSize: 10, color: c.changePct >= 0 ? '#0F5E5E' : '#ba1a1a' }}>{c.changePct >= 0 ? '▲' : '▼'}{Math.abs(c.changePct).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* EU ETS & Bunker */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0B1E33', margin: 0, maxWidth: 130, lineHeight: 1.3 }}>EU ETS & Bunker Surcharge</h2>
            <span style={S.chip('#ffddb4', '#633f00')}>EU Phase 2</span>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <div style={S.label}>TOTAL COMPLIANCE</div>
              <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33' }}>
                ${((t.vlsfo ?? 612.5) * 0.057).toFixed(2)}<span style={{ fontSize: 12, fontWeight: 400 }}> /MT</span>
              </div>
            </div>
            <div>
              <div style={S.label}>EUA CARBON COST</div>
              <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33' }}>€68.20<span style={{ fontSize: 11, fontWeight: 400 }}> /tCO₂</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33', marginBottom: 6 }}>
            <span>Bunker Impact Split</span><span>78% Fuel / 22% Carbon</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#eff4ff', overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', width: '78%', background: '#0B1E33', borderRadius: 99 }} />
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#eff4ff', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '22%', background: '#0F5E5E', borderRadius: 99 }} />
          </div>
        </div>

        {/* Chokepoints — real DB congestion data */}
        <div style={S.card}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Chokepoint Status (DB)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {congestion.length > 0 ? congestion.map((c: any) => {
              const level = c.congestion_index > 1.2 ? 'high' : c.congestion_index > 0.9 ? 'elevated' : 'normal';
              const color = level === 'high' ? '#ba1a1a' : level === 'elevated' ? '#b77800' : '#0F5E5E';
              return (
                <div key={c.port_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#eff4ff', borderRadius: 6, fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: '#0B1E33' }}>{c.port_name}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10 }}>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{Number(c.avg_wait_days).toFixed(1)}d avg</div>
                    <div style={{ color }}>{c.vessels_at_anchor} vessels</div>
                  </div>
                </div>
              );
            }) : (
              // Fallback static if no DB data yet
              [
                { name: 'Singapore Strait',   wait: 1.8, vessels: 12, level: 'elevated' },
                { name: 'Paradip Anchorage',  wait: 2.8, vessels: 9,  level: 'high' },
                { name: 'Krishnapatnam',       wait: 3.5, vessels: 14, level: 'high' },
                { name: 'Port Hedland',        wait: 0.8, vessels: 4,  level: 'normal' },
              ].map(c => {
                const color = c.level === 'high' ? '#ba1a1a' : c.level === 'elevated' ? '#b77800' : '#0F5E5E';
                return (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#eff4ff', borderRadius: 6, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#0B1E33' }}>{c.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 10 }}>
                      <div style={{ fontWeight: 700, color: '#0B1E33' }}>{c.wait}d avg</div>
                      <div style={{ color }}>{c.vessels} vessels</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── AI Procurement Directives — REAL from forecasts table ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0B1E33', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            AI Procurement & Dispatch Directives
            {directives.length > 0 && <span style={S.chip('#aaefee', '#0F5E5E')}>{directives.length} LATEST SIGNALS</span>}
          </h2>
          <Link href="/reports" style={{ fontSize: 12, color: '#0F5E5E', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All Signals <ArrowRight size={14} />
          </Link>
        </div>

        {directives.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1E33', marginBottom: 8 }}>No Forecasts Generated Yet</div>
            <p style={{ fontSize: 12, color: '#74777d', marginBottom: 16 }}>Generate your first AI freight forecast to see procurement directives here.</p>
            <Link href="/new-forecast" style={{ background: '#0F5E5E', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              + Generate First Forecast
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(directives.length, 3)}, 1fr)`, gap: 16 }}>
            {directives.map((d: any, i: number) => {
              const isBuy  = d.recommendation === 'BUY_NOW';
              const isWait = d.recommendation === 'WAIT';
              const savings = d.savings;
              const riskColor = d.risk_level === 'HIGH' ? '#ba1a1a' : d.risk_level === 'MODERATE' ? '#b77800' : '#0F5E5E';
              return (
                <div key={d.id}
                  style={{ ...S.card, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#0F5E5E')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#c4c6cd')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33', paddingBottom: 10, borderBottom: '1px solid #eff4ff', marginBottom: 12 }}>
                    <span>{d.origin_port} → {d.destination_port}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: riskColor }} /> {d.risk_level} RISK
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1E33', marginBottom: 8 }}>
                    {Number(d.cargo_volume).toLocaleString()} MT {d.vessel_class} • {d.commodity}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={S.chip(isBuy ? '#aaefee' : isWait ? '#ffddb4' : '#0B1E33', isBuy ? '#0F5E5E' : isWait ? '#633f00' : 'white')}>
                      {d.recommendation.replace('_', ' ')}
                    </span>
                    <span style={S.chip('#d2e4ff', '#0B1E33')}>CONF: {d.confidence}%</span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ background: '#eff4ff', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                        {savings?.netSavings != null ? 'NET SAVINGS' : 'TOTAL LANDED COST'}
                      </div>
                      <div style={{ fontSize: 17, fontFamily: 'monospace', fontWeight: 700, color: '#0F5E5E' }}>
                        {savings?.netSavings != null ? `$${Math.abs(savings.netSavings).toLocaleString()}` : `$${Number(d.total_landed_cost).toLocaleString()}`}
                      </div>
                    </div>
                    <Link href={`/forecast-results?id=${d.id}`} style={{ color: '#0F5E5E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
                      View <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
