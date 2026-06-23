import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await db.factoryDailyRecord.findUnique({
      where: { id },
      include: {
        factory: {
          include: {
            lineLeader: true,
          },
        },
        lot: true,
        entries: {
          include: { worker: true },
          orderBy: { worker: { name: 'asc' } },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Daily record detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily record' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { entries, ...recordData } = body;

    // If entries are provided, delete existing and recreate
    if (entries) {
      await db.workerDailyEntry.deleteMany({ where: { recordId: id } });
    }

    const record = await db.factoryDailyRecord.update({
      where: { id },
      data: {
        recordDate: recordData.recordDate ? new Date(recordData.recordDate) : undefined,
        factoryId: recordData.factoryId,
        lotId: recordData.lotId,
        hostingAllowance: recordData.hostingAllowance,
        perfBonus: recordData.perfBonus,
        totalSupPay: recordData.totalSupPay,
        totalInputKg: recordData.totalInputKg,
        totalAGradeKg: recordData.totalAGradeKg,
        totalBGradeKg: recordData.totalBGradeKg,
        totalCGradeKg: recordData.totalCGradeKg,
        totalWastageKg: recordData.totalWastageKg,
        totalPayrollBdt: recordData.totalPayrollBdt,
        grandTotalBdt: recordData.grandTotalBdt,
        wipStatus: recordData.wipStatus,
        entries: entries
          ? {
              create: entries.map((e: Record<string, unknown>) => ({
                workerId: e.workerId,
                inputGivenKg: e.inputGivenKg,
                aWeightKg: e.aWeightKg ?? 0,
                bWeightKg: e.bWeightKg ?? 0,
                cWeightKg: e.cWeightKg ?? 0,
                wastageKg: e.wastageKg ?? 0,
                balanceStatus: e.balanceStatus ?? 'OK',
                daysPresent: e.daysPresent ?? 0,
                baseWage: e.baseWage ?? 0,
                attendanceBonus: e.attendanceBonus ?? 0,
                totalPayable: e.totalPayable ?? 0,
                status: e.status ?? 'Pending Approval',
              })),
            }
          : undefined,
      },
      include: {
        factory: true,
        lot: true,
        entries: { include: { worker: true } },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Daily record update error:', error);
    return NextResponse.json({ error: 'Failed to update daily record' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete all entries first
    await db.workerDailyEntry.deleteMany({ where: { recordId: id } });
    await db.factoryDailyRecord.delete({ where: { id } });

    return NextResponse.json({ message: 'Daily record deleted' });
  } catch (error) {
    console.error('Daily record delete error:', error);
    return NextResponse.json({ error: 'Failed to delete daily record' }, { status: 500 });
  }
}