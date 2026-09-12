'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Wind, AlertTriangle, Anchor, Settings2, ShieldAlert, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const corridors = [
  { label: 'AU(PH) → IN(PRD) · IRON ORE · CAPESIZE', origin: 'Port Hedland', dest: 'Paradip', comm: 'Iron Ore', vessel: 'Capesize', vol: 170000 },
  { label: 'ID(KTM) → IN(KRP) · COAL · PANAMAX', origin: 'Kalimantan', dest: 'Krishnapatnam', comm: 'Thermal Coal', vessel: 'Panamax', vol: 75000 },
  { label: 'AU(DMP) → IN(VSK) · MET COAL · CAPESIZE', origin: 'Dampier', dest: 'Visakhapatnam', comm: 'Coking Coal', vessel: 'Capesize', vol: 160000 },
  { label: 'ID(SMR) → IN(KKD) · FERTILIZER · HANDY', origin: 'Samarinda', dest: 'Kakinada', comm: 'Fertilizer', vessel: 'Handysize', vol: 35000 },
];

const portInfo: Record<string, { draught: string; turn: string; congestion: string; level: string }> = {
  'Port Hedland': { draught: '18.2m', turn: '24h', congestion: 'Normal (0.8d)', level: 'normal' },
  'Dampier':      { draught: '17.5m', turn: '20h', congestion: 'Normal (0.6d)', level: 'normal' },
  'Kalimantan':   { draught: '14.0m', turn: '36h', congestion: 'Moderate (1.5d)', level: 'elevated' },
  'Samarinda':    { draught: '11.0m', turn: '48h', congestion: 'High (2.1d)',    level: 'high' },
  'Paradip':      { draught: '17.8m', turn: '30h', congestion: 'High (3.5d)',    level: 'high' },
  'Visakhapatnam':{ draught: '17.1m', turn: '28h', congestion: 'Elevated (2.2d)', level: 'elevated' },
  'Krishnapatnam':{ draught: '18.5m', turn: '24h', congestion: 'High (3.8d)',    level: 'high' },
  'Kakinada':     { draught: '10.5m', turn: '48h', congestion: 'Moderate (1.8d)', level: 'elevated' },
  'Chennai':      { draught: '17.4m', turn: '32h', congestion: 'Normal (1.0d)',   level: 'normal' },
};

const S = {
  label:  { fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 5 },
  chip:   (bg: string, color: string) => ({ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: bg, color, textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontFamily: 'monospace' }) as React.CSSProperties,
};

export default function NewForecastPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(0);
  const [freightHistory, setFreightHistory] = useState<any[]>([]);
  const [destCongestion, setDestCongestion] = useState<any>(null);
  const [form, setForm] = useState({
    originPort:      corridors[0].origin,
    destinationPort: corridors[0].dest,
    commodity:       corridors[0].comm,
    vesselClass:     corridors[0].vessel,
    cargoVolume:     corridors[0].vol,
    laycanStart:     '2026-10-15',
    laycanEnd:       '2026-10-25',
  });

  // Load freight history for the historical chart
  useEffect(() => {
    fetch('/api/data?type=freight_history&days=60')
      .then(r => r.json())
      .then(d => { if (d.data) setFreightHistory(d.data); })
      .catch(() => {});
  }, []);

  // Load port congestion for the dest port whenever it changes
  useEffect(() => {
    const portName = form.destinationPort;
    fetch(`/api/data?type=congestion&port=${encodeURIComponent(portName)}&days=7`)
      .then(r => r.json())
      .then(d => {
        if (d.data && d.data.length > 0) setDestCongestion(d.data[d.data.length - 1]);
        else setDestCongestion(null);
      })
      .catch(() => {});
  }, [form.destinationPort]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (i: number) => {
    const c = corridors[i];
    setActivePreset(i);
    setForm(f => ({ ...f, originPort: c.origin, destinationPort: c.dest, commodity: c.comm, vesselClass: c.vessel, cargoVolume: c.vol }));
  };

  const handleForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success && data.forecastId) {
        router.push(`/forecast-results?id=${data.forecastId}`);
      } else {
        setError(data.error || 'Failed to generate forecast');
        setLoading(false);
      }
    } catch {
      setError('Network error — please try again');
      setLoading(false);
    }
  };

  const origInfo = portInfo[form.originPort] ?? { draught: '—', turn: '—', congestion: '—', level: 'normal' };
  const destInfo  = portInfo[form.destinationPort] ?? { draught: '—', turn: '—', congestion: 'Unknown', level: 'normal' };
  const congColor = { normal: '#0F5E5E', elevated: '#b77800', high: '#ba1a1a' }[destInfo.level as 'normal' | 'elevated' | 'high'] ?? '#74777d';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B1E33', margin: 0 }}>New Cargo & Freight Forecast</h1>
        <p style={{ fontSize: 11, color: '#74777d', margin: '4px 0 0' }}>
          Configure corridor parameters to generate AI synthetic fixture routing and optimal hedging window.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {corridors.map((c, i) => (
          <button key={i} onClick={() => applyPreset(i)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid',
            fontSize: 10, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer',
            letterSpacing: '0.04em', transition: 'all 0.15s',
            background: i === activePreset ? '#0B1E33' : 'white',
            borderColor: i === activePreset ? '#0B1E33' : '#c4c6cd',
            color: i === activePreset ? 'white' : '#44474d',
          }}>
            {c.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#ffdad6', color: '#ba1a1a', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>

        {/* ── Left: Config Form ── */}
        <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #eff4ff', fontSize: 13, fontWeight: 700, color: '#0B1E33' }}>
            <Settings2 size={17} color="#0F5E5E" /> Voyage Configuration Parameters
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Commodity */}
            <div>
              <label style={S.label}>Cargo / Commodity Base</label>
              <select className="input-field" value={form.commodity} onChange={e => set('commodity', e.target.value)}
                style={{ fontWeight: 600, color: '#0B1E33', cursor: 'pointer' }}>
                <option value="Iron Ore">Iron Ore (62% Fe) — Fines &amp; Pellets</option>
                <option value="Thermal Coal">Thermal Coal (Newcastle Benchmark)</option>
                <option value="Coking Coal">Coking Coal (Metallurgical)</option>
                <option value="Fertilizer">Fertilizer (Urea / DAP)</option>
              </select>
            </div>

            {/* Port selector */}
            <div style={{ border: '1px solid #c4c6cd', borderRadius: 8, padding: 14, background: '#f8f9ff', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 23, top: 38, bottom: 38, width: 1, background: '#c4c6cd' }} />

              {/* Origin */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0B1E33', border: '3px solid #f8f9ff', flexShrink: 0, marginTop: 26, zIndex: 1 }} />
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Loading Port</label>
                  <select className="input-field" value={form.originPort} onChange={e => set('originPort', e.target.value)} style={{ background: 'white', fontWeight: 600 }}>
                    <option value="Port Hedland">Port Hedland, Australia (WA)</option>
                    <option value="Dampier">Dampier, Australia (WA)</option>
                    <option value="Kalimantan">Kalimantan, Indonesia</option>
                    <option value="Samarinda">Samarinda, Indonesia</option>
                  </select>
                  <div style={{ fontSize: 10, color: '#0F5E5E', marginTop: 4, fontFamily: 'monospace' }}>
                    Draft: {origInfo.draught} | Turn: {origInfo.turn}
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0F5E5E', border: '3px solid #f8f9ff', flexShrink: 0, marginTop: 26, zIndex: 1 }} />
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Discharge Port</label>
                  <select className="input-field" value={form.destinationPort} onChange={e => set('destinationPort', e.target.value)} style={{ background: 'white', fontWeight: 600 }}>
                    <option value="Paradip">Paradip, India (EC)</option>
                    <option value="Visakhapatnam">Visakhapatnam, India (EC)</option>
                    <option value="Krishnapatnam">Krishnapatnam, India (EC)</option>
                    <option value="Kakinada">Kakinada, India (EC)</option>
                    <option value="Chennai">Chennai, India (EC)</option>
                  </select>
                  <div style={{ fontSize: 10, color: congColor, marginTop: 4, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> Congestion: {destInfo.congestion}
                  </div>
                </div>
              </div>
            </div>

            {/* Vessel + Volume */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={S.label}>Vessel Class</label>
                <select className="input-field" value={form.vesselClass} onChange={e => set('vesselClass', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="Capesize">Capesize (130k–200k DWT)</option>
                  <option value="Panamax">Panamax (60k–90k DWT)</option>
                  <option value="Supramax">Supramax (45k–65k DWT)</option>
                  <option value="Handysize">Handysize (20k–40k DWT)</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Cargo Intake (MT)</label>
                <input type="number" className="input-field" value={form.cargoVolume} onChange={e => set('cargoVolume', Number(e.target.value))}
                  style={{ fontFamily: 'monospace', fontWeight: 700 }} />
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={S.label}>Laycan Start</label>
                <input type="date" className="input-field" value={form.laycanStart} onChange={e => set('laycanStart', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Laycan End</label>
                <input type="date" className="input-field" value={form.laycanEnd} onChange={e => set('laycanEnd', e.target.value)} />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eff4ff' }}>
            <button onClick={handleForecast} disabled={loading} className="btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 14, boxShadow: '0 4px 20px rgba(245,166,35,0.35)' }}>
              {loading ? (
                <><RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} /> Processing Model…</>
              ) : (
                <>Generate AI Freight & Cargo Forecast <Zap size={17} /></>
              )}
            </button>
          </div>
        </div>

        {/* ── Right: Visual Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Digital Twin Map */}
          <div style={{ background: '#0B1E33', borderRadius: 10, flex: 1, position: 'relative', overflow: 'hidden', minHeight: 280 }}>
            <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 1, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: '#aaefee', letterSpacing: '0.08em', background: 'rgba(11,30,51,0.8)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(170,239,238,0.3)' }}>
              DIGITAL TWIN ROUTING MAP
            </div>
            <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 1, display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 9, color: 'white', fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 8px' }}>
                DIST: ~4,120 NM
              </span>
              <span style={{ fontSize: 9, color: 'white', fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 8px' }}>
                DUR: ~13.8 DAYS
              </span>
            </div>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
              {/* Landmass silhouettes */}
              <path d="M580,220 Q640,180 700,210 T800,190 L800,300 L480,300 Z" fill="#1a324c" opacity="0.7"/>
              <path d="M300,100 Q370,60 430,120 T530,80 L530,0 L230,0 Z" fill="#1a324c" opacity="0.7"/>
              <path d="M60,30 Q110,60 140,140 T120,220 L0,180 L0,0 Z" fill="#1a324c" opacity="0.7"/>
              {/* Grid */}
              {[100,200,300,400,500,600,700].map(x => <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="rgba(170,239,238,0.05)" strokeWidth="1"/>)}
              {[75,150,225].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(170,239,238,0.05)" strokeWidth="1"/>)}
              {/* Route */}
              <path d="M640,200 Q440,240 300,180 T140,130" fill="none" stroke="#aaefee" strokeWidth="2" strokeDasharray="6 4" opacity="0.9"/>
              {/* Port markers */}
              <circle cx="640" cy="200" r="7" fill="none" stroke="#F5A623" strokeWidth="2"/>
              <circle cx="640" cy="200" r="3" fill="#F5A623"/>
              <circle cx="140" cy="130" r="7" fill="none" stroke="#0F5E5E" strokeWidth="2"/>
              <circle cx="140" cy="130" r="3" fill="#0F5E5E"/>
              {/* Labels */}
              <text x="648" y="218" fill="white" fontSize="10" fontFamily="monospace">{form.originPort}</text>
              <text x="100" y="120" fill="white" fontSize="10" fontFamily="monospace">{form.destinationPort}</text>
              {/* Vessels */}
              <circle cx="450" cy="218" r="3.5" fill="white" opacity="0.9"/>
              <circle cx="350" cy="195" r="3" fill="white" opacity="0.7"/>
              <circle cx="250" cy="162" r="3" fill="white" opacity="0.6"/>
              {/* Weather zone */}
              <circle cx="380" cy="185" r="45" fill="rgba(186,26,26,0.12)" stroke="rgba(186,26,26,0.3)" strokeWidth="1" strokeDasharray="4 4"/>
              <text x="360" y="182" fill="rgba(186,26,26,0.8)" fontSize="8" fontFamily="monospace">WEATHER ZONE</text>
            </svg>
          </div>

          {/* Risk Radar + Historical */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Risk Radar — real port congestion from DB */}
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Route Risk Radar</h3>
                <span style={{ fontSize: 9, color: '#0F5E5E', fontWeight: 700, fontFamily: 'monospace' }}>DB-BACKED</span>
              </div>
              {(() => {
                // Real congestion index (0–2) from DB, normalized to 0–100 for the bar
                const congIdx = destCongestion?.congestion_index ?? 0.9;
                const waitDays = destCongestion?.avg_wait_days ?? 1.5;
                const congPct = Math.min(100, Math.round(congIdx * 50));
                const congLevel = congIdx > 1.3 ? { l: 'HIGH', c: '#ba1a1a' } : congIdx > 0.9 ? { l: 'ELEVATED', c: '#b77800' } : { l: 'NORMAL', c: '#0F5E5E' };
                const rows = [
                  { label: 'Port Congestion', icon: Anchor,       val: congPct, color: congLevel.c, level: `${congLevel.l} (${waitDays.toFixed(1)}d)` },
                  { label: 'Weather Risk',    icon: Wind,         val: 72,      color: '#ba1a1a',   level: 'HIGH — Bay of Bengal' },
                  { label: 'Geopolitical',    icon: ShieldAlert,  val: 15,      color: '#0F5E5E',   level: 'LOW' },
                  { label: 'Cyclone Season',  icon: AlertTriangle,val: 65,      color: '#ba1a1a',   level: 'HIGH — Oct–Nov' },
                ];
                return rows.map(r => (
                  <div key={r.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#44474d' }}><r.icon size={12} /> {r.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: r.color }}>{r.level}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: '#eff4ff', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.val}%`, background: r.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Historical chart — REAL freight data from DB */}
            <div style={{ background: 'white', border: '1px solid #c4c6cd', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0B1E33', margin: '0 0 2px' }}>Historical BDI (60 Days)</h3>
                  <div style={{ fontSize: 10, color: '#74777d' }}>From CSV-seeded DB</div>
                </div>
                {freightHistory.length > 0 && (() => {
                  const first = freightHistory[0]?.baltic_dry_index ?? 0;
                  const last  = freightHistory[freightHistory.length - 1]?.baltic_dry_index ?? 0;
                  const pct   = first > 0 ? ((last - first) / first * 100).toFixed(1) : '0.0';
                  const up = parseFloat(pct) >= 0;
                  return <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, background: up ? '#ffddb4' : '#aaefee', color: up ? '#633f00' : '#0F5E5E', textTransform: 'uppercase' as const }}>{up ? '↗' : '↘'} {Math.abs(parseFloat(pct))}% 60D</span>;
                })()}
              </div>
              <div style={{ flex: 1, minHeight: 100 }}>
                {freightHistory.length === 0 ? (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#74777d' }}>Loading…</div>
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={freightHistory.map((d: any) => ({ date: d.date.slice(5), bdi: d.baltic_dry_index }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bdiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0B1E33" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0B1E33" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4ff" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#74777d' }} tickLine={false} axisLine={false} interval={Math.floor(freightHistory.length / 5)} />
                      <YAxis hide={true} />
                      <Tooltip contentStyle={{ background: '#0B1E33', border: 'none', borderRadius: 6, fontSize: 10 }} labelStyle={{ color: '#aaefee' }} itemStyle={{ color: 'white' }} formatter={(v: number) => [v.toLocaleString(), 'BDI']} />
                      <Area type="monotone" dataKey="bdi" stroke="#0B1E33" strokeWidth={2} fill="url(#bdiGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
