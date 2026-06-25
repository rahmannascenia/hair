import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'sales', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const sale = await db.sale.findUnique({
      where: { id },
      include: { buyer: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Sale detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'sales', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const oldSale = await db.sale.findUnique({ where: { id } });
    const oldPlain = oldSale ? JSON.parse(JSON.stringify(oldSale)) : {};

    const sale = await db.sale.update({
      where: { id },
      data: {
        contractNo: body.contractNo,
        contractDate: body.contractDate ? new Date(body.contractDate) : undefined,
        buyerId: body.buyerId,
        productSpec: body.productSpec,
        lengthInch: body.lengthInch,
        qtyKg: body.qtyKg,
        usdPerKg: body.usdPerKg,
        usdValue: body.usdValue,
        bdtValue: body.bdtValue,
        costPerKgBdt: body.costPerKgBdt,
        totalCostBdt: body.totalCostBdt,
        marginPerKgBdt: body.marginPerKgBdt,
        totalMarginBdt: body.totalMarginBdt,
        marginPct: body.marginPct,
        status: body.status,
      },
      include: { buyer: true },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Sale',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Sale update error:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'sales', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);

    const oldSale = await db.sale.findUnique({ where: { id } });

    await db.sale.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Sale',
      entityId: id,
      action: 'DELETE',
      oldValues: oldSale ? JSON.parse(JSON.stringify(oldSale)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ message: 'Sale deleted' });
  } catch (error) {
    console.error('Sale delete error:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}