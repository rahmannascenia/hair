import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'dashboard', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'dashboard', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
    }

    const oldNotification = await db.notification.findUnique({ where: { id } });
    if (!oldNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    await writeAuditLog({
      entity: 'Notification',
      entityId: id,
      action: 'UPDATE',
      oldValues: { isRead: false },
      newValues: { isRead: true },
      performedBy: actor,
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Notification POST error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
