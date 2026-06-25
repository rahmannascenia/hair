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
    const buyer = await db.buyer.findUnique({
      where: { id },
      include: {
        sales: { orderBy: { contractDate: 'desc' } },
        pricings: { orderBy: { lengthInch: 'asc' } },
      },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    return NextResponse.json(buyer);
  } catch (error) {
    console.error('Buyer GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch buyer' }, { status: 500 });
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

    const oldBuyer = await db.buyer.findUnique({ where: { id } });
    const oldPlain = oldBuyer ? JSON.parse(JSON.stringify(oldBuyer)) : {};

    const buyer = await db.buyer.update({
      where: { id },
      data: {
        name: body.name,
        country: body.country,
        isActive: body.isActive ?? true,
      },
      include: {
        sales: true,
        pricings: true,
      },
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'Buyer',
      entityId: id,
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(buyer);
  } catch (error) {
    console.error('Buyer PUT error:', error);
    return NextResponse.json({ error: 'Failed to update buyer' }, { status: 500 });
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

    const saleCount = await db.sale.count({ where: { buyerId: id } });
    if (saleCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete buyer with ${saleCount} sales contracts. Delete sales first.` },
        { status: 400 }
      );
    }

    const oldBuyer = await db.buyer.findUnique({ where: { id } });

    await db.buyerPricing.deleteMany({ where: { buyerId: id } });
    await db.buyer.delete({ where: { id } });

    await writeAuditLog({
      entity: 'Buyer',
      entityId: id,
      action: 'DELETE',
      oldValues: oldBuyer ? JSON.parse(JSON.stringify(oldBuyer)) : undefined,
      performedBy: actor,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Buyer DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete buyer' }, { status: 500 });
  }
}