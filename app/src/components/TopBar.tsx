'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function TopBar({ tickers, user }: { tickers?: any, user?: any }) {
  const [searchVal, setSearchVal] = useState('');

  const t = tickers || {};
  const bdi = t.bdi ?? 1842;
  const vlsfo = t.vlsfo ?? 612.5;
  const cape = t.capesize ?? 22400;
  const formatTrend = (value: number) => `${value >= 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(1)}%`;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 56,
      background: '#0B1E33',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 20,
      paddingRight: 20,
      gap: 16,
      boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
    }}>

      {/* Logo — fixed width so it never wraps */}
      <Link href="/overview" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, width: 290 }}>
        <BrandLogo width={36} />
        <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
          FreightIQ
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#aaefee', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          DECISION ENGINE
        </span>
      </Link>

      {/* Live Tickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div className="ticker-item">
          <span style={{ color: '#8fd2d2', fontSize: 10 }}>BDI</span>
          <span style={{ fontWeight: 700 }}>{bdi.toLocaleString()}</span>
          <span style={{ color: '#aaefee', fontSize: 10 }}>{formatTrend(t.bdiMom ?? 0)}</span>
        </div>
        <div className="ticker-item">
          <span style={{ color: '#8fd2d2', fontSize: 10 }}>VLSFO</span>
          <span style={{ fontWeight: 700 }}>${typeof vlsfo === 'number' ? vlsfo.toFixed(0) : vlsfo}/MT</span>
        </div>
        <div className="ticker-item">
          <span style={{ color: '#8fd2d2', fontSize: 10 }}>CAPE</span>
          <span style={{ fontWeight: 700 }}>${typeof cape === 'number' ? cape.toLocaleString() : cape}/d</span>
          <span style={{ color: '#aaefee', fontSize: 10 }}>{formatTrend(t.capeMom ?? 0)}</span>
        </div>
      </div>

      {/* Search — grows to fill middle */}
      <div style={{ flex: 1, position: 'relative', maxWidth: 460 }}>
        <Search size={14} color="#74777d" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search commodity, port, route…"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '5px 12px 5px 30px',
            color: 'white',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = '#0F5E5E')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      </div>

      {/* Right — spacer + user */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, position: 'relative' }}
          onClick={() => {}}>
          <Bell size={18} color="#8fd2d2" />
          <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: '#F5A623', borderRadius: '50%', border: '1.5px solid #0B1E33' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              {user?.role ? user.role.toUpperCase() : 'PROCUREMENT DESK'}
            </div>
            <div style={{ fontSize: 10, color: '#aaefee', lineHeight: 1.2 }}>
              {user?.fullName || 'Loading...'} • {user?.businessModel || 'Importer'}
            </div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F5E5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={17} color="white" />
          </div>
        </div>
      </div>
    </header>
  );
}
