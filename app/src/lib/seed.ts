import { getDb } from './db';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const DATASETS_DIR = path.join(process.cwd(), '..', 'datasets', 'Freightos Baltic Index');

export function seedDatabase() {
  const db = getDb();
  
  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM freight_rates').get() as any;
  if (count?.c > 0) return;

  console.log('[SEED] Starting database seeding...');

  // 1. Seed shipping rates / freight rates
  seedFreightRates(db);

  // 2. Seed commodity prices from CSV + simulated series
  seedCommodityPrices(db);

  // 3. Seed fuel prices (derived from Brent Crude)
  seedFuelPrices(db);

  // 4. Seed port reference data
  seedPortData(db);

  // 5. Seed port congestion (from CSV + simulated Indian ports)
  seedPortCongestion(db);

  // 6. Seed sample alert rules
  seedAlertRules(db);

  console.log('[SEED] Database seeding complete!');
}

function readCSV(filename: string): any[] {
  const filePath = path.join(DATASETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[SEED] CSV not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true });
  return result.data;
}

function seedFreightRates(db: any) {
  const data = readCSV('shipping_rates.csv');
  const stmt = db.prepare(`INSERT INTO freight_rates (date, baltic_dry_index, c5_proxy_rate, capesize_rate, panamax_rate, handysize_rate, container_rate, is_simulated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const insert = db.transaction(() => {
    for (const row of data) {
      if (!row.date) continue;
      const bdi = row.baltic_dry_index || 0;
      // C5 proxy: BDI / 170 gives approximate $/MT for Capesize Australia→Asia
      const c5Proxy = Math.round((bdi / 170) * 100) / 100;
      const capesizeDay = row.bulk_carrier_handysize_usd_day || 0;
      stmt.run(
        row.date,
        bdi,
        c5Proxy,
        capesizeDay * 1.8, // Capesize ~1.8x Handysize
        capesizeDay * 1.3, // Panamax ~1.3x Handysize  
        capesizeDay,
        row.container_rate_usd_40ft || 0,
        0
      );
    }
  });
  insert();
  console.log(`[SEED] Seeded ${data.length} freight rate records`);
}

function seedCommodityPrices(db: any) {
  const data = readCSV('commodity_prices_supply_chain.csv');
  const stmt = db.prepare(`INSERT INTO commodity_prices (date, commodity, price, unit, is_simulated) VALUES (?, ?, ?, ?, ?)`);
  
  // Insert actual Thermal Coal and Brent Crude from CSV
  const relevantCommodities = ['Thermal Coal Newcastle', 'Brent Crude', 'WTI Crude', 'Copper', 'Nickel'];
  const insert = db.transaction(() => {
    let count = 0;
    for (const row of data) {
      if (!row.date || !row.commodity || !row.price) continue;
      if (relevantCommodities.includes(row.commodity)) {
        stmt.run(row.date, row.commodity, row.price, `${row.currency}/${row.unit}`, 0);
        count++;
      }
    }
    console.log(`[SEED] Seeded ${count} actual commodity price records`);
  });
  insert();

  // Generate simulated Iron Ore 62% Fe prices
  generateSimulatedCommodity(db, 'Iron Ore 62% Fe', 80, 130, 'USD/MT');
  
  // Generate simulated Coking Coal prices
  generateSimulatedCommodity(db, 'Coking Coal', 120, 280, 'USD/MT');
  
  // Generate simulated Fertilizer (Urea) prices
  generateSimulatedCommodity(db, 'Fertilizer (Urea)', 200, 450, 'USD/MT');
}

function generateSimulatedCommodity(db: any, commodity: string, minPrice: number, maxPrice: number, unit: string) {
  const stmt = db.prepare(`INSERT INTO commodity_prices (date, commodity, price, unit, is_simulated) VALUES (?, ?, ?, ?, 1)`);
  const startDate = new Date('2019-01-01');
  const endDate = new Date('2025-08-31');
  let price = (minPrice + maxPrice) / 2;
  const volatility = (maxPrice - minPrice) * 0.015;
  
  const insert = db.transaction(() => {
    let d = new Date(startDate);
    let count = 0;
    while (d <= endDate) {
      // Random walk with mean reversion
      const mean = (minPrice + maxPrice) / 2;
      const drift = (mean - price) * 0.005;
      const shock = (Math.random() - 0.5) * 2 * volatility;
      price = Math.max(minPrice * 0.9, Math.min(maxPrice * 1.1, price + drift + shock));
      
      // Add seasonal component
      const month = d.getMonth();
      const seasonal = Math.sin((month / 12) * 2 * Math.PI) * volatility * 3;
      const finalPrice = Math.round((price + seasonal) * 100) / 100;
      
      stmt.run(d.toISOString().split('T')[0], commodity, finalPrice, unit);
      count++;
      
      // Daily data (skip weekends)
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    }
    console.log(`[SEED] Generated ${count} simulated ${commodity} records`);
  });
  insert();
}

function seedFuelPrices(db: any) {
  // Derive VLSFO prices from Brent Crude data
  const brentData = db.prepare(`SELECT date, price FROM commodity_prices WHERE commodity = 'Brent Crude' ORDER BY date`).all();
  const stmt = db.prepare(`INSERT INTO fuel_prices (date, vlsfo_price, brent_price, is_simulated) VALUES (?, ?, ?, ?)`);
  
  const insert = db.transaction(() => {
    // Sample weekly to reduce volume
    for (let i = 0; i < brentData.length; i += 5) {
      const row = brentData[i] as any;
      // VLSFO ≈ Brent * 7.5–8.5 (barrel to MT conversion + premium)
      const vlsfo = Math.round(row.price * 8.0 * 100) / 100;
      stmt.run(row.date, vlsfo, row.price, 0);
    }
  });
  insert();
  console.log(`[SEED] Seeded fuel prices from Brent Crude data`);
}

function seedPortData(db: any) {
  const ports = [
    // Indian discharge ports
    { name: 'Paradip', country: 'India', region: 'East Coast', draught: 17.8, tidal: 0, berth: 'Mechanized Bulk Terminal', discharge: '35,000 T/day', lat: 20.316, lon: 86.611 },
    { name: 'Visakhapatnam', country: 'India', region: 'East Coast', draught: 17.1, tidal: 0, berth: 'Outer Harbour Berth', discharge: '30,000 T/day', lat: 17.686, lon: 83.298 },
    { name: 'Krishnapatnam', country: 'India', region: 'East Coast', draught: 18.5, tidal: 0, berth: 'Deep Water Bulk', discharge: '40,000 T/day', lat: 14.256, lon: 80.126 },
    { name: 'Kakinada', country: 'India', region: 'East Coast', draught: 10.5, tidal: 1, berth: 'Anchorage Deep', discharge: '15,000 T/day', lat: 16.938, lon: 82.238 },
    { name: 'Gangavaram', country: 'India', region: 'East Coast', draught: 21.0, tidal: 0, berth: 'Deep Water Cape', discharge: '45,000 T/day', lat: 17.619, lon: 83.236 },
    { name: 'Chennai', country: 'India', region: 'East Coast', draught: 17.4, tidal: 0, berth: 'Container + Bulk', discharge: '25,000 T/day', lat: 13.083, lon: 80.287 },
    { name: 'Ennore', country: 'India', region: 'East Coast', draught: 18.0, tidal: 0, berth: 'Kamarajar Terminal', discharge: '30,000 T/day', lat: 13.22, lon: 80.32 },
    // Loading ports
    { name: 'Port Hedland', country: 'Australia', region: 'Western Australia', draught: 18.2, tidal: 1, berth: 'BHP/FMG Berths', discharge: '80,000 T/day', lat: -20.311, lon: 118.573 },
    { name: 'Dampier', country: 'Australia', region: 'Western Australia', draught: 17.5, tidal: 1, berth: 'Rio Tinto Parker Point', discharge: '75,000 T/day', lat: -20.661, lon: 116.710 },
    { name: 'Kalimantan', country: 'Indonesia', region: 'Borneo', draught: 14.0, tidal: 1, berth: 'Coal Terminal', discharge: '25,000 T/day', lat: -1.241, lon: 116.856 },
    { name: 'Samarinda', country: 'Indonesia', region: 'East Kalimantan', draught: 11.0, tidal: 1, berth: 'River Anchorage', discharge: '15,000 T/day', lat: -0.495, lon: 117.149 },
    // Transit hub
    { name: 'Singapore', country: 'Singapore', region: 'Southeast Asia', draught: 23.0, tidal: 0, berth: 'Bunkering Hub', discharge: 'N/A', lat: 1.264, lon: 103.825 },
  ];
  
  const stmt = db.prepare(`INSERT OR IGNORE INTO port_data (port_name, country, region, max_draught, is_tidal, berth_type, discharge_rate, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insert = db.transaction(() => {
    for (const p of ports) {
      stmt.run(p.name, p.country, p.region, p.draught, p.tidal, p.berth, p.discharge, p.lat, p.lon);
    }
  });
  insert();
  console.log(`[SEED] Seeded ${ports.length} port records`);
}

function seedPortCongestion(db: any) {
  // Read actual congestion data for Singapore
  const data = readCSV('port_congestion.csv');
  const stmt = db.prepare(`INSERT INTO port_congestion (date, port_name, vessels_at_anchor, avg_wait_days, congestion_index, port_utilization, is_simulated) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  const insert = db.transaction(() => {
    let count = 0;
    for (const row of data) {
      if (!row.week_start || row.port !== 'Singapore') continue;
      stmt.run(row.week_start, 'Singapore', row.vessels_at_anchor, row.avg_wait_days, row.congestion_index, row.port_utilization_pct, 0);
      count++;
    }
    console.log(`[SEED] Seeded ${count} actual Singapore congestion records`);
  });
  insert();
  
  // Generate simulated congestion for Indian ports
  const indianPorts = ['Paradip', 'Visakhapatnam', 'Krishnapatnam', 'Kakinada', 'Gangavaram', 'Chennai', 'Ennore'];
  for (const port of indianPorts) {
    generateSimulatedCongestion(db, port);
  }
  // Generate for loading ports
  generateSimulatedCongestion(db, 'Port Hedland');
  generateSimulatedCongestion(db, 'Dampier');
  generateSimulatedCongestion(db, 'Kalimantan');
}

function generateSimulatedCongestion(db: any, portName: string) {
  const stmt = db.prepare(`INSERT INTO port_congestion (date, port_name, vessels_at_anchor, avg_wait_days, congestion_index, port_utilization, is_simulated) VALUES (?, ?, ?, ?, ?, ?, 1)`);
  const startDate = new Date('2019-01-07');
  const endDate = new Date('2025-08-25');
  
  const insert = db.transaction(() => {
    let d = new Date(startDate);
    let count = 0;
    let baseWait = 1.5 + Math.random() * 2;
    
    while (d <= endDate) {
      const month = d.getMonth();
      // Monsoon season (June-Sept) adds congestion for Indian ports
      const monsoonFactor = (month >= 5 && month <= 8) ? 1.4 : 1.0;
      const vessels = Math.floor(3 + Math.random() * 12 * monsoonFactor);
      const waitDays = Math.round((baseWait + (Math.random() - 0.5) * 1.5) * monsoonFactor * 10) / 10;
      const congestionIdx = Math.round((0.6 + Math.random() * 0.5) * monsoonFactor * 100) / 100;
      const utilization = Math.round((0.65 + Math.random() * 0.25) * 100) / 100;
      
      stmt.run(d.toISOString().split('T')[0], portName, vessels, Math.max(0.5, waitDays), Math.min(2.0, congestionIdx), utilization);
      count++;
      
      baseWait += (1.8 - baseWait) * 0.1 + (Math.random() - 0.5) * 0.3;
      d.setDate(d.getDate() + 7);
    }
    console.log(`[SEED] Generated ${count} simulated congestion records for ${portName}`);
  });
  insert();
}

function seedAlertRules(db: any) {
  const rules = [
    {
      name: 'Baltic C5 W. Australia → China Proxy Rate Limit',
      type: 'freight_rate', metric: 'c5_proxy_rate', condition: 'exceeds',
      threshold: 12.50, unit: 'USD/MT', corridor: 'Port Hedland → Paradip',
      channels: JSON.stringify(['Slack', 'Email']), active: 1
    },
    {
      name: 'Singapore VLSFO Bunker Buy Dip',
      type: 'bunker_fuel', metric: 'vlsfo_price', condition: 'drops_below',
      threshold: 595.00, unit: 'USD/MT', corridor: 'Singapore Hub',
      channels: JSON.stringify(['In-App', 'Email']), active: 1
    },
    {
      name: 'Sunda & Malacca Strait & Paradip Congestion Surge',
      type: 'port_congestion', metric: 'avg_wait_days', condition: 'exceeds',
      threshold: 3.5, unit: 'Days', corridor: 'Port Hedland → Paradip',
      channels: JSON.stringify(['SMS', 'PagerDuty']), active: 1
    },
    {
      name: 'Cyclone Season Bay of Bengal Weather & Swell Risk',
      type: 'weather', metric: 'wave_height', condition: 'exceeds',
      threshold: 4.0, unit: 'Meters', corridor: 'Bay of Bengal',
      channels: JSON.stringify(['SMS', 'Slack']), active: 1
    },
    {
      name: 'Iron Ore CFR Paradip Price Threshold Spike',
      type: 'commodity_price', metric: 'iron_ore_price', condition: 'rises_pct',
      threshold: 3.0, unit: '%', corridor: 'Paradip CFR',
      channels: JSON.stringify(['Desktop', 'Hedging API']), active: 0
    },
    {
      name: 'Krishnapatnam Anchorage Queue Threshold',
      type: 'port_congestion', metric: 'vessels_at_anchor', condition: 'exceeds',
      threshold: 8, unit: 'Vessels', corridor: 'Krishnapatnam',
      channels: JSON.stringify(['Email', 'Weekly Summary']), active: 0
    },
  ];
  
  const stmt = db.prepare(`INSERT INTO alert_rules (user_id, name, rule_type, metric, condition, threshold, unit, corridor, channels, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insert = db.transaction(() => {
    for (const r of rules) {
      stmt.run(null, r.name, r.type, r.metric, r.condition, r.threshold, r.unit, r.corridor, r.channels, r.active);
    }
  });
  insert();
  console.log(`[SEED] Seeded ${rules.length} alert rules`);
}
