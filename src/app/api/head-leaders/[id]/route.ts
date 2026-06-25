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
    const headLeader = await db.headLeader.findUnique({
      where: { id },
      include: {
        lineLeaders: {
          include: {
            _count: {
              select: { factories: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!headLeader) {
      return NextResponse.json({ error: 'Head leader not found' }, { status: 404 });
    }

    return NextResponse.json(headLeader);
  } catch (error) {
    console.error('Head leader detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch head leader' }, { status: 500 });
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

    const oldHL = await db.headLeader.findUnique({ where: { id } });
    const oldPlain = oldHL ? JSON.parse(JSON.stringify(oldHL)) : {};

    const headLeader = await db.headLeader.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        region: body.region,
        isActive: body.isActive,
      },
      include: {
        _count: {
          select: { lineLeaders: true },
        },
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'HeadLeader',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(headLeader);
  } catch (error) {
    console.error('Head leader update error:', error);
    return NextResponse.json({ error: 'Failed to update head leader' }, { status: 500 });
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

    // Check if any line leaders under this head leader have factories
    const lineLeadersWithFactories = await db.lineLeader.count({
      where: {
        headLeaderId: id,
        factories: { some: {} },
      },
    });

    if (lineLeadersWithFactories > 0) {
      return NextResponse.json(
        { error: 'Cannot delete head leader: one or more line leaders have factories' },
        { status: 400 }
      );
    }

    const oldHL = await db.headLeader.findUnique({ where: { id } });

    await db.headLeader.delete({ where: { id } });

    await writeAuditLog({
      entity: 'HeadLeader',
      entityId: id,
      action: 'DELETE',
      oldValues: oldHL ? JSON.parse(JSON.stringify(oldHL)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Head leader deleted' });
  } catch (error) {
    console.error('Head leader delete error:', error);
    return NextResponse.json({ error: 'Failed to delete head leader' }, { status: 500 });
  }
}