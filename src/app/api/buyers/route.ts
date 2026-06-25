import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkPermission, writeAuditLog, getActorFromRequest } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'sales', 'view');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
      ];
    }

    const buyers = await db.buyer.findMany({
      where,
      include: {
        sales: {
          orderBy: { contractDate: 'desc' },
        },
        pricings: {
          orderBy: { lengthInch: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: buyers });
  } catch (error) {
    console.error('Buyers list error:', error);
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-erp-role') || '';
  const perm = checkPermission(role, 'sales', 'create');
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const actor = getActorFromRequest(request);

    const buyer = await db.buyer.create({
      data: {
        name: body.name,
        country: body.country,
        isActive: body.isActive ?? true,
      },
    });

    await writeAuditLog({
      entity: 'Buyer',
      entityId: buyer.id,
      action: 'CREATE',
      newValues: body,
      performedBy: actor,
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error('Buyer create error:', error);
    return NextResponse.json({ error: 'Failed to create buyer' }, { status: 500 });
  }
}