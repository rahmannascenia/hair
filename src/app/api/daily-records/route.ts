import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const factoryId = searchParams.get('factoryId');
    const lotId = searchParams.get('lotId');
    const wipStatus = searchParams.get('wipStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};
    if (factoryId) {
      // Support filtering by factory code (e.g. "F001") or internal ID (cuid)
      const factory = await db.factory.findFirst({
        where: { OR: [{ id: factoryId }, { factoryId: factoryId }] },
      });
      if (factory) where.factoryId = factory.id;
    }
    if (lotId) where.lotId = lotId;
    if (wipStatus) where.wipStatus = wipStatus;
    if (dateFrom || dateTo) {
      where.recordDate = {};
      if (dateFrom) (where.recordDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.recordDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [records, total] = await Promise.all([
      db.factoryDailyRecord.findMany({
        where,
        include: {
          factory: true,
          lot: true,
          entries: {
            include: { worker: true },
            orderBy: { worker: { name: 'asc' } },
          },
        },
        orderBy: { recordDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.factoryDailyRecord.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Daily records list error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, ...recordData } = body;

    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const rateA = settings?.rateA ?? 500;
    const rateB = settings?.rateB ?? 400;
    const rateC = settings?.rateC ?? 300;
    const attDays = settings?.attDays ?? 30;
    const attBonus = settings?.attBonus ?? 200;
    const factoryAMin = settings?.factoryAMin ?? 0.60;
    const supMax = settings?.supMax ?? 400;
    const supMin = settings?.supMin ?? 100;
    const supExtra = settings?.supExtra ?? 150;

    // Process entries with auto-computation
    const processedEntries = (entries || []).map((e: Record<string, unknown>) => {
      const a = e.aWeightKg ?? 0;
      const b = e.bWeightKg ?? 0;
      const c = e.cWeightKg ?? 0;
      const input = e.inputGivenKg ?? 0;
      const waste = e.wastageKg ?? 0;
      const days = e.daysPresent ?? 0;

      const baseWage = a * rateA + b * rateB + c * rateC;
      const attendanceBonus = days >= attDays ? attBonus : (days >= attDays - 2 ? attBonus / 2 : 0);
      const totalPayable = baseWage + attendanceBonus;
      const balanceStatus = Math.abs(input - (a + b + c + waste)) < 0.001 ? 'OK' : 'MISMATCH';
      const status = totalPayable > 0 ? 'Pending Approval' : 'Hold';

      return {
        workerId: e.workerId,
        inputGivenKg: input,
        aWeightKg: a,
        bWeightKg: b,
        cWeightKg: c,
        wastageKg: waste,
        balanceStatus,
        daysPresent: days,
        baseWage,
        attendanceBonus,
        totalPayable,
        status,
      };
    });

    // Aggregate record-level values
    const totalInputKg = processedEntries.reduce((s: number, e: { inputGivenKg: number }) => s + e.inputGivenKg, 0);
    const totalAGradeKg = processedEntries.reduce((s: number, e: { aWeightKg: number }) => s + e.aWeightKg, 0);
    const totalBGradeKg = processedEntries.reduce((s: number, e: { bWeightKg: number }) => s + e.bWeightKg, 0);
    const totalCGradeKg = processedEntries.reduce((s: number, e: { cWeightKg: number }) => s + e.cWeightKg, 0);
    const totalWastageKg = processedEntries.reduce((s: number, e: { wastageKg: number }) => s + e.wastageKg, 0);
    const totalPayrollBdt = processedEntries.reduce((s: number, e: { totalPayable: number }) => s + e.totalPayable, 0);

    const totalOutput = totalAGradeKg + totalBGradeKg + totalCGradeKg;
    const aGradePct = totalOutput > 0 ? totalAGradeKg / totalOutput : 0;

    const hostingAllowance = aGradePct >= factoryAMin ? supMax : supMin;
    const perfBonus = aGradePct >= factoryAMin ? supExtra : 0;
    const totalSupPay = hostingAllowance + perfBonus;
    const grandTotalBdt = totalPayrollBdt + totalSupPay;
    const wipStatus = 'COMPLETED';

    const record = await db.factoryDailyRecord.create({
      data: {
        recordDate: new Date(recordData.recordDate),
        factoryId: recordData.factoryId,
        lotId: recordData.lotId,
        hostingAllowance,
        perfBonus,
        totalSupPay,
        totalInputKg,
        totalAGradeKg,
        totalBGradeKg,
        totalCGradeKg,
        totalWastageKg,
        totalPayrollBdt,
        grandTotalBdt,
        wipStatus,
        entries: { create: processedEntries },
      },
      include: {
        factory: true,
        lot: true,
        entries: { include: { worker: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Daily record create error:', error);
    return NextResponse.json({ error: 'Failed to create daily record' }, { status: 500 });
  }
}