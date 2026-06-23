import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dist = await db.phase1Distribution.findUnique({
      where: { id },
      include: { lot: true },
    });
    if (!dist) return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    return NextResponse.json(dist);
  } catch (error) {
    console.error('Distribution GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch distribution' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await db.phase1Distribution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });

    // Adjust lot distributedKg if qtyKg or lotId changed
    if (existing.lotId && existing.qtyKg) {
      await db.lot.update({
        where: { id: existing.lotId },
        data: { distributedKg: { decrement: existing.qtyKg } },
      });
    }

    const updated = await db.phase1Distribution.update({
      where: { id },
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

    // Add new qtyKg to lot
    if (body.lotId && body.qtyKg) {
      await db.lot.update({
        where: { id: body.lotId },
        data: { distributedKg: { increment: body.qtyKg } },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Distribution PUT error:', error);
    return NextResponse.json({ error: 'Failed to update distribution' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.phase1Distribution.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });

    // Subtract qtyKg from lot
    if (existing.lotId && existing.qtyKg) {
      await db.lot.update({
        where: { id: existing.lotId },
        data: { distributedKg: { decrement: existing.qtyKg } },
      });
    }

    await db.phase1Distribution.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Distribution DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete distribution' }, { status: 500 });
  }
}