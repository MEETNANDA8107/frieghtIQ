"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

const ROLES = [
  { id: 'Procurement Lead', title: 'Procurement Lead / Commodity Director', desc: 'Budget authorization, forward hedging, fixture buy/wait sign-off', badge: 'RECOMMENDED FOR DESK HEADS' },
  { id: 'Chartering Desk', title: 'Chartering Desk / Voyage Operator', desc: 'Spot fixtures, tonnage availability, laycan optimization' },
  { id: 'Risk & Compliance', title: 'Risk & Compliance / Hedging Lead', desc: 'FFA derivatives, bunker hedging, EU ETS carbon compliance' },
  { id: 'Market Analyst', title: 'Market Analyst / Freight Economist', desc: 'Supply/demand balance, tonne-mile metrics, Baltic indices' },
  { id: 'Executive Viewer', title: 'Executive / Board Viewer', desc: 'Global exposure summaries, quarterly freight spend delta, P&L sensitivity rollups' },
];

const BIZ_MODELS = ['Dry Bulk Importer', 'Commodity Trader', 'Shipping / Chartering', 'Freight Brokerage', 'Industrial Utility / Mill'];
const DESK_SIZES = [
  'Solo Desk (1 seat - Independent Charterer)',
  'Boutique Desk (2–5 seats - Regional Trading)',
  'Enterprise Fleet (6–20 seats - Multi-Origin)',
  'Global Trading Desk (20+ seats - Institutional)'
];

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    password: '',
    role: 'Procurement Lead',
    businessModel: 'Dry Bulk Importer',
    deskSize: 'Boutique Desk (2-5 seats)',
    annualVolume: '500,000 - 2,500,000 DWT',
    commodities: ['Iron Ore (62% Fe)', 'Thermal Coal', 'Coking Coal (Metallurgical)'],
    corridors: [
      { originPort: 'Kalimantan', originCountry: 'ID', destPort: 'Krishnapatnam', destCountry: 'IN', commodity: 'Thermal Coal' },
      { originPort: 'Port Hedland', originCountry: 'AU', destPort: 'Paradip', destCountry: 'IN', commodity: 'Iron Ore' },
      { originPort: 'Dampier', originCountry: 'AU', destPort: 'Visakhapatnam', destCountry: 'IN', commodity: 'Coking Coal' }
    ],
    vesselClasses: ['Capesize', 'Panamax / Kamsar'],
    benchmarkIndex: 'Baltic C5 Proxy (W. Australia → India E. Coast)',
    settlementCurrency: 'USD ($) - Global Maritime Benchmark Default',
    notifications: {
      criticalRateDip: true,
      dailyDigest: true,
      chokepointCongestion: true,
      webhookStream: false
    }
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep(5); // Success step
      } else {
        setError(data.error || 'Failed to register');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Top Bar for Auth */}
      <header className="w-full bg-white border-b border-outline-variant h-14 flex items-center px-8 justify-between">
        <div className="flex items-center gap-2">
          <BrandLogo width={200} />
          <span className="px-2 py-0.5 bg-teal-bright text-teal text-[10px] font-bold rounded ml-2">ENTERPRISE PORTAL</span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/signin" className="text-on-surface-variant hover:text-navy">Sign In</Link>
          <span className="text-navy font-bold border-b-2 border-teal pb-4 translate-y-2">Register Desk</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Informational Panel */}
        <div className="w-full lg:w-1/3 bg-navy text-white p-12">
          <div className="text-xs font-mono text-teal-muted mb-2 tracking-widest uppercase">WORKSPACE PROVISIONING</div>
          <h2 className="text-3xl font-bold mb-4">Configuring Multi-Role Chartering Workspaces</h2>
          <p className="text-teal-muted text-sm leading-relaxed mb-12">
            FreightIQ dynamically calibrates its risk sensitivity graphs, AIS freight corridors, and predictive prompt engine to your operational purview.
          </p>

          <div className="bg-navy-dark rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4 text-xs font-mono text-teal-bright">
              <div className="w-2 h-2 rounded-full bg-teal-bright"></div>
              FIXTURE WORKSPACE MAPPING ACTIVE SEED
            </div>
            <div className="bg-[#1a324c] rounded p-4 mb-4 flex items-center justify-between">
              <div>
                <div className="font-bold">Procurement Director</div>
                <div className="text-xs text-teal-muted">Target: High-Level Fixture Directives</div>
              </div>
              <div className="px-2 py-1 bg-white/10 rounded text-xs font-mono">TIER 1</div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-2/3 p-12 bg-surface">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-medium mb-6">
                {error}
              </div>
            )}
            
            {/* Step Indicators */}
            {step < 5 && (
              <div className="mb-10">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  <span>WIZARD DISPATCH • Step {step} of 4: {step === 1 ? 'Account' : step === 2 ? 'Role & Organization' : step === 3 ? 'Trade Profile' : 'Data Setup'}</span>
                  <span>{step * 25}% Completed</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-teal' : 'bg-outline-variant/30'}`}></div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Account */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-navy mb-2">Set up your company's freight desk</h1>
                <p className="text-on-surface-variant mb-8">Create your primary enterprise administrator account to initiate commodity rate forecasting and route arbitration models.</p>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-xs font-bold mb-1 block">Full Name *</label>
                    <input type="text" className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">Work Email *</label>
                    <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="text-xs font-bold mb-1 block">Company Legal Entity Name *</label>
                  <input type="text" className="input-field" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-xs font-bold mb-1 block">Master Password *</label>
                    <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} className="btn-amber">Continue to Role Setup →</button>
                </div>
              </div>
            )}

            {/* Step 2: Role */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-navy mb-8">What is your primary operational role?</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {ROLES.map(r => {
                    const selected = formData.role === r.id;
                    return (
                      <div key={r.id} onClick={() => setFormData({...formData, role: r.id})} className={`border-2 rounded-lg p-4 flex gap-4 cursor-pointer transition-all ${selected ? 'border-teal bg-teal-bright/10' : 'border-outline-variant bg-white hover:border-teal/50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mt-1 shrink-0 ${selected ? 'bg-teal text-white' : 'bg-surface-highest text-transparent'}`}>✓</div>
                        <div>
                          <h3 className="font-bold text-navy text-base">{r.title}</h3>
                          <p className="text-sm text-on-surface-variant">{r.desc}</p>
                          {r.badge && <span className="inline-block mt-2 px-2 py-1 bg-teal-bright text-teal text-[10px] font-bold rounded uppercase">{r.badge}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-navy mb-4 text-sm uppercase tracking-wider">Company Business Model</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {BIZ_MODELS.map(m => {
                      const selected = formData.businessModel === m;
                      return (
                        <button key={m} onClick={() => setFormData({...formData, businessModel: m})} type="button" className={`p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1 shadow-sm transition-all text-xs ${selected ? 'bg-navy text-white font-semibold' : 'bg-white text-navy hover:bg-surface-low border border-outline-variant'}`}>
                          <span>{m}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-navy">Chartering Desk Size</label>
                    <select className="input-field w-full" value={formData.deskSize} onChange={e => setFormData({...formData, deskSize: e.target.value})}>
                      {DESK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-navy">Annual Seaborne Volume</label>
                    <div className="h-11 px-4 bg-white border border-outline-variant rounded-lg flex items-center justify-between shadow-sm mt-1">
                      <span className="font-mono font-bold text-navy">500,000 - 2,500,000 DWT</span>
                      <span className="px-2 py-1 bg-surface-highest text-on-surface-variant text-[10px] rounded uppercase font-bold">MID-CAP BULK</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                  <button onClick={() => setStep(3)} className="btn-amber">Continue to Trade Profile →</button>
                </div>
              </div>
            )}

            {/* Step 3: Trade Profile */}
            {step === 3 && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-navy mb-2">Configure your primary trade corridors</h1>
                <p className="text-on-surface-variant mb-8">Seed the AI procurement engine with your core commodities and active shipping lanes.</p>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-highest text-navy flex items-center justify-center text-xs">1</span> Which commodities do you procure or trade?</h3>
                    <span className="text-xs text-on-surface-variant">Select all applicable</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Iron Ore (62% Fe)', 'Thermal Coal', 'Coking Coal (Metallurgical)', 'Bauxite', 'Fertilizer (Urea/DAP)', 'Agri / Grain'].map(c => {
                      const selected = formData.commodities.includes(c);
                      return (
                        <button key={c} onClick={() => {
                          if (selected) setFormData({...formData, commodities: formData.commodities.filter(x => x !== c)});
                          else setFormData({...formData, commodities: [...formData.commodities, c]});
                        }} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${selected ? 'bg-navy text-white shadow-sm' : 'bg-white border border-outline-variant text-navy hover:bg-surface-low'}`}>
                          {c} {selected && <span>✓</span>}
                        </button>
                      )
                    })}
                    {formData.commodities.filter(c => !['Iron Ore (62% Fe)', 'Thermal Coal', 'Coking Coal (Metallurgical)', 'Bauxite', 'Fertilizer (Urea/DAP)', 'Agri / Grain'].includes(c)).map(c => (
                      <button key={c} onClick={() => setFormData({...formData, commodities: formData.commodities.filter(x => x !== c)})} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all bg-navy text-white shadow-sm">
                        {c} <span>✓</span>
                      </button>
                    ))}
                    <button onClick={() => {
                      const name = prompt("Enter commodity name:");
                      if (name && !formData.commodities.includes(name)) setFormData({...formData, commodities: [...formData.commodities, name]});
                    }} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-white border border-teal text-teal hover:bg-teal-bright/10 transition-all font-bold">
                      + Add Commodity
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-highest text-navy flex items-center justify-center text-xs">2</span> Monitored Trade Corridors</h3>
                    <span className="text-xs font-bold text-teal">{formData.corridors.length} Active Lanes</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {formData.corridors.map((c, i) => (
                      <div key={i} className="p-4 border border-outline-variant rounded-lg bg-white flex justify-between items-center hover:border-teal transition-all">
                        <div>
                          <div className="font-mono text-sm font-bold text-navy flex items-center gap-2">
                            {c.originPort} ({c.originCountry}) <span className="text-outline-variant">→</span> {c.destPort} ({c.destCountry})
                            <span className="px-2 py-0.5 bg-surface-highest text-navy text-[10px] rounded font-bold ml-2">{c.commodity}</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-1">Dist: ~4,000 NM • Draft Limit: 14.5m • Avg Transit: ~13 d</div>
                        </div>
                        <button onClick={() => setFormData({...formData, corridors: formData.corridors.filter((_, idx) => idx !== i)})} className="w-8 h-8 rounded hover:bg-error-container text-outline hover:text-error flex items-center justify-center transition-colors">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Route */}
                  <div className="flex gap-2 p-3 bg-surface-low rounded-lg border border-outline-variant/50">
                    <select id="originSel" className="input-field flex-1 text-sm py-2">
                      <option value="">Origin Port...</option>
                      <option value="Richards Bay|ZA">Richards Bay (ZA)</option>
                      <option value="Newcastle|AU">Newcastle (AU)</option>
                      <option value="Tubarao|BR">Tubarao (BR)</option>
                    </select>
                    <select id="destSel" className="input-field flex-1 text-sm py-2">
                      <option value="">Discharge Port...</option>
                      <option value="Ennore|IN">Ennore (IN)</option>
                      <option value="Haldia|IN">Haldia (IN)</option>
                      <option value="Qingdao|CN">Qingdao (CN)</option>
                    </select>
                    <button onClick={() => {
                      const o = (document.getElementById('originSel') as HTMLSelectElement).value;
                      const d = (document.getElementById('destSel') as HTMLSelectElement).value;
                      if (o && d) {
                        const [op, oc] = o.split('|');
                        const [dp, dc] = d.split('|');
                        setFormData({...formData, corridors: [...formData.corridors, { originPort: op, originCountry: oc, destPort: dp, destCountry: dc, commodity: formData.commodities[0] || 'Unknown' }]});
                      }
                    }} className="btn-secondary whitespace-nowrap py-2 px-4 text-sm font-bold border-teal text-teal hover:bg-teal-bright/10">
                      + Add Route
                    </button>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-highest text-navy flex items-center justify-center text-xs">3</span> Preferred Vessel Classes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'Capesize', size: '120k – 200k DWT', desc: 'Bulk ore, deep water berths.' },
                      { id: 'Panamax / Kamsar', size: '65k – 85k DWT', desc: 'Coal parcels, grain stems.' },
                      { id: 'Supramax / Ultra', size: '50k – 60k DWT', desc: 'Geared 4x30t cranes.' },
                      { id: 'Handysize', size: '28k – 40k DWT', desc: 'Shallow port access.' }
                    ].map(v => {
                      const selected = formData.vesselClasses.includes(v.id);
                      return (
                        <div key={v.id} onClick={() => {
                          if (selected) setFormData({...formData, vesselClasses: formData.vesselClasses.filter(x => x !== v.id)});
                          else setFormData({...formData, vesselClasses: [...formData.vesselClasses, v.id]});
                        }} className={`p-4 rounded-lg cursor-pointer transition-all border ${selected ? 'border-teal bg-teal-bright/10 shadow-sm' : 'border-outline-variant bg-white opacity-80 hover:opacity-100'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-navy text-sm">{v.id}</span>
                            <span className={`text-lg ${selected ? 'text-teal' : 'text-outline-variant'}`}>{selected ? '✓' : '○'}</span>
                          </div>
                          <div className="font-mono text-xs text-teal mb-2">{v.size}</div>
                          <div className="text-xs text-on-surface-variant">{v.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-surface-highest text-navy flex items-center justify-center text-xs">4</span> Pricing Indexation & Settlement Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-on-surface-variant">Default Benchmark Index</label>
                      <select className="input-field w-full" value={formData.benchmarkIndex} onChange={e => setFormData({...formData, benchmarkIndex: e.target.value})}>
                        <option value="Baltic C5 Proxy (W. Australia → India E. Coast)">Baltic C5 Proxy (W. Australia → India E. Coast)</option>
                        <option value="Baltic Dry Index (BDI Global Comprehensive)">Baltic Dry Index (BDI Global Comprehensive)</option>
                        <option value="Baltic Capesize Index (BCI 4TC)">Baltic Capesize Index (BCI 4TC)</option>
                        <option value="S&P Global Platts IODEX 62% CFR China">S&P Global Platts IODEX 62% CFR China</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-on-surface-variant">Base Settlement Currency</label>
                      <select className="input-field w-full" value={formData.settlementCurrency} onChange={e => setFormData({...formData, settlementCurrency: e.target.value})}>
                        <option value="USD ($) - Global Maritime Benchmark Default">USD ($) — Global Maritime Benchmark Default</option>
                        <option value="EUR (€) - Continental Port Clearances">EUR (€) — Continental Port Clearances</option>
                        <option value="INR (₹) - Domestic Stevedoring & Customs">INR (₹) — Domestic Stevedoring & Customs</option>
                        <option value="SGD (S$) - Singapore Bunkering Hub">SGD (S$) — Singapore Bunkering Hub</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-6 -mx-12 -mb-12 bg-surface-low border-t border-outline-variant/30">
                  <button onClick={() => setStep(2)} className="btn-secondary bg-white">← Back to Step 2</button>
                  <button onClick={() => setStep(4)} className="btn-amber">Save & Continue to Preferences →</button>
                </div>
              </div>
            )}

            {/* Step 4: Data & Feeds */}
            {step === 4 && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-navy mb-2">Notification & Data Feed Preferences</h1>
                <p className="text-on-surface-variant mb-8">Choose how your chartering desk receives actionable procurement signals.</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-white border border-outline-variant rounded-lg">
                    <div>
                      <div className="font-bold text-navy flex items-center gap-2">Critical Rate Dip & Arbitrage Dispatches <span className="badge badge-teal">HIGH PRIORITY</span></div>
                      <div className="text-sm text-on-surface-variant mt-1">Immediate push alerting when route volatility exceeds ±3.0%</div>
                    </div>
                    <div className="w-10 h-6 bg-teal rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white border border-outline-variant rounded-lg">
                    <div>
                      <div className="font-bold text-navy">Daily Executive Morning Digest</div>
                      <div className="text-sm text-on-surface-variant mt-1">Comprehensive summary of Baltic Exchange indices and bunker spreads</div>
                    </div>
                    <div className="w-10 h-6 bg-teal rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-low p-4 rounded-lg border border-teal/20 mb-8 flex gap-3">
                  <div className="text-teal font-bold text-xl">ℹ</div>
                  <div className="text-sm text-navy">
                    <strong>Need IT Security Clearance for API Keys?</strong><br/>
                    You can proceed immediately with FreightIQ's pre-configured data streams.
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(3)} className="btn-secondary">← Back</button>
                  <button onClick={handleSubmit} disabled={loading} className="btn-amber px-8 bg-navy text-white hover:bg-navy-light">
                    {loading ? 'Provisioning Workspace...' : 'Complete Desk Setup & Launch 🚀'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="animate-fade-in text-center py-12">
                <div className="w-16 h-16 bg-teal-bright text-teal rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-navy mb-4">You're all set, {formData.fullName ? formData.fullName.split(' ')[0] : 'there'}!</h1>
                <p className="text-lg text-on-surface-variant mb-8 max-w-md mx-auto">
                  Your FreightIQ terminal is synced with live Baltic Exchange indices and calibrated to your trade parameters.
                </p>
                
                <div className="bg-teal-bright/20 border border-teal/30 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
                  <div className="text-xs font-bold text-teal uppercase tracking-wider mb-2">AI DIRECTIVE SIGNAL</div>
                  <div className="text-lg font-bold text-navy mb-1">Projected <span className="text-teal">+$780,000</span> net savings window detected</div>
                  <div className="text-sm text-on-surface-variant">Optimal Capesize chartering window opens in 14 days before projected cyclone surcharge spike.</div>
                </div>

                <button onClick={() => {
                  // Init db just in case it hasn't been seeded
                  fetch('/api/init').catch(console.error);
                  router.push('/overview');
                }} className="btn-amber text-lg px-8 py-4">
                  Go to Commercial Terminal Dashboard →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
