import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'lot-master', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const status = searchParams.get('status');
    const washStatus = searchParams.get('washStatus');
    const colour = searchParams.get('colour');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (washStatus) where.washStatus = washStatus;
    if (colour) where.colour = colour;
    if (search) {
      where.OR = [
        { lotNo: { contains: search } },
        { colour: { contains: search } },
      ];
    }

    const [lots, total] = await Promise.all([
      db.lot.findMany({
        where,
        include: {
          procurement: { include: { supplier: true } },
          washLogs: { orderBy: { washDate: 'desc' } },
          distributions: { orderBy: { date: 'desc' } },
          _count: {
            select: {
              factoryRecords: true,
              phase2Jobs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lot.count({ where }),
    ]);

    return NextResponse.json({
      data: lots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Lots list error:', error);
    return NextResponse.json({ error: 'Failed to fetch lots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'lot-master', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const lot = await db.lot.create({
      data: {
        lotNo: body.lotNo,
        procurementId: body.procurementId,
        colour: body.colour,
        rawWeightKg: body.rawWeightKg,
        landedCostPerKg: body.landedCostPerKg,
        totalLandedCost: body.totalLandedCost,
        washStatus: body.washStatus ?? 'Pending',
        status: body.status ?? 'Active',
      },
    });

    await writeAuditLog({
      entity: 'Lot',
      entityId: lot.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(lot, { status: 201 });
  } catch (error) {
    console.error('Lot create error:', error);
    return NextResponse.json({ error: 'Failed to create lot' }, { status: 500 });
  }
}