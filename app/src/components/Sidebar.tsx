'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  FileBarChart2,
  History,
  BellRing,
  Settings,
  LogOut,
} from 'lucide-react';

const links = [
  { name: 'Overview',          href: '/overview',         icon: LayoutDashboard },
  { name: 'New Forecast',      href: '/new-forecast',     icon: LineChart },
  { name: 'Forecast Results',  href: '/forecast-results', icon: FileBarChart2,  badge: 'AI' },
  { name: 'Reports & History', href: '/reports',          icon: History },
  { name: 'Alerts & Rules',    href: '/alerts',           icon: BellRing },
  { name: 'Settings',          href: '/settings',         icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    const refreshAlertCount = () => {
      fetch('/api/alerts')
        .then(response => response.json())
        .then(data => setActiveAlertCount((data.rules ?? []).filter((rule: any) => rule.is_active).length))
        .catch(() => setActiveAlertCount(0));
    };

    refreshAlertCount();
    window.addEventListener('alerts:changed', refreshAlertCount);
    return () => window.removeEventListener('alerts:changed', refreshAlertCount);
  }, [pathname]);

  const handleSignout = async () => {
    // Clear cookie by calling a simple reset
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/signin');
  };

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: '#f8f9ff',
      borderRight: '1px solid #c4c6cd',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Section label */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #c4c6cd' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#74777d', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Commercial Terminal
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {links.map(({ name, href, icon: Icon, badge }) => {
          const active = pathname === href;
          const badgeValue = name === 'Alerts & Rules' ? String(activeAlertCount) : badge;
          return (
            <Link
              key={name}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#0B1E33' : '#44474d',
                background: active ? '#d2e4ff' : 'transparent',
                borderLeft: active ? '3px solid #0F5E5E' : '3px solid transparent',
                transition: 'all 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#e5eeff'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={17} color={active ? '#0F5E5E' : '#74777d'} />
              <span style={{ flex: 1 }}>{name}</span>
              {badgeValue && (
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
                  padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                  background: badge === 'AI' ? '#aaefee' : '#ffddb4',
                  color: badge === 'AI' ? '#0F5E5E' : '#633f00',
                }}>
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status + signout */}
      <div style={{ borderTop: '1px solid #c4c6cd', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11, color: '#74777d' }}>
          <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#0F5E5E', flexShrink: 0 }} />
          Baltic Exchange Feed Active
        </div>
        <button
          onClick={handleSignout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#74777d', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ffdad6')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
