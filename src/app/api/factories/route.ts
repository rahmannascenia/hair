import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'factory', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const lineLeaderId = searchParams.get('lineLeaderId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (lineLeaderId) where.lineLeaderId = lineLeaderId;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { factoryId: { contains: search } },
        { name: { contains: search } },
        { supervisorName: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [factories, total] = await Promise.all([
      db.factory.findMany({
        where,
        include: {
          lineLeader: {
            include: { headLeader: true },
          },
          workers: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { dailyRecords: true },
          },
        },
        orderBy: { factoryId: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.factory.count({ where }),
    ]);

    return NextResponse.json({
      data: factories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Factories list error:', error);
    return NextResponse.json({ error: 'Failed to fetch factories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'factory', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const factory = await db.factory.create({
      data: {
        factoryId: body.factoryId,
        name: body.name,
        supervisorName: body.supervisorName,
        supervisorBkash: body.supervisorBkash,
        location: body.location,
        lineLeaderId: body.lineLeaderId,
        groupHead: body.groupHead,
        fuelBdt: body.fuelBdt ?? 200,
        transportBdt: body.transportBdt ?? 150,
        isActive: body.isActive ?? true,
      },
      include: {
        lineLeader: { include: { headLeader: true } },
        workers: true,
      },
    });

    await writeAuditLog({
      entity: 'Factory',
      entityId: factory.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    console.error('Factory create error:', error);
    return NextResponse.json({ error: 'Failed to create factory' }, { status: 500 });
  }
}