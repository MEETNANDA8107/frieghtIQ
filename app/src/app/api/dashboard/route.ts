import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? '90D';
    const db = getDb();

    // Map range to days
    const days = range === '30D' ? 30 : range === '1Y' ? 365 : 90;
    // Anchor chart windows to the latest available observation. The seeded
    // dataset ends before the current calendar date, so using today would
    // make every range return an empty series.
    const latestFreightDate = db.prepare('SELECT MAX(date) as date FROM freight_rates').get() as any;
    const sinceDate = latestFreightDate?.date ? new Date(`${latestFreightDate.date}-01T00:00:00Z`) : new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    // Freight-rate observations are stored at month precision (YYYY-MM).
    const sinceDateStr = sinceDate.toISOString().slice(0, 7);

    const percentChange = (current: number | null, previous: number | null) =>
      current != null && previous ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

    // Latest and previous observations drive the dashboard tickers and trend badges.
    const freightRows = db.prepare(`
      SELECT * FROM freight_rates ORDER BY date DESC LIMIT 2
    `).all() as any[];
    const bdi = freightRows[0];
    const previousFreight = freightRows[1];
    
    // Latest VLSFO
    const fuelRows = db.prepare('SELECT vlsfo_price FROM fuel_prices ORDER BY date DESC LIMIT 2').all() as any[];
    const vlsfo = fuelRows[0];
    const previousVlsfo = fuelRows[1];

    // Fetch user details and profile
    const userRow = db.prepare(`
      SELECT u.full_name, p.role, p.business_model, p.commodities
      FROM users u
      LEFT JOIN company_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(session.userId) as any;

    let selectedCommodities: string[] = [];
    try {
      if (userRow?.commodities) {
        selectedCommodities = JSON.parse(userRow.commodities);
      }
    } catch (e) {}

    const COMMODITY_MAP: Record<string, string> = {
      'Iron Ore (62% Fe)': 'Iron Ore 62% Fe',
      'Thermal Coal': 'Thermal Coal Newcastle',
      'Coking Coal (Metallurgical)': 'Coking Coal',
      'Fertilizer (Urea/DAP)': 'Fertilizer (Urea)'
    };

    let dbCommodities = selectedCommodities.map(c => COMMODITY_MAP[c] || c);
    if (dbCommodities.length === 0) {
      dbCommodities = ['Iron Ore 62% Fe', 'Thermal Coal Newcastle', 'Coking Coal', 'Fertilizer (Urea)'];
    }

    // Active routes count for this user
    const activeRoutes = db.prepare('SELECT COUNT(*) as count FROM routes WHERE user_id = ? AND is_active = 1').get(session.userId) as any;

    // Latest commodity prices
    const placeholders = dbCommodities.map(() => '?').join(',');
    const commodities = db.prepare(`
      WITH ranked AS (
        SELECT commodity, price, date,
               LAG(price) OVER (PARTITION BY commodity ORDER BY date) AS previous_price,
               ROW_NUMBER() OVER (PARTITION BY commodity ORDER BY date DESC) AS row_number
        FROM commodity_prices
        WHERE commodity IN (${placeholders})
      )
      SELECT commodity, price, date,
             ROUND(CASE WHEN previous_price IS NULL OR previous_price = 0 THEN 0
                   ELSE ((price - previous_price) / previous_price) * 100 END, 1) AS changePct
      FROM ranked
      WHERE row_number = 1
      ORDER BY commodity
    `).all(...dbCommodities) as any[];

    // Alert watchdogs
    const watchdogs = db.prepare('SELECT COUNT(*) as count FROM alert_rules WHERE (user_id = ? OR user_id IS NULL) AND is_active = 1').get(session.userId) as any;
    const triggeredAlerts = db.prepare(`
      SELECT COUNT(*) as count 
      FROM alert_history h
      JOIN alert_rules r ON h.rule_id = r.id
      WHERE (r.user_id = ? OR r.user_id IS NULL) AND h.status = 'fired' 
      AND h.created_at > datetime('now', '-7 days')
    `).get(session.userId) as any;

    // Real AI directives from the forecasts table (last 3 generated)
    const directives = db.prepare(`
      SELECT id, commodity, origin_port, destination_port, vessel_class, cargo_volume,
             recommendation, confidence, risk_level, total_landed_cost, savings_json, created_at
      FROM forecasts 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 3
    `).all(session.userId) as any[];

    // Parse savings_json for each directive
    directives.forEach(d => {
      try { d.savings = d.savings_json ? JSON.parse(d.savings_json) : null; } catch { d.savings = null; }
    });

    // Rate spread data filtered by range
    const rateSpread = db.prepare(`
      SELECT date, capesize_rate, panamax_rate 
      FROM freight_rates 
      WHERE date >= ? 
      ORDER BY date ASC
      LIMIT 365
    `).all(sinceDateStr);

    // Port congestion for chokepoints (latest per port)
    const congestion = db.prepare(`
      SELECT port_name, avg_wait_days, vessels_at_anchor, congestion_index, date
      FROM port_congestion pc
      WHERE date = (SELECT MAX(date) FROM port_congestion WHERE port_name = pc.port_name)
      AND port_name IN ('Singapore', 'Paradip', 'Krishnapatnam', 'Visakhapatnam', 'Port Hedland')
    `).all() as any[];

    // Aggregate savings stats
    const savingsStats = db.prepare(`
      SELECT 
        COUNT(*) as total_forecasts,
        SUM(CASE WHEN recommendation = 'BUY_NOW' THEN 1 ELSE 0 END) as buy_count,
        AVG(confidence) as avg_confidence,
        SUM(total_landed_cost) as total_tlc
      FROM forecasts WHERE user_id = ?
    `).get(session.userId) as any;

    return NextResponse.json({
      user: { 
        fullName: userRow?.full_name || 'User',
        role: userRow?.role || 'Procurement Lead',
        businessModel: userRow?.business_model || 'Dry Bulk Importer'
      },
      tickers: {
        bdi:      bdi?.baltic_dry_index  ?? 1842,
        vlsfo:    vlsfo?.vlsfo_price     ?? 612.50,
        capesize: bdi?.capesize_rate     ?? 22400,
        bdiMom:   percentChange(bdi?.baltic_dry_index, previousFreight?.baltic_dry_index),
        vlsfoMom: percentChange(vlsfo?.vlsfo_price, previousVlsfo?.vlsfo_price),
        capeMom:  percentChange(bdi?.capesize_rate, previousFreight?.capesize_rate),
      },
      activeRoutes: activeRoutes?.count ?? 0,
      commodities,
      alerts: {
        active:    watchdogs?.count ?? 0,
        triggered: triggeredAlerts?.count ?? 0,
      },
      directives,
      rateSpread,
      congestion,
      savingsStats,
      range,
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
