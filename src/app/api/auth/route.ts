import { NextRequest, NextResponse } from 'next/server';

// Role mapping: username → { password, roleKey (for permissions), role (display), displayName }
const USERS: Record<string, { password: string; roleKey: string; role: string; displayName: string }> = {
  owner:       { password: 'owner123',  roleKey: 'owner',       role: 'Owner',           displayName: 'Owner' },
  admin:       { password: 'admin123',  roleKey: 'admin',       role: 'Admin',           displayName: 'Administrator' },
  pm:          { password: 'pm123',     roleKey: 'pm',          role: 'Project Manager', displayName: 'Project Manager' },
  accountant:  { password: 'acc123',    roleKey: 'accountant',  role: 'Accountant',      displayName: 'Accountant' },
  head1:       { password: 'head123',   roleKey: 'head1',       role: 'Head Leader',     displayName: 'Head Leader 1' },
  supervisor1: { password: 'sup123',    roleKey: 'supervisor1', role: 'Supervisor',      displayName: 'Supervisor 1' },
  ll1:         { password: 'll123',     roleKey: 'll1',         role: 'Line Leader',     displayName: 'Line Leader 1' },
  qc1:         { password: 'qc123',     roleKey: 'qc1',         role: 'QC Inspector',    displayName: 'QC Inspector 1' },
  viewer:      { password: 'viewer123', roleKey: 'viewer',      role: 'Viewer',          displayName: 'Viewer' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = USERS[username];
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Audit log the login
    try {
      const { db } = await import('@/lib/db');
      await db.auditLog.create({
        data: {
          entity: 'Auth',
          action: 'CREATE',
          newValues: JSON.stringify({ event: 'LOGIN', username, roleKey: user.roleKey }),
          performedBy: username,
        },
      });
    } catch { /* audit failure shouldn't block login */ }

    return NextResponse.json({
      user: {
        username,
        roleKey: user.roleKey,
        role: user.role,
        displayName: user.displayName,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}