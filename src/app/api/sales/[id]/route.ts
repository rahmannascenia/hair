import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  try {
    const { id } = await params;
    const body = await request.json();

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

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Sale update error:', error);
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.sale.delete({ where: { id } });
    return NextResponse.json({ message: 'Sale deleted' });
  } catch (error) {
    console.error('Sale delete error:', error);
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}