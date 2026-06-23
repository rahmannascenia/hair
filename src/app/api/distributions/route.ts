import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const lotId = searchParams.get('lotId');
    const toRole = searchParams.get('toRole');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (lotId) where.lotId = lotId;
    if (toRole) where.toRole = toRole;
    if (status) where.status = status;

    const [distributions, total] = await Promise.all([
      db.phase1Distribution.findMany({
        where,
        include: {
          lot: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.phase1Distribution.count({ where }),
    ]);

    return NextResponse.json({
      data: distributions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Distributions list error:', error);
    return NextResponse.json({ error: 'Failed to fetch distributions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const distribution = await db.phase1Distribution.create({
      data: {
        handoffId: body.handoffId,
        date: new Date(body.date),
        fromRole: body.fromRole,
        fromName: body.fromName,
        toRole: body.toRole,
        toName: body.toName,
        lotId: body.lotId,
        qtyKg: body.qtyKg,
        cumulativeKg: body.cumulativeKg,
        tierMultiplier: body.tierMultiplier ?? 1,
        status: body.status ?? 'OK',
      },
      include: { lot: true },
    });

    // Update lot distributed kg
    if (body.lotId && body.qtyKg) {
      const lot = await db.lot.findUnique({ where: { id: body.lotId } });
      if (lot) {
        await db.lot.update({
          where: { id: body.lotId },
          data: {
            distributedKg: lot.distributedKg + body.qtyKg,
          },
        });
      }
    }

    return NextResponse.json(distribution, { status: 201 });
  } catch (error) {
    console.error('Distribution create error:', error);
    return NextResponse.json({ error: 'Failed to create distribution' }, { status: 500 });
  }
}