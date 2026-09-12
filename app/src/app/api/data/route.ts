import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/data?type=freight_history&days=60
 * GET /api/data?type=congestion&port=Paradip
 * GET /api/data?type=commodity_history&commodity=Iron+Ore+62%25+Fe&days=60
 * GET /api/data?type=fuel_history&days=60
 * GET /api/data?type=reports_kpis
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'freight_history';
    const days = parseInt(searchParams.get('days') ?? '60', 10);
    const port = searchParams.get('port') ?? 'Paradip';
    const commodity = searchParams.get('commodity') ?? 'Iron Ore 62% Fe';

    const db = getDb();

    if (type === 'freight_history') {
      const data = db.prepare(`
        SELECT date, baltic_dry_index, capesize_rate, panamax_rate, handysize_rate
        FROM freight_rates 
        ORDER BY date DESC 
        LIMIT ?
      `).all(days).reverse();
      return NextResponse.json({ data, type, days });
    }

    if (type === 'congestion') {
      // Latest N weeks of congestion for a specific port
      const data = db.prepare(`
        SELECT date, port_name, vessels_at_anchor, avg_wait_days, congestion_index, port_utilization, is_simulated
        FROM port_congestion 
        WHERE port_name = ?
        ORDER BY date DESC 
        LIMIT ?
      `).all(port, Math.ceil(days / 7)).reverse();
      return NextResponse.json({ data, port, days });
    }

    if (type === 'congestion_all_ports') {
      // Latest record per port for all tracked ports
      const data = db.prepare(`
        SELECT pc.port_name, pc.avg_wait_days, pc.vessels_at_anchor, pc.congestion_index, pc.date, pd.max_draught
        FROM port_congestion pc
        LEFT JOIN port_data pd ON pd.port_name = pc.port_name
        WHERE pc.date = (SELECT MAX(date) FROM port_congestion WHERE port_name = pc.port_name)
        ORDER BY pc.port_name
      `).all();
      return NextResponse.json({ data });
    }

    if (type === 'commodity_history') {
      const data = db.prepare(`
        SELECT date, commodity, price, unit, is_simulated
        FROM commodity_prices 
        WHERE commodity = ?
        ORDER BY date DESC 
        LIMIT ?
      `).all(commodity, days).reverse();
      return NextResponse.json({ data, commodity, days });
    }

    if (type === 'fuel_history') {
      const data = db.prepare(`
        SELECT date, vlsfo_price, brent_price
        FROM fuel_prices 
        ORDER BY date DESC 
        LIMIT ?
      `).all(days).reverse();
      return NextResponse.json({ data, days });
    }

    if (type === 'reports_kpis') {
      const db = getDb();

      // Total forecasts by this user
      const totalForecasts = (db.prepare('SELECT COUNT(*) as c FROM forecasts WHERE user_id = ?').get(session.userId) as any)?.c ?? 0;

      // Total routes
      const totalRoutes = (db.prepare('SELECT COUNT(*) as c FROM routes WHERE user_id = ?').get(session.userId) as any)?.c ?? 0;

      // Average confidence score
      const avgConf = (db.prepare('SELECT AVG(confidence) as avg FROM forecasts WHERE user_id = ?').get(session.userId) as any)?.avg ?? 0;

      // Sum of net savings across all forecasts (from savings_json)
      const forecasts = db.prepare('SELECT savings_json FROM forecasts WHERE user_id = ?').all(session.userId) as any[];
      let totalSavings = 0;
      for (const f of forecasts) {
        try {
          const s = f.savings_json ? JSON.parse(f.savings_json) : null;
          if (s?.netSavings) totalSavings += s.netSavings;
        } catch {}
      }

      // Active watchdogs
      const activeWatchdogs = (db.prepare('SELECT COUNT(*) as c FROM alert_rules WHERE (user_id = ? OR user_id IS NULL) AND is_active = 1').get(session.userId) as any)?.c ?? 0;

      // Alerts triggered today
      const triggeredToday = (db.prepare(`
        SELECT COUNT(*) as c FROM alert_history h 
        JOIN alert_rules r ON h.rule_id = r.id
        WHERE (r.user_id = ? OR r.user_id IS NULL) AND h.created_at > datetime('now', '-1 day')
      `).get(session.userId) as any)?.c ?? 0;

      return NextResponse.json({
        totalForecasts,
        totalRoutes,
        avgConfidence: Math.round(avgConf * 10) / 10,
        totalSavings,
        activeWatchdogs,
        triggeredToday,
      });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error: any) {
    console.error('Data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
