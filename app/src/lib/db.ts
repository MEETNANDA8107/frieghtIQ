import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), '..', 'freightiq.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database) {
  // Add vessels and savings_json columns if they don't exist
  try { db.exec(`ALTER TABLE forecasts ADD COLUMN vessels TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE forecasts ADD COLUMN savings_json TEXT`); } catch (_) {}
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      company_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT DEFAULT 'procurement_lead',
      business_model TEXT DEFAULT 'dry_bulk_importer',
      desk_size TEXT DEFAULT 'boutique',
      annual_volume TEXT DEFAULT '500000-2500000',
      commodities TEXT DEFAULT '[]',
      vessel_classes TEXT DEFAULT '[]',
      benchmark_index TEXT DEFAULT 'Baltic C5 Proxy',
      settlement_currency TEXT DEFAULT 'USD',
      notifications_config TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      origin_port TEXT NOT NULL,
      origin_country TEXT NOT NULL,
      origin_code TEXT,
      destination_port TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      destination_code TEXT,
      commodity TEXT NOT NULL,
      vessel_class TEXT DEFAULT 'Capesize',
      distance_nm REAL,
      avg_transit_days REAL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS freight_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      baltic_dry_index REAL,
      c5_proxy_rate REAL,
      capesize_rate REAL,
      panamax_rate REAL,
      handysize_rate REAL,
      container_rate REAL,
      is_simulated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commodity_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      commodity TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'USD/MT',
      is_simulated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fuel_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      vlsfo_price REAL,
      brent_price REAL,
      is_simulated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS port_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      port_name TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT,
      max_draught REAL,
      is_tidal INTEGER DEFAULT 0,
      berth_type TEXT,
      discharge_rate TEXT,
      lat REAL,
      lon REAL
    );

    CREATE TABLE IF NOT EXISTS port_congestion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      port_name TEXT NOT NULL,
      vessels_at_anchor INTEGER,
      avg_wait_days REAL,
      congestion_index REAL,
      port_utilization REAL,
      is_simulated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      route_id INTEGER REFERENCES routes(id),
      commodity TEXT NOT NULL,
      origin_port TEXT NOT NULL,
      destination_port TEXT NOT NULL,
      vessel_class TEXT NOT NULL,
      cargo_volume REAL NOT NULL,
      laycan_start TEXT,
      laycan_end TEXT,
      freight_rate_forecast TEXT,
      commodity_price_forecast TEXT,
      fuel_price_forecast TEXT,
      landed_cost_breakdown TEXT,
      total_landed_cost REAL,
      recommendation TEXT,
      confidence REAL,
      risk_level TEXT,
      model_version TEXT DEFAULT 'v4.8',
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      metric TEXT NOT NULL,
      condition TEXT NOT NULL,
      threshold REAL NOT NULL,
      unit TEXT,
      corridor TEXT,
      channels TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      cooldown_minutes INTEGER DEFAULT 15,
      last_triggered DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER REFERENCES alert_rules(id),
      rule_name TEXT,
      observed_value REAL,
      threshold_value REAL,
      status TEXT DEFAULT 'fired',
      channels_dispatched TEXT,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_type TEXT NOT NULL,
      data_key TEXT NOT NULL,
      data_value TEXT NOT NULL,
      source TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
