import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { runForecast } from '@/lib/forecast';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    // 1. Fetch historical data for the forecasting engine
    const freightData = db.prepare('SELECT capesize_rate, date FROM freight_rates ORDER BY date DESC LIMIT 200').all().reverse() as any[];
    
    const commodityName = body.commodity === 'Iron Ore' ? 'Iron Ore 62% Fe' : 
                         body.commodity === 'Thermal Coal' ? 'Thermal Coal Newcastle' :
                         body.commodity === 'Coking Coal' ? 'Coking Coal' :
                         body.commodity === 'Fertilizer' ? 'Fertilizer (Urea)' : body.commodity;
    const commodityData = db.prepare('SELECT price, date FROM commodity_prices WHERE commodity = ? ORDER BY date DESC LIMIT 200').all(commodityName).reverse() as any[];
    const fuelData = db.prepare('SELECT vlsfo_price, date FROM fuel_prices ORDER BY date DESC LIMIT 200').all().reverse() as any[];

    const hFreight = freightData.map((d: any) => d.capesize_rate).filter((v: number) => v > 0);
    const hCommodity = commodityData.map((d: any) => d.price).filter((v: number) => v > 0);
    const hFuel = fuelData.map((d: any) => d.vlsfo_price).filter((v: number) => v > 0);
    const dates = freightData.map((d: any) => d.date);

    // 2. Run the forecast engine
    const result = runForecast(
      {
        commodity: body.commodity,
        originPort: body.originPort,
        destinationPort: body.destinationPort,
        vesselClass: body.vesselClass,
        cargoVolume: Number(body.cargoVolume),
        laycanStart: body.laycanStart,
        laycanEnd: body.laycanEnd,
        riskTolerance: 0.5
      },
      hFreight,
      hCommodity,
      hFuel,
      dates
    );

    // 3. Save to database (including vessels + savings)
    let forecastId;
    const insert = db.transaction(() => {
      let route = db.prepare('SELECT id FROM routes WHERE user_id = ? AND origin_port = ? AND destination_port = ?').get(session.userId, body.originPort, body.destinationPort) as any;
      
      let routeId = route?.id;
      if (!routeId) {
        const res = db.prepare(`
          INSERT INTO routes (user_id, origin_port, origin_country, destination_port, destination_country, commodity)
          VALUES (?, ?, 'N/A', ?, 'N/A', ?)
        `).run(session.userId, body.originPort, body.destinationPort, body.commodity);
        routeId = res.lastInsertRowid;
      }

      const res = db.prepare(`
        INSERT INTO forecasts (
          user_id, route_id, commodity, origin_port, destination_port, vessel_class, 
          cargo_volume, laycan_start, laycan_end, freight_rate_forecast, 
          commodity_price_forecast, fuel_price_forecast, landed_cost_breakdown, 
          total_landed_cost, recommendation, confidence, risk_level, vessels, savings_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        session.userId,
        routeId,
        body.commodity,
        body.originPort,
        body.destinationPort,
        body.vesselClass,
        Number(body.cargoVolume),
        body.laycanStart,
        body.laycanEnd,
        JSON.stringify(result.freightForecast),
        JSON.stringify(result.commodityForecast),
        JSON.stringify(result.fuelForecast),
        JSON.stringify(result.landedCost),
        result.landedCost.total,
        result.recommendation,
        result.confidence,
        result.riskLevel,
        JSON.stringify(result.vessels),
        JSON.stringify(result.savings)
      );
      forecastId = res.lastInsertRowid;
      
      db.prepare('INSERT INTO audit_log (user_id, action_type, entity_type, entity_id) VALUES (?, ?, ?, ?)')
        .run(session.userId, 'RUN_FORECAST', 'forecasts', forecastId);
    });
    
    insert();

    return NextResponse.json({ success: true, forecastId, result });
  } catch (error: any) {
    console.error('Forecast API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const db = getDb();
    
    if (id) {
      const forecast = db.prepare('SELECT * FROM forecasts WHERE id = ? AND user_id = ?').get(id, session.userId) as any;
      if (!forecast) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      
      // Parse all JSON fields safely
      const parseJSON = (val: string | null, fallback: any = null) => {
        try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
      };
      forecast.freight_rate_forecast   = parseJSON(forecast.freight_rate_forecast, []);
      forecast.commodity_price_forecast = parseJSON(forecast.commodity_price_forecast, []);
      forecast.fuel_price_forecast     = parseJSON(forecast.fuel_price_forecast, []);
      forecast.landed_cost_breakdown   = parseJSON(forecast.landed_cost_breakdown, { items: [], perMT: 0, total: 0 });
      forecast.vessels                 = parseJSON(forecast.vessels, []);
      forecast.savings                 = parseJSON(forecast.savings_json, { netSavings: 0, vsSpot: 0, alphaMargin: 0 });
      
      return NextResponse.json({ forecast });
    }
    
    const forecasts = db.prepare(
      'SELECT id, commodity, origin_port, destination_port, vessel_class, cargo_volume, recommendation, confidence, total_landed_cost, created_at FROM forecasts WHERE user_id = ? ORDER BY created_at DESC'
    ).all(session.userId);
    return NextResponse.json({ forecasts });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
