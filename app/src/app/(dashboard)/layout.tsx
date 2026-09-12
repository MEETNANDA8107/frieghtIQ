'use client';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tickers, setTickers] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { 
        if (d?.tickers) setTickers(d.tickers); 
        if (d?.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#eff4ff' }}>
      <TopBar tickers={tickers} user={user} />

      {/* Body below the fixed top bar */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        marginTop: 56,
        overflow: 'hidden',
      }}>
        <Sidebar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          background: '#eff4ff',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
