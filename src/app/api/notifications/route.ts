import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/audit';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  section?: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Lot Wash Completed',
    message: 'Lot LOT-2024-001 washing completed with 12.3% wastage.',
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    section: 'washing-log',
  },
  {
    id: '2',
    title: 'Low Inventory Alert',
    message: 'Raw Hair stock is below 50kg threshold.',
    time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
    section: 'inventory',
  },
  {
    id: '3',
    title: 'New Procurement Received',
    message: 'Procurement PR-2024-045 received from supplier.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    section: 'procurement',
  },
  {
    id: '4',
    title: 'QC Grade Dispute',
    message: 'Grade dispute filed for Lot LOT-2024-003.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    section: 'grade-dispute',
  },
  {
    id: '5',
    title: 'Payroll Processed',
    message: 'Monthly payroll for January has been processed.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
    section: 'payroll',
  },
];

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'dashboard', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }
  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'dashboard', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
    }
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}