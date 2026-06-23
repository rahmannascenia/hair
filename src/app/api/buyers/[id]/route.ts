import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  try {
    const { id } = await params;
    const body = await request.json();
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
    return NextResponse.json(buyer);
  } catch (error) {
    console.error('Buyer PUT error:', error);
    return NextResponse.json({ error: 'Failed to update buyer' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleCount = await db.sale.count({ where: { buyerId: id } });
    if (saleCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete buyer with ${saleCount} sales contracts. Delete sales first.` },
        { status: 400 }
      );
    }
    await db.buyerPricing.deleteMany({ where: { buyerId: id } });
    await db.buyer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Buyer DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete buyer' }, { status: 500 });
  }
}