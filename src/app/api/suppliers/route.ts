import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const isActive = searchParams.get('isActive');
    const isLocal = searchParams.get('isLocal');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (isLocal !== null && isLocal !== undefined) {
      where.isLocal = isLocal === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        include: {
          _count: { select: { procurements: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplier.count({ where }),
    ]);

    return NextResponse.json({
      data: suppliers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Suppliers list error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        country: body.country,
        contact: body.contact,
        phone: body.phone,
        isLocal: body.isLocal ?? false,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Supplier create error:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}