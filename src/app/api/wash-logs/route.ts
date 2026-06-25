import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'washing-log', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const lotId = searchParams.get('lotId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (lotId) where.lotId = lotId;
    if (status) where.status = status;

    const [washLogs, total] = await Promise.all([
      db.washLog.findMany({
        where,
        include: { lot: { include: { procurement: { include: { supplier: true } } } } },
        orderBy: { washDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.washLog.count({ where }),
    ]);

    return NextResponse.json({
      data: washLogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Wash logs list error:', error);
    return NextResponse.json({ error: 'Failed to fetch wash logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'washing-log', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const input = body.inputKg;
    const output = body.outputKg;
    const wastageKg = input - output;
    const wastagePct = input > 0 ? wastageKg / input : 0;
    const chemicalsBdt = Math.round(input * 12);
    const labourBdt = Math.round(input * 8);
    const costPerKgOut = output > 0 ? (chemicalsBdt + labourBdt) / output : 0;

    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const washTol = settings?.washTol ?? 0.15;
    const status = wastagePct > washTol ? 'INVESTIGATE' : 'OK';

    const washLog = await db.washLog.create({
      data: {
        washId: body.washId,
        lotId: body.lotId,
        washDate: new Date(body.washDate),
        operator: body.operator,
        inputKg: input,
        outputKg: output,
        wastageKg,
        wastagePct,
        chemicalsBdt,
        labourBdt,
        costPerKgOut,
        status,
      },
      include: { lot: true },
    });

    await db.lot.update({
      where: { id: body.lotId },
      data: { washStatus: 'Done' },
    });

    await writeAuditLog({
      entity: 'WashLog',
      entityId: washLog.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(washLog, { status: 201 });
  } catch (error) {
    console.error('Wash log create error:', error);
    return NextResponse.json({ error: 'Failed to create wash log' }, { status: 500 });
  }
}