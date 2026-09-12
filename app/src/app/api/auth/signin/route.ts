import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const db = getDb();
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Get role from profile
    const profile = db.prepare('SELECT role FROM company_profiles WHERE user_id = ?').get(user.id) as any;
    const role = profile?.role || 'user';

    // Create session token
    const token = signToken({ userId: user.id, email: user.email, role });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('freightiq_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, fullName: user.full_name } 
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
