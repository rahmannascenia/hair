import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'procurement', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const search = searchParams.get('search');
    const isImport = searchParams.get('isImport');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (isImport === 'true') where.lcNo = { not: null };
    if (isImport === 'false') where.lcNo = null;
    if (search) {
      where.OR = [
        { voucherNo: { contains: search } },
        { lcNo: { contains: search } },
        { originCountry: { contains: search } },
      ];
    }

    const [procurements, total] = await Promise.all([
      db.procurement.findMany({
        where,
        include: {
          supplier: true,
          lots: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.procurement.count({ where }),
    ]);

    return NextResponse.json({
      data: procurements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Procurement list error:', error);
    return NextResponse.json({ error: 'Failed to fetch procurements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'procurement', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);
    const fxRate = body.fxRate ?? 120.0;
    const isImport = !!body.lcNo;

    let goodsUsd = body.goodsUsd ?? 0;
    let freightUsd = body.freightUsd ?? 0;
    let dutyUsd = body.dutyUsd ?? 0;
    let bankChargesUsd = body.bankChargesUsd ?? 0;
    let landedUsd = body.landedUsd ?? 0;
    let totalLandedCostBdt = body.totalLandedCostBdt ?? 0;
    let landedCostPerKgBdt = body.landedCostPerKgBdt ?? 0;
    let costPerKgBdt = body.costPerKgBdt ?? 0;

    if (isImport && body.usdPerKg && body.rawWeightKg) {
      goodsUsd = body.rawWeightKg * body.usdPerKg;
      freightUsd = Math.round(goodsUsd * 0.03 * 100) / 100;
      dutyUsd = Math.round(goodsUsd * 0.12 * 100) / 100;
      bankChargesUsd = Math.round(goodsUsd * 0.01 * 100) / 100;
      landedUsd = goodsUsd + freightUsd + dutyUsd + bankChargesUsd;
      totalLandedCostBdt = landedUsd * fxRate;
      landedCostPerKgBdt = totalLandedCostBdt / body.rawWeightKg;
      costPerKgBdt = landedCostPerKgBdt;
    } else if (!isImport) {
      totalLandedCostBdt = body.rawWeightKg * body.costPerKgBdt;
      costPerKgBdt = body.costPerKgBdt;
    }

    const procurement = await db.procurement.create({
      data: {
        voucherNo: body.voucherNo,
        date: new Date(body.date),
        supplierId: body.supplierId,
        originCountry: body.originCountry,
        rawWeightKg: body.rawWeightKg,
        usdPerKg: body.usdPerKg ?? 0,
        costPerKgBdt,
        goodsUsd,
        freightUsd,
        dutyUsd,
        bankChargesUsd,
        landedUsd,
        totalLandedCostBdt,
        landedCostPerKgBdt,
        lcNo: body.lcNo,
        paymentMode: body.paymentMode,
        qualityGrade: body.qualityGrade,
        fxRate,
        status: body.status ?? 'Received',
        notes: body.notes,
      },
      include: { supplier: true },
    });

    await writeAuditLog({
      entity: 'Procurement',
      entityId: procurement.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(procurement, { status: 201 });
  } catch (error) {
    console.error('Procurement create error:', error);
    return NextResponse.json({ error: 'Failed to create procurement' }, { status: 500 });
  }
}