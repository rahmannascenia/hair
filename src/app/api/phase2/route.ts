import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const lotId = searchParams.get('lotId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (lotId) where.lotId = lotId;
    if (search) where.jobId = { contains: search };

    const [jobs, total] = await Promise.all([
      db.phase2Job.findMany({ where, include: { lot: true }, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.phase2Job.count({ where }),
    ]);

    return NextResponse.json({
      data: jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Phase2 list error:', error);
    return NextResponse.json({ error: 'Failed to fetch phase 2 jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get size pricing for value computation
    const sizePricing = await db.sizePricing.findMany();
    const rateMap: Record<number, number> = {};
    sizePricing.forEach((sp) => { rateMap[sp.lengthInch] = sp.bdtPerKg; });

    const sizes = [5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30];
    let totalSizedKg = 0;
    let realisableValueBdt = 0;
    for (const sz of sizes) {
      const key = `size${sz}Kg` as string;
      const kg = body[key] ?? 0;
      totalSizedKg += kg;
      realisableValueBdt += kg * (rateMap[sz] ?? 0);
    }

    const inputKg = body.inputKg;
    const combingLossKg = inputKg - totalSizedKg;
    const lossPct = inputKg > 0 ? combingLossKg / inputKg : 0;
    const costBdt = inputKg * 4000;
    const marginBdt = realisableValueBdt - costBdt;

    const job = await db.phase2Job.create({
      data: {
        jobId: body.jobId,
        lotId: body.lotId,
        date: new Date(body.date),
        inputKg,
        size5Kg: body.size5Kg ?? 0,
        size6Kg: body.size6Kg ?? 0,
        size8Kg: body.size8Kg ?? 0,
        size10Kg: body.size10Kg ?? 0,
        size12Kg: body.size12Kg ?? 0,
        size14Kg: body.size14Kg ?? 0,
        size16Kg: body.size16Kg ?? 0,
        size18Kg: body.size18Kg ?? 0,
        size20Kg: body.size20Kg ?? 0,
        size24Kg: body.size24Kg ?? 0,
        size30Kg: body.size30Kg ?? 0,
        totalSizedKg,
        combingLossKg,
        lossPct,
        realisableValueBdt,
        costBdt,
        marginBdt,
      },
      include: { lot: true },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Phase2 create error:', error);
    return NextResponse.json({ error: 'Failed to create phase 2 job' }, { status: 500 });
  }
}