import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const headLeaderId = searchParams.get('headLeaderId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (headLeaderId) where.headLeaderId = headLeaderId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
      ];
    }

    const lineLeaders = await db.lineLeader.findMany({
      where,
      include: {
        headLeader: true,
        _count: {
          select: { factories: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: lineLeaders });
  } catch (error) {
    console.error('Line leaders list error:', error);
    return NextResponse.json({ error: 'Failed to fetch line leaders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'organization', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    if (!body.name || !body.headLeaderId) {
      return NextResponse.json(
        { error: 'Name and headLeaderId are required' },
        { status: 400 }
      );
    }

    const lineLeader = await db.lineLeader.create({
      data: {
        name: body.name,
        phone: body.phone,
        bKash: body.bKash,
        headLeaderId: body.headLeaderId,
        isActive: body.isActive ?? true,
      },
      include: {
        headLeader: true,
        _count: {
          select: { factories: true },
        },
      },
    });

    await writeAuditLog({
      entity: 'LineLeader',
      entityId: lineLeader.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(lineLeader, { status: 201 });
  } catch (error) {
    console.error('Line leader create error:', error);
    return NextResponse.json({ error: 'Failed to create line leader' }, { status: 500 });
  }
}