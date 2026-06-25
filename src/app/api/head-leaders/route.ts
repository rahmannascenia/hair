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
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { region: { contains: search } },
      ];
    }

    const headLeaders = await db.headLeader.findMany({
      where,
      include: {
        _count: {
          select: { lineLeaders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: headLeaders });
  } catch (error) {
    console.error('Head leaders list error:', error);
    return NextResponse.json({ error: 'Failed to fetch head leaders' }, { status: 500 });
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

    if (!body.name || !body.region) {
      return NextResponse.json(
        { error: 'Name and region are required' },
        { status: 400 }
      );
    }

    const headLeader = await db.headLeader.create({
      data: {
        name: body.name,
        phone: body.phone,
        region: body.region,
        isActive: body.isActive ?? true,
      },
      include: {
        _count: {
          select: { lineLeaders: true },
        },
      },
    });

    await writeAuditLog({
      entity: 'HeadLeader',
      entityId: headLeader.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(headLeader, { status: 201 });
  } catch (error) {
    console.error('Head leader create error:', error);
    return NextResponse.json({ error: 'Failed to create head leader' }, { status: 500 });
  }
}