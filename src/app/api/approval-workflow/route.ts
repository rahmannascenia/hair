import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const factoryId = searchParams.get('factoryId');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (factoryId) where.record = { factoryId };

    const [data, total] = await Promise.all([
      db.workerDailyEntry.findMany({
        where,
        include: {
          worker: { include: { factory: true } },
          record: { include: { factory: true, lot: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.workerDailyEntry.count({ where }),
    ]);

    // Status counts
    const statusCounts = await db.workerDailyEntry.groupBy({
      by: ['status'],
      _count: true,
    });
    const counts: Record<string, number> = {};
    for (const s of statusCounts) counts[s.status] = s._count;

    return NextResponse.json({
      data,
      counts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Approval workflow error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, performedBy } = body;
    if (!id || !action) return NextResponse.json({ error: 'ID and action required' }, { status: 400 });

    const statusMap: Record<string, string> = {
      'LL Review': 'LL Reviewed',
      'HL Review': 'HL Reviewed',
      'PM Approve': 'PM Approved',
      'Final Approve': 'Owner Approved',
      Reject: 'Rejected',
    };

    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const entry = await db.workerDailyEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    const updated = await db.workerDailyEntry.update({
      where: { id },
      data: { status: newStatus },
      include: { worker: true, record: true },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        entity: 'WorkerDailyEntry',
        entityId: id,
        action: 'UPDATE',
        oldValues: JSON.stringify({ status: entry.status }),
        newValues: JSON.stringify({ status: newStatus, action }),
        performedBy: performedBy ?? 'system',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Approval PATCH error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}