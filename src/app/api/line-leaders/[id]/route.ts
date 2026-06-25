import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const lineLeader = await db.lineLeader.findUnique({
      where: { id },
      include: {
        headLeader: true,
        factories: {
          orderBy: { factoryId: 'asc' },
        },
      },
    });

    if (!lineLeader) {
      return NextResponse.json({ error: 'Line leader not found' }, { status: 404 });
    }

    return NextResponse.json(lineLeader);
  } catch (error) {
    console.error('Line leader detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch line leader' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldLL = await db.lineLeader.findUnique({ where: { id } });
    const oldPlain = oldLL ? JSON.parse(JSON.stringify(oldLL)) : {};

    const lineLeader = await db.lineLeader.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        bKash: body.bKash,
        headLeaderId: body.headLeaderId,
        isActive: body.isActive,
      },
      include: {
        headLeader: true,
        _count: {
          select: { factories: true },
        },
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'LineLeader',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(lineLeader);
  } catch (error) {
    console.error('Line leader update error:', error);
    return NextResponse.json({ error: 'Failed to update line leader' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const factoryCount = await db.factory.count({
      where: { lineLeaderId: id },
    });

    if (factoryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete line leader: has associated factories' },
        { status: 400 }
      );
    }

    const oldLL = await db.lineLeader.findUnique({ where: { id } });

    await db.lineLeader.delete({ where: { id } });

    await writeAuditLog({
      entity: 'LineLeader',
      entityId: id,
      action: 'DELETE',
      oldValues: oldLL ? JSON.parse(JSON.stringify(oldLL)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Line leader deleted' });
  } catch (error) {
    console.error('Line leader delete error:', error);
    return NextResponse.json({ error: 'Failed to delete line leader' }, { status: 500 });
  }
}