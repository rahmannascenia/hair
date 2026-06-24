import { NextRequest, NextResponse } from 'next/server';

const USERS: Record<string, { password: string; role: string; displayName: string }> = {
  owner:      { password: 'owner123',  role: 'Owner',      displayName: 'Owner' },
  admin:      { password: 'admin123',  role: 'Admin',      displayName: 'Administrator' },
  pm:         { password: 'pm123',     role: 'Project Manager', displayName: 'Project Manager' },
  accountant: { password: 'acc123',    role: 'Accountant',  displayName: 'Accountant' },
  head1:      { password: 'head123',   role: 'Head Leader',  displayName: 'Head Leader 1' },
  supervisor1:{ password: 'sup123',    role: 'Supervisor',   displayName: 'Supervisor 1' },
  ll1:        { password: 'll123',     role: 'Line Leader',  displayName: 'Line Leader 1' },
  qc1:        { password: 'qc123',     role: 'QC Inspector', displayName: 'QC Inspector 1' },
  viewer:     { password: 'viewer123', role: 'Viewer',      displayName: 'Viewer' },
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

    return NextResponse.json({
      user: {
        username,
        role: user.role,
        displayName: user.displayName,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}