import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  try {
    const { id } = await params;
    const body = await request.json();

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

    return NextResponse.json(procurement);
  } catch (error) {
    console.error('Procurement update error:', error);
    return NextResponse.json({ error: 'Failed to update procurement' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if procurement has related lots
    const lotsCount = await db.lot.count({ where: { procurementId: id } });
    if (lotsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete procurement with existing lots' },
        { status: 400 }
      );
    }

    await db.procurement.delete({ where: { id } });
    return NextResponse.json({ message: 'Procurement deleted' });
  } catch (error) {
    console.error('Procurement delete error:', error);
    return NextResponse.json({ error: 'Failed to delete procurement' }, { status: 500 });
  }
}