import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Fetch user details and profile
    const userRow = db.prepare(`
      SELECT u.full_name, u.email, u.company_name, p.role, p.business_model
      FROM users u
      LEFT JOIN company_profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(session.userId) as any;

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      fullName: userRow.full_name || '',
      email: userRow.email || '',
      role: userRow.role || '',
      company: userRow.company_name || '',
      phone: '+91 98765 43210', // Placeholder as it's not in schema
      timezone: 'Asia/Kolkata', // Placeholder as it's not in schema
    });
  } catch (error: any) {
    console.error('Settings API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
