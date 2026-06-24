import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
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
  try {
    const body = await request.json();

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

    return NextResponse.json(pricing, { status: 201 });
  } catch (error) {
    console.error('Size pricing POST error:', error);
    return NextResponse.json({ error: 'Failed to create size pricing' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle buyer pricing update
    if (body.type === 'buyer-pricing') {
      const { id, premiumPct } = body;

      const pricing = await db.buyerPricing.update({
        where: { id },
        data: { premiumPct },
        include: { buyer: true },
      });

      return NextResponse.json(pricing);
    }

    // Handle base size pricing update (by lengthInch since it's unique)
    const { lengthInch, ...updateData } = body;
    const pricing = await db.sizePricing.update({
      where: { lengthInch },
      data: updateData,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Size pricing PUT error:', error);
    return NextResponse.json({ error: 'Failed to update size pricing' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const lengthInch = searchParams.get('lengthInch');

    if (type === 'buyer-pricing' && id) {
      await db.buyerPricing.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (lengthInch) {
      await db.sizePricing.delete({ where: { lengthInch: parseInt(lengthInch) } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Provide id or lengthInch' }, { status: 400 });
  } catch (error) {
    console.error('Size pricing DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete size pricing' }, { status: 500 });
  }
}