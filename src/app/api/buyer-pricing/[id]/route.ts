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
    const pricing = await db.buyerPricing.findUnique({
      where: { id },
      include: { buyer: true },
    });

    if (!pricing) {
      return NextResponse.json({ error: 'Buyer pricing not found' }, { status: 404 });
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Buyer pricing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch buyer pricing' }, { status: 500 });
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

    const oldPricing = await db.buyerPricing.findUnique({ where: { id } });
    const oldPlain = oldPricing ? JSON.parse(JSON.stringify(oldPricing)) : {};

    const pricing = await db.buyerPricing.update({
      where: { id },
      data: {
        premiumPct: body.premiumPct,
        lengthInch: body.lengthInch,
        buyerId: body.buyerId,
      },
      include: { buyer: true },
    });

    const { getChangedFields } = await import('@/lib/audit');
    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'BuyerPricing',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Buyer pricing PUT error:', error);
    return NextResponse.json({ error: 'Failed to update buyer pricing' }, { status: 500 });
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

    const oldPricing = await db.buyerPricing.findUnique({ where: { id } });

    await db.buyerPricing.delete({ where: { id } });

    await writeAuditLog({
      entity: 'BuyerPricing',
      entityId: id,
      action: 'DELETE',
      oldValues: oldPricing ? JSON.parse(JSON.stringify(oldPricing)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Buyer pricing DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete buyer pricing' }, { status: 500 });
  }
}