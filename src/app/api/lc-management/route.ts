import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const data = await db.lCManagement.findMany({
      where,
      include: { procurement: { include: { supplier: true } } },
      orderBy: { lcDate: 'desc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('LC list error:', error);
    return NextResponse.json({ error: 'Failed to fetch LCs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lc = await db.lCManagement.create({
      data: {
        lcNo: body.lcNo,
        procurementId: body.procurementId,
        lcDate: body.lcDate ? new Date(body.lcDate) : new Date(),
        bankName: body.bankName,
        usdAmount: body.usdAmount,
        bdtAmount: body.bdtAmount ?? body.usdAmount * 120,
        fxRate: body.fxRate ?? 120,
        status: body.status ?? 'Open',
        shipmentDate: body.shipmentDate ? new Date(body.shipmentDate) : null,
        clearanceDate: body.clearanceDate ? new Date(body.clearanceDate) : null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        notes: body.notes,
      },
      include: { procurement: { include: { supplier: true } } },
    });
    return NextResponse.json(lc, { status: 201 });
  } catch (error) {
    console.error('LC create error:', error);
    return NextResponse.json({ error: 'Failed to create LC' }, { status: 500 });
  }
}