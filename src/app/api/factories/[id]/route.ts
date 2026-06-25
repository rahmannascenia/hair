import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'factory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const factory = await db.factory.findUnique({
      where: { id },
      include: {
        lineLeader: {
          include: { headLeader: true },
        },
        workers: {
          orderBy: { name: 'asc' },
        },
        dailyRecords: {
          include: {
            lot: true,
            entries: { include: { worker: true } },
          },
          orderBy: { recordDate: 'desc' },
        },
      },
    });

    if (!factory) {
      return NextResponse.json({ error: 'Factory not found' }, { status: 404 });
    }

    return NextResponse.json(factory);
  } catch (error) {
    console.error('Factory detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch factory' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'factory', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldFactory = await db.factory.findUnique({ where: { id } });
    const oldPlain = oldFactory ? JSON.parse(JSON.stringify(oldFactory)) : {};

    const factory = await db.factory.update({
      where: { id },
      data: {
        factoryId: body.factoryId,
        name: body.name,
        supervisorName: body.supervisorName,
        supervisorBkash: body.supervisorBkash,
        location: body.location,
        lineLeaderId: body.lineLeaderId,
        groupHead: body.groupHead,
        fuelBdt: body.fuelBdt,
        transportBdt: body.transportBdt,
        isActive: body.isActive,
      },
      include: {
        lineLeader: { include: { headLeader: true } },
        workers: true,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Factory',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(factory);
  } catch (error) {
    console.error('Factory update error:', error);
    return NextResponse.json({ error: 'Failed to update factory' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'factory', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const [workerCount, recordCount] = await Promise.all([
      db.worker.count({ where: { factoryId: id } }),
      db.factoryDailyRecord.count({ where: { factoryId: id } }),
    ]);

    if (workerCount > 0 || recordCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete factory with existing workers or daily records' },
        { status: 400 }
      );
    }

    const oldFactory = await db.factory.findUnique({ where: { id } });

    await db.factory.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Factory',
      entityId: id,
      action: 'DELETE',
      oldValues: oldFactory ? JSON.parse(JSON.stringify(oldFactory)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Factory deleted' });
  } catch (error) {
    console.error('Factory delete error:', error);
    return NextResponse.json({ error: 'Failed to delete factory' }, { status: 500 });
  }
}