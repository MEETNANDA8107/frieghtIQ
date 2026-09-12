import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, password, fullName, companyName, 
      role, businessModel, deskSize, annualVolume,
      commodities, corridors, vesselClasses, benchmarkIndex, settlementCurrency,
      notifications
    } = body;

    const db = getDb();
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    let userId;
    const insert = db.transaction(() => {
      // Create user
      const userResult = db.prepare('INSERT INTO users (email, password_hash, full_name, company_name) VALUES (?, ?, ?, ?)').run(
        email, passwordHash, fullName, companyName
      );
      userId = userResult.lastInsertRowid;

      // Create company profile
      db.prepare(`
        INSERT INTO company_profiles 
        (user_id, role, business_model, desk_size, annual_volume, commodities, vessel_classes, benchmark_index, settlement_currency, notifications_config) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, role, businessModel, deskSize, annualVolume, 
        JSON.stringify(commodities || []), 
        JSON.stringify(vesselClasses || []), 
        benchmarkIndex || 'Baltic C5 Proxy', 
        settlementCurrency || 'USD', 
        JSON.stringify(notifications || {})
      );

      // Create monitored routes
      if (corridors && Array.isArray(corridors)) {
        const routeStmt = db.prepare(`
          INSERT INTO routes (user_id, origin_port, origin_country, destination_port, destination_country, commodity)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const c of corridors) {
          routeStmt.run(userId, c.originPort, c.originCountry, c.destPort, c.destCountry, c.commodity);
        }
      }
    });

    insert();

    // Create session token
    const token = signToken({ userId, email, role });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('freightiq_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
