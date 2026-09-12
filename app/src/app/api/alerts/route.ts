import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    const rules = db.prepare('SELECT * FROM alert_rules WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC').all(session.userId) as any[];
    
    // Parse channels JSON
    rules.forEach(r => {
      if (r.channels && typeof r.channels === 'string') {
        try { r.channels = JSON.parse(r.channels); } catch(e) {}
      }
    });

    const history = db.prepare(`
      SELECT h.*, r.name as rule_name, r.rule_type 
      FROM alert_history h
      JOIN alert_rules r ON h.rule_id = r.id
      WHERE r.user_id = ? OR r.user_id IS NULL
      ORDER BY h.created_at DESC LIMIT 50
    `).all(session.userId);

    return NextResponse.json({ rules, history });
  } catch (error: any) {
    console.error('Alerts API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const db = getDb();

    const res = db.prepare(`
      INSERT INTO alert_rules (user_id, name, rule_type, metric, condition, threshold, unit, corridor, channels, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.userId,
      body.name,
      body.ruleType,
      body.metric,
      body.condition,
      body.threshold,
      body.unit,
      body.corridor,
      JSON.stringify(body.channels || []),
      body.isActive === false ? 0 : 1
    );

    db.prepare('INSERT INTO audit_log (user_id, action_type, entity_type, entity_id) VALUES (?, ?, ?, ?)')
      .run(session.userId, 'CREATE_ALERT_RULE', 'alert_rules', res.lastInsertRowid);

    return NextResponse.json({ success: true, id: res.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const db = getDb();
    
    if (body.id && body.action === 'toggle') {
      db.prepare('UPDATE alert_rules SET is_active = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(body.isActive ? 1 : 0, body.id, session.userId);
      return NextResponse.json({ success: true });
    }

    if (body.id && body.action === 'update') {
      const result = db.prepare(`
        UPDATE alert_rules
        SET name = ?, rule_type = ?, metric = ?, condition = ?, threshold = ?, unit = ?, corridor = ?, channels = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL)
      `).run(
        body.name,
        body.ruleType,
        body.metric,
        body.condition,
        body.threshold,
        body.unit,
        body.corridor,
        JSON.stringify(body.channels || []),
        body.id,
        session.userId,
      );
      if (result.changes === 0) return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Alert rule id is required' }, { status: 400 });

    const db = getDb();
    const result = db.prepare(
      'DELETE FROM alert_rules WHERE id = ? AND (user_id = ? OR user_id IS NULL)'
    ).run(id, session.userId);
    if (result.changes === 0) return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
