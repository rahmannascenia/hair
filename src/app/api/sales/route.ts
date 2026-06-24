import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { contractNo: { contains: search } },
        { productSpec: { contains: search } },
      ];
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where, include: { buyer: true },
        orderBy: { contractDate: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      db.sale.count({ where }),
    ]);

    // FX Exposure summary
    const salesAgg = await db.sale.aggregate({
      _sum: { qtyKg: true, usdValue: true, bdtValue: true, totalMarginBdt: true, totalCostBdt: true },
    });
    const totalUsdValue = salesAgg._sum.usdValue ?? 0;
    const totalBdtValue = salesAgg._sum.bdtValue ?? 0;
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const fxRate = settings?.fxUsdBdt ?? 120;
    const effectiveRate = totalUsdValue > 0 ? totalBdtValue / totalUsdValue : fxRate;
    const fxGainLossPerUsd = effectiveRate - fxRate;
    const fxGainLossTotal = fxGainLossPerUsd * totalUsdValue;

    return NextResponse.json({
      data: sales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      fxExposure: {
        totalUsdValue: Math.round(totalUsdValue * 100) / 100,
        totalBdtValue: Math.round(totalBdtValue * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        bookedRate: fxRate,
        fxGainLossPerUsd: Math.round(fxGainLossPerUsd * 100) / 100,
        fxGainLossTotal: Math.round(fxGainLossTotal * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Sales list error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const fxRate = settings?.fxUsdBdt ?? 120;

    const usdValue = body.qtyKg * body.usdPerKg;
    const bdtValue = usdValue * fxRate;

    const sizePrice = await db.sizePricing.findUnique({ where: { lengthInch: body.lengthInch } });
    const costPerKgBdt = sizePrice?.bdtPerKg ?? 0;
    const totalCostBdt = costPerKgBdt * body.qtyKg;
    const marginPerKgBdt = body.qtyKg > 0 ? (bdtValue / body.qtyKg) - costPerKgBdt : 0;
    const totalMarginBdt = bdtValue - totalCostBdt;
    const marginPct = bdtValue > 0 ? marginPerKgBdt / (bdtValue / body.qtyKg) : 0;
    const status = marginPct > 0.20 ? 'Healthy' : 'Review';

    const sale = await db.sale.create({
      data: {
        contractNo: body.contractNo,
        contractDate: new Date(body.contractDate),
        buyerId: body.buyerId,
        productSpec: body.productSpec,
        lengthInch: body.lengthInch,
        qtyKg: body.qtyKg,
        usdPerKg: body.usdPerKg,
        usdValue, bdtValue, costPerKgBdt, totalCostBdt, marginPerKgBdt, totalMarginBdt, marginPct, status,
      },
      include: { buyer: true },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Sale create error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}