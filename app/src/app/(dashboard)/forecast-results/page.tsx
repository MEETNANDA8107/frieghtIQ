'use client';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Ship, RefreshCw, CheckCircle2, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line, Legend
} from 'recharts';
import Link from 'next/link';

const S = {
  label:  { fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 4 },
  chip:   (bg: string, color: string): React.CSSProperties => ({ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '3px 9px', borderRadius: 4, background: bg, color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }),
  card:   { background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 20, boxShadow: '0 1px 8px rgba(11,30,51,0.05)' } as React.CSSProperties,
};

/* ── Recharts-based forecast curve ────────────────────────────────── */
function ForecastChart({ points, color, label, unit }: { points: any[]; color: string; label: string; unit: string }) {
  if (!points || points.length === 0) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#74777d', fontSize: 12 }}>No forecast data</div>
  );

  const data = points.slice(0, 60).map((p: any, i: number) => ({
    day: `D+${i + 1}`,
    value: Math.round(p.value * 100) / 100,
    upper: Math.round(p.upper * 100) / 100,
    lower: Math.max(0, Math.round(p.lower * 100) / 100),
  }));

  // Thin out labels to every 10 days
  const ticks = data.filter((_: any, i: number) => i % 10 === 0 || i === data.length - 1).map((d: any) => d.day);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4ff" />
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#74777d' }} ticks={ticks} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#74777d' }} axisLine={false} tickLine={false}
          tickFormatter={(v) => unit === '$/MT' ? `$${v}` : unit === '$/d' ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={48} />
        <Tooltip
          contentStyle={{ background: '#0B1E33', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}
          labelStyle={{ color: '#aaefee', marginBottom: 4 }}
          itemStyle={{ color: 'white' }}
          formatter={(v: number) => [`${unit === '$/d' ? `$${v.toLocaleString()}` : `$${v.toFixed(2)}`}`, label]}
        />
        <Area type="monotone" dataKey="upper" stroke="none" fill={`url(#grad-${label})`} name="Upper CI" legendType="none" />
        <Area type="monotone" dataKey="lower" stroke="none" fill="white" name="Lower CI" legendType="none" />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#grad-${label})`} dot={false} activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }} name={label} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Main page content ────────────────────────────────────────────── */
function ForecastResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [hedgeConfirmed, setHedgeConfirmed] = useState(false);

  // Sensitivity sliders
  const [freightAdj, setFreightAdj] = useState(0);
  const [bunkerAdj, setBunkerAdj] = useState(0);
  const [delayDays, setDelayDays] = useState(0);

  const loadForecast = useCallback((fid: string | null) => {
    if (!fid) {
      fetch('/api/forecast')
        .then(r => r.json())
        .then(d => {
          if (d.forecasts?.length > 0) loadForecast(String(d.forecasts[0].id));
          else setLoading(false);
        });
      return;
    }
    setLoading(true);
    fetch(`/api/forecast?id=${fid}`)
      .then(r => r.json())
      .then(d => { setData(d.forecast ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadForecast(id); }, [id, loadForecast]);

  const handleRecalculate = async () => {
    if (!data) return;
    setRecalculating(true);
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: data.commodity,
          originPort: data.origin_port,
          destinationPort: data.destination_port,
          vesselClass: data.vessel_class,
          cargoVolume: data.cargo_volume,
          laycanStart: data.laycan_start,
          laycanEnd: data.laycan_end,
        }),
      });
      const result = await res.json();
      if (result.success && result.forecastId) {
        router.push(`/forecast-results?id=${result.forecastId}`);
      }
    } finally {
      setRecalculating(false);
    }
  };

  const handleHedge = async () => {
    if (!data) return;
    // Log to audit trail
    await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Hedge Order — FQ-${String(data.id).padStart(4,'0')}`, ruleType: 'freight_rate', metric: 'ffa_settlement', condition: 'manual_execute', threshold: data.total_landed_cost, unit: 'USD', corridor: `${data.origin_port} → ${data.destination_port}`, channels: ['Hedging API', 'Email'] })
    }).catch(() => {});
    setHedgeConfirmed(true);
    setTimeout(() => setHedgeConfirmed(false), 4000);
  };

  const exportPDF = () => {
    if (!data) return;
    const content = [
      `FreightIQ Fixture Directive — FQ-${String(data.id).padStart(4, '0')}`,
      `Route: ${data.origin_port} → ${data.destination_port}`,
      `Commodity: ${data.commodity} | Vessel: ${data.vessel_class} | Volume: ${Number(data.cargo_volume).toLocaleString()} MT`,
      `Recommendation: ${data.recommendation} (${data.confidence}% confidence)`,
      `Total Landed Cost: $${Number(data.total_landed_cost).toLocaleString()}`,
      `Per MT: $${data.landed_cost_breakdown?.perMT?.toFixed(2) ?? 'N/A'}`,
      '',
      'Cost Breakdown:',
      ...(data.landed_cost_breakdown?.items ?? []).map((item: any) => `  ${item.component}: $${item.totalUsd.toLocaleString()} (${(item.share * 100).toFixed(1)}%)`),
      '',
      `Net Projected Savings vs Spot: $${data.savings?.netSavings?.toLocaleString() ?? 'N/A'}`,
      `Alpha Margin: ${data.savings?.alphaMargin ?? 'N/A'}%`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `freightiq-FQ-${String(data.id).padStart(4,'0')}.txt`;
    a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={28} color="#0F5E5E" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#74777d', fontSize: 13 }}>Loading Forecast Results…</span>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1E33', marginBottom: 8 }}>No Forecast Found</div>
      <p style={{ color: '#74777d', marginBottom: 20 }}>Generate a forecast first to view results.</p>
      <Link href="/new-forecast" style={{ background: '#0F5E5E', color: 'white', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
        + New Forecast
      </Link>
    </div>
  );

  const isBuy  = data.recommendation === 'BUY_NOW';
  const isWait = data.recommendation === 'WAIT';
  const isHedge = data.recommendation === 'HEDGE';

  const bannerBg = isBuy ? '#0F5E5E' : isWait ? '#b77800' : '#0B1E33';
  const savings = data.savings ?? {};
  const landedCost = data.landed_cost_breakdown ?? { items: [], perMT: 0, total: 0 };
  const vessels: any[] = data.vessels ?? [];

  // Sensitivity adjustments
  const freightPortion = landedCost.items?.[1]?.totalUsd ?? 0;
  const bunkerPortion  = landedCost.items?.[2]?.totalUsd ?? 0;
  const baseCost = data.total_landed_cost ?? 0;
  const adjFreight = freightPortion * (1 + freightAdj / 100);
  const adjBunker  = bunkerPortion  * (1 + bunkerAdj  / 100);
  const delayCost  = delayDays * 20000;
  const newTotal   = baseCost - freightPortion - bunkerPortion + adjFreight + adjBunker + delayCost;
  const deltaCost  = Math.round(newTotal - baseCost);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Link href="/reports" style={{ color: '#74777d', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
              <ArrowLeft size={14} /> All Forecasts
            </Link>
            <span style={S.chip('#d2e4ff', '#0B1E33')}>ID: FQ-{String(data.id).padStart(4, '0')}</span>
            <span style={S.chip(isBuy ? '#aaefee' : isWait ? '#ffddb4' : '#0B1E33', isBuy ? '#0F5E5E' : isWait ? '#633f00' : 'white')}>
              {data.recommendation.replace('_', ' ')}
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0B1E33', margin: 0 }}>AI Synthetic Fixture Directive</h1>
          <div style={{ fontSize: 12, color: '#74777d', fontFamily: 'monospace', marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>{data.origin_port} → {data.destination_port}</span>
            <span style={{ color: '#c4c6cd' }}>|</span>
            <span>{data.commodity}</span>
            <span style={{ color: '#c4c6cd' }}>|</span>
            <span>{Number(data.cargo_volume).toLocaleString()} MT ({data.vessel_class})</span>
            <span style={{ color: '#c4c6cd' }}>|</span>
            <span>{new Date(data.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={exportPDF} style={{ padding: '7px 14px', border: '1px solid #c4c6cd', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#44474d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export Report
          </button>
          <button onClick={handleRecalculate} disabled={recalculating} style={{ padding: '7px 14px', border: '1px solid #c4c6cd', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#44474d', display: 'flex', alignItems: 'center', gap: 6 }}>
            {recalculating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            Recalculate
          </button>
          <button onClick={handleHedge} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: hedgeConfirmed ? '#0F5E5E' : '#0B1E33', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}>
            {hedgeConfirmed ? <><CheckCircle2 size={14} /> Order Logged!</> : 'Execute Hedging Orders'}
          </button>
        </div>
      </div>

      {/* ── AI Recommendation Banner ── */}
      <div style={{ background: bannerBg, borderRadius: 10, padding: '20px 28px', marginBottom: 24, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', opacity: 0.12 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d="M0,100 L60,0 L100,0 L100,100 Z" fill="white"/>
          </svg>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 4 }}>
                {isBuy ? 'OPTIMAL WINDOW' : isWait ? 'MARKET SOFTENING' : 'VOLATILITY HEDGE'}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.75 }}>CONFIDENCE: {data.confidence}%</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {isBuy ? 'BUY CARGO NOW' : isWait ? 'WAIT 2–3 WEEKS' : 'HEDGE FREIGHT (FFA)'}
            </div>
            <p style={{ fontSize: 13, opacity: 0.85, maxWidth: 580, lineHeight: 1.6, margin: 0 }}>
              {isBuy
                ? `Freight and commodity prices are forecast to rise. Current window offers optimal procurement timing. Recommend locking cargo now and chartering in ${Math.round(data.cargo_volume / 10000)} days.`
                : isWait
                ? `Market indicators suggest near-term softening. AI model projects freight rate easing. Monitor Baltic C5 proxy and re-evaluate in 2–3 weeks.`
                : `Mixed signals in the corridor. Recommend taking FFA hedges for the settlement window to lock in current rates while maintaining upside optionality.`}
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '16px 24px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginBottom: 4 }}>NET PROJECTED SAVINGS</div>
            <div style={{ fontSize: 32, fontFamily: 'monospace', fontWeight: 700 }}>${Math.abs(savings.netSavings ?? 0).toLocaleString()}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>+{savings.alphaMargin ?? 0}% alpha vs spot</div>
          </div>
        </div>
      </div>

      {/* ── Two-column main body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
        
        {/* ── LEFT: TLC + Sensitivity + Forecast Charts ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Total Landed Cost Breakdown */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: '1px solid #eff4ff', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Total Landed Cost Decomposition</h2>
                <p style={{ fontSize: 11, color: '#74777d', margin: '3px 0 0' }}>Cradle-to-destination unit economics</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={S.label}>PROJECTED TLC / MT</div>
                <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 700, color: '#0F5E5E' }}>
                  ${(landedCost.perMT ?? 0).toFixed(2)}
                </div>
              </div>
            </div>

            {(landedCost.items ?? []).map((item: any, i: number) => {
              const barColors = ['#0B1E33', '#0F5E5E', '#b77800', '#74777d', '#c4c6cd'];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < landedCost.items.length - 1 ? '1px solid #eff4ff' : 'none' }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: barColors[i], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1E33' }}>{item.component}</div>
                    <div style={{ fontSize: 10, color: '#74777d', fontFamily: 'monospace' }}>{item.unitMetric}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33' }}>${item.totalUsd.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#74777d' }}>{(item.share * 100).toFixed(1)}%</div>
                  </div>
                  <div style={{ width: 80, height: 6, background: '#eff4ff', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${(item.share * 100).toFixed(0)}%`, background: barColors[i], borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '10px 14px', background: '#eff4ff', borderRadius: 8, border: '1px solid rgba(15,94,94,0.15)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>Gross Voyage Value (Total)</span>
              <span style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: '#0F5E5E' }}>${(data.total_landed_cost ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* 60-Day Forecast Charts — REAL RECHARTS DATA */}
          <div style={S.card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: '0 0 16px' }}>60-Day Forward Curve Projections</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { key: 'freight_rate_forecast',    label: 'Capesize Freight', color: '#0B1E33', unit: '$/d',  data: data.freight_rate_forecast },
                { key: 'commodity_price_forecast', label: 'Cargo FOB Price',  color: '#b77800', unit: '$/MT', data: data.commodity_price_forecast },
                { key: 'fuel_price_forecast',      label: 'VLSFO Bunker',     color: '#0F5E5E', unit: '$/MT', data: data.fuel_price_forecast },
              ].map(c => {
                const pts: any[] = c.data ?? [];
                const latest = pts[0]?.value ?? 0;
                const last   = pts[pts.length - 1]?.value ?? 0;
                const trend  = latest > 0 ? ((last - latest) / latest * 100).toFixed(1) : '0.0';
                const trendUp = parseFloat(trend) > 0;
                return (
                  <div key={c.key} style={{ border: '1px solid #eff4ff', borderRadius: 8, padding: '12px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0B1E33' }}>{c.label}</span>
                      <span style={{ ...S.chip(trendUp ? '#ffddb4' : '#aaefee', trendUp ? '#633f00' : '#0F5E5E') }}>
                        {trendUp ? '↗' : '↘'} {Math.abs(parseFloat(trend))}%
                      </span>
                    </div>
                    <ForecastChart points={pts} color={c.color} label={c.label} unit={c.unit} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: 'monospace', color: '#74777d' }}>
                      <span>NOW: {c.unit === '$/d' ? `$${Math.round(latest).toLocaleString()}` : `$${latest.toFixed(2)}`}</span>
                      <span>D+60: {c.unit === '$/d' ? `$${Math.round(last).toLocaleString()}` : `$${last.toFixed(2)}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What-If Sensitivity Engine */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: 0 }}>What-If Sensitivity Engine</h2>
                <p style={{ fontSize: 11, color: '#74777d', margin: '3px 0 0' }}>Stress-test the chartering recommendation</p>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', fontWeight: 700,
                background: deltaCost > 0 ? '#ffdad6' : deltaCost < 0 ? '#aaefee' : '#eff4ff',
                color: deltaCost > 0 ? '#ba1a1a' : deltaCost < 0 ? '#0F5E5E' : '#0B1E33',
              }}>
                {deltaCost === 0 ? 'Baseline' : `${deltaCost > 0 ? '+' : ''}$${Math.abs(deltaCost).toLocaleString()}`}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'Freight Rate Volatility (C3/P2A)', value: freightAdj, setter: setFreightAdj, min: -20, max: 20, step: 1, suffix: '%', accentColor: '#0B1E33' },
                { label: 'Bunker Fuel Surge (VLSFO)', value: bunkerAdj, setter: setBunkerAdj, min: -15, max: 30, step: 1, suffix: '%', accentColor: '#b77800' },
                { label: 'Port Congestion Delay (Discharge)', value: delayDays, setter: setDelayDays, min: 0, max: 14, step: 1, suffix: ' Days', accentColor: '#ba1a1a' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#0B1E33', marginBottom: 6 }}>
                    <span>{s.label}</span>
                    <span style={{ fontFamily: 'monospace', color: s.accentColor }}>{s.value > 0 ? '+' : ''}{s.value}{s.suffix}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.setter(Number(e.target.value))}
                    style={{ width: '100%', accentColor: s.accentColor }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#74777d', fontFamily: 'monospace', marginTop: 3 }}>
                    <span>{s.min}{s.suffix}</span><span>0{s.suffix}</span><span>+{s.max}{s.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Vessel Candidates ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Vessel Candidates — REAL from forecast engine */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #eff4ff', marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Vessel Candidates in Range</h2>
              <span style={S.chip('#aaefee', '#0F5E5E')}>AIS LIVE</span>
            </div>
            {vessels.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#74777d', fontSize: 12 }}>
                No vessel data — regenerate forecast.
              </div>
            ) : vessels.map((v: any, i: number) => (
              <div key={i} style={{
                border: '1px solid #c4c6cd', borderRadius: 8, padding: '12px 14px', marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0F5E5E')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#c4c6cd')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0B1E33', fontSize: 13 }}>
                    <Ship size={14} color="#0F5E5E" /> {v.name}
                  </div>
                  <span style={S.chip('#aaefee', '#0F5E5E')}>{v.matchPct}% Match</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 10, fontFamily: 'monospace' }}>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>DWT</div>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{v.dwt.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>BUILT</div>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{v.built}</div>
                  </div>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>TYPE</div>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{v.type}</div>
                  </div>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>OPEN AT</div>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{v.openPort}</div>
                  </div>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>ETA LOAD</div>
                    <div style={{ fontWeight: 700, color: '#0B1E33' }}>{v.eta}</div>
                  </div>
                  <div>
                    <div style={{ color: '#74777d', marginBottom: 2 }}>RATE</div>
                    <div style={{ fontWeight: 700, color: '#0F5E5E' }}>${v.indicativeRate.toFixed(2)}/MT</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Route Intelligence */}
          <div style={S.card}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0B1E33', margin: '0 0 14px' }}>Route Intelligence</h2>
            {[
              { label: 'Corridor',        val: `${data.origin_port} → ${data.destination_port}` },
              { label: 'Laycan Window',   val: data.laycan_start ? `${data.laycan_start} → ${data.laycan_end}` : 'Open' },
              { label: 'Risk Level',      val: data.risk_level },
              { label: 'Model Version',   val: data.model_version ?? 'v4.8' },
              { label: 'Generated At',    val: new Date(data.created_at).toLocaleString() },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eff4ff', fontSize: 12 }}>
                <span style={{ color: '#74777d', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0B1E33' }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Savings Summary */}
          <div style={{ ...S.card, background: '#0B1E33', borderColor: '#0B1E33' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaefee', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>PROCUREMENT ALPHA SUMMARY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total Landed Cost',    val: `$${(data.total_landed_cost ?? 0).toLocaleString()}`, color: 'white' },
                { label: 'Spot Market Equivalent', val: `$${(savings.vsSpot ?? 0).toLocaleString()}`, color: '#8fd2d2' },
                { label: 'Net Savings',          val: `$${(savings.netSavings ?? 0).toLocaleString()}`, color: '#F5A623' },
                { label: 'Alpha Margin',         val: `${savings.alphaMargin ?? 0}%`, color: '#F5A623' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8fd2d2' }}>{r.label}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForecastResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
        <RefreshCw size={24} color="#0F5E5E" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#74777d', fontSize: 13 }}>Loading…</span>
      </div>
    }>
      <ForecastResultsContent />
    </Suspense>
  );
}
