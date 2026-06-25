import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest, getChangedFields } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'size-pricing', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const sizePricing = await db.sizePricing.findMany({
      orderBy: { lengthInch: 'asc' },
    });

    const buyerPricing = await db.buyerPricing.findMany({
      include: { buyer: true },
      orderBy: [{ buyerId: 'asc' }, { lengthInch: 'asc' }],
    });

    return NextResponse.json({
      sizePricing,
      buyerPricing,
    });
  } catch (error) {
    console.error('Size pricing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch size pricing' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'size-pricing', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    // Handle buyer pricing creation
    if (body.type === 'buyer-pricing') {
      const { buyerId, lengthInch, premiumPct } = body;

      // Upsert: delete existing and create new
      await db.buyerPricing.deleteMany({
        where: { buyerId, lengthInch },
      });

      const pricing = await db.buyerPricing.create({
        data: { buyerId, lengthInch, premiumPct },
        include: { buyer: true },
      });

      await writeAuditLog({
        entity: 'BuyerPricing',
        entityId: pricing.id,
        action: 'CREATE',
        newValues: body,
        performedBy: actor,
      });

      return NextResponse.json(pricing, { status: 201 });
    }

    // Handle base size pricing creation
    const pricing = await db.sizePricing.create({
      data: {
        lengthInch: body.lengthInch,
        bdtPerKg: body.bdtPerKg,
        usdPerKg: body.usdPerKg,
        marketSegment: body.marketSegment,
        minMarginBdt: body.minMarginBdt ?? 0,
        minMarginPct: body.minMarginPct ?? 0,
      },
    });

    await writeAuditLog({
      entity: 'SizePricing',
      entityId: String(pricing.lengthInch),
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(pricing, { status: 201 });
  } catch (error) {
    console.error('Size pricing POST error:', error);
    return NextResponse.json({ error: 'Failed to create size pricing' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'size-pricing', 'edit');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    // Handle buyer pricing update
    if (body.type === 'buyer-pricing') {
      const { id, premiumPct } = body;

      const oldPricing = await db.buyerPricing.findUnique({ where: { id } });
      const oldPlain = oldPricing ? JSON.parse(JSON.stringify(oldPricing)) : {};

      const pricing = await db.buyerPricing.update({
        where: { id },
        data: { premiumPct },
        include: { buyer: true },
      });

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
    }

    // Handle base size pricing update (by lengthInch since it's unique)
    const { lengthInch, ...updateData } = body;

    const oldPricing = await db.sizePricing.findUnique({ where: { lengthInch } });
    const oldPlain = oldPricing ? JSON.parse(JSON.stringify(oldPricing)) : {};

    const pricing = await db.sizePricing.update({
      where: { lengthInch },
      data: updateData,
    });

    const { oldValues, newValues } = getChangedFields(oldPlain, body);
    await writeAuditLog({
      entity: 'SizePricing',
      entityId: String(lengthInch),
      action: 'UPDATE',
      oldValues,
      newValues,
      performedBy: actor,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Size pricing PUT error:', error);
    return NextResponse.json({ error: 'Failed to update size pricing' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'size-pricing', 'delete');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const actor = getActorFromRequest(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const lengthInch = searchParams.get('lengthInch');

    if (type === 'buyer-pricing' && id) {
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
    }

    if (lengthInch) {
      const oldPricing = await db.sizePricing.findUnique({ where: { lengthInch: parseInt(lengthInch) } });
      await db.sizePricing.delete({ where: { lengthInch: parseInt(lengthInch) } });
      await writeAuditLog({
        entity: 'SizePricing',
        entityId: lengthInch,
        action: 'DELETE',
        oldValues: oldPricing ? JSON.parse(JSON.stringify(oldPricing)) : undefined,
        performedBy: actor,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Provide id or lengthInch' }, { status: 400 });
  } catch (error) {
    console.error('Size pricing DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete size pricing' }, { status: 500 });
  }
}