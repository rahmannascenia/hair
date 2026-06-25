import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'procurement', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const procurement = await db.procurement.findUnique({
      where: { id },
      include: {
        supplier: true,
        lots: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!procurement) {
      return NextResponse.json({ error: 'Procurement not found' }, { status: 404 });
    }

    return NextResponse.json(procurement);
  } catch (error) {
    console.error('Procurement detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch procurement' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'procurement', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldProcurement = await db.procurement.findUnique({ where: { id } });
    const oldPlain = oldProcurement ? JSON.parse(JSON.stringify(oldProcurement)) : {};

    const procurement = await db.procurement.update({
      where: { id },
      data: {
        voucherNo: body.voucherNo,
        date: body.date ? new Date(body.date) : undefined,
        supplierId: body.supplierId,
        originCountry: body.originCountry,
        rawWeightKg: body.rawWeightKg,
        usdPerKg: body.usdPerKg,
        costPerKgBdt: body.costPerKgBdt,
        goodsUsd: body.goodsUsd,
        freightUsd: body.freightUsd,
        dutyUsd: body.dutyUsd,
        bankChargesUsd: body.bankChargesUsd,
        landedUsd: body.landedUsd,
        totalLandedCostBdt: body.totalLandedCostBdt,
        landedCostPerKgBdt: body.landedCostPerKgBdt,
        lcNo: body.lcNo,
        paymentMode: body.paymentMode,
        qualityGrade: body.qualityGrade,
        fxRate: body.fxRate,
        status: body.status,
        notes: body.notes,
      },
      include: { supplier: true, lots: true },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Procurement',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(procurement);
  } catch (error) {
    console.error('Procurement update error:', error);
    return NextResponse.json({ error: 'Failed to update procurement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'procurement', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    // Check if procurement has related lots
    const lotsCount = await db.lot.count({ where: { procurementId: id } });
    if (lotsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete procurement with existing lots' },
        { status: 400 }
      );
    }

    const oldProcurement = await db.procurement.findUnique({ where: { id } });

    await db.procurement.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Procurement',
      entityId: id,
      action: 'DELETE',
      oldValues: oldProcurement ? JSON.parse(JSON.stringify(oldProcurement)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Procurement deleted' });
  } catch (error) {
    console.error('Procurement delete error:', error);
    return NextResponse.json({ error: 'Failed to delete procurement' }, { status: 500 });
  }
}