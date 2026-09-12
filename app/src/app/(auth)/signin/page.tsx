"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Anchor, TrendingUp } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetch('/api/init').catch(console.error);
        router.push('/overview');
      } else {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch {
      setError('Network error — check your connection');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── LEFT BRAND PANEL ── */}
      <div style={{
        width: '42%',
        background: '#0B1E33',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Nautical chart grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M60 0L0 0 0 60" fill="none" stroke="white" strokeWidth="0.8"/>
                <circle cx="30" cy="30" r="1.5" fill="white" opacity="0.5"/>
                <path d="M26 30h8M30 26v8" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect fill="url(#grid)" width="100%" height="100%"/>
          </svg>
        </div>

        {/* Top section */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo + time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrandLogo width={180} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8fd2d2' }}>{time}</span>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8fd2d2', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              ENTERPRISE PORTAL
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: 0, marginBottom: 12 }}>
              Institutional Freight Intelligence
            </h2>
            <p style={{ fontSize: 13, color: '#8fd2d2', lineHeight: 1.6, margin: 0, maxWidth: 380 }}>
              Connecting sovereign grain traders, bulk mineral desks, and charterers directly into Baltic fixture forecasting and synthetic routing indices.
            </p>
          </div>
        </div>

        {/* BDI Card */}
        <div style={{
          background: 'rgba(6,15,26,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '20px 24px',
          backdropFilter: 'blur(8px)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Anchor size={18} color="#aaefee" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Baltic Dry Index (BDI)</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, background: '#0F5E5E', color: '#aaefee', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LIVE TICKER
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#8fd2d2', textTransform: 'uppercase', marginBottom: 4 }}>CURRENT</div>
              <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700 }}>1,842</div>
              <div style={{ fontSize: 11, color: '#aaefee', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} /> +3.4%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#8fd2d2', textTransform: 'uppercase', marginBottom: 4 }}>CAPESIZE (C3)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}>$21.40/t</div>
              <div style={{ fontSize: 10, color: '#8fd2d2', marginTop: 2 }}>Tubarao → Qingdao</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#8fd2d2', textTransform: 'uppercase', marginBottom: 4 }}>AI SIGNAL</div>
              <span style={{ display: 'inline-block', fontFamily: 'monospace', fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'white', color: '#0B1E33' }}>
                BUY NOW
              </span>
            </div>
          </div>
        </div>

        {/* Bottom SOC badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8fd2d2', position: 'relative', zIndex: 1 }}>
          <ShieldCheck size={14} />
          <span>SOC-2 Type II Certified Maritime Hub</span>
        </div>
      </div>

      {/* ── RIGHT LOGIN PANEL ── */}
      <div style={{
        flex: 1,
        background: '#f8f9ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0B1E33', margin: 0 }}>Sign In to Workspace</h1>
            <div style={{ fontSize: 13, textAlign: 'right', lineHeight: 1.5 }}>
              <div style={{ color: '#74777d' }}>New desk?</div>
              <Link href="/signup" style={{ color: '#0F5E5E', fontWeight: 600, textDecoration: 'none' }}>Register Desk →</Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#ffdad6', color: '#ba1a1a', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#0B1E33', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Work Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#0B1E33', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Password</label>
                <a href="#" style={{ fontSize: 11, color: '#0F5E5E', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 14 }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  Authenticating...
                </>
              ) : 'Access Terminal →'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#c4c6cd' }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Enterprise Single Sign-On</span>
              <div style={{ flex: 1, height: 1, background: '#c4c6cd' }}/>
            </div>

            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '11px 24px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google Workspace
            </button>

            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '11px 24px' }}>
              Sign in with Okta / SAML
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
