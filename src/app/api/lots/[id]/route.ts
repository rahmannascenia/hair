import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lot = await db.lot.findUnique({
      where: { id },
      include: {
        procurement: { include: { supplier: true } },
        washLogs: { orderBy: { washDate: 'desc' } },
        distributions: { orderBy: { date: 'desc' } },
        factoryRecords: {
          include: {
            factory: true,
            entries: { include: { worker: true } },
          },
          orderBy: { recordDate: 'desc' },
        },
        phase2Jobs: { orderBy: { date: 'desc' } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    return NextResponse.json(lot);
  } catch (error) {
    console.error('Lot detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch lot' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lot = await db.lot.update({
      where: { id },
      data: {
        lotNo: body.lotNo,
        procurementId: body.procurementId,
        colour: body.colour,
        rawWeightKg: body.rawWeightKg,
        landedCostPerKg: body.landedCostPerKg,
        totalLandedCost: body.totalLandedCost,
        washStatus: body.washStatus,
        distributedKg: body.distributedKg,
        returnedKg: body.returnedKg,
        finishedKg: body.finishedKg,
        status: body.status,
      },
    });

    return NextResponse.json(lot);
  } catch (error) {
    console.error('Lot update error:', error);
    return NextResponse.json({ error: 'Failed to update lot' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for related records
    const [washCount, distCount, recordCount, phase2Count] = await Promise.all([
      db.washLog.count({ where: { lotId: id } }),
      db.phase1Distribution.count({ where: { lotId: id } }),
      db.factoryDailyRecord.count({ where: { lotId: id } }),
      db.phase2Job.count({ where: { lotId: id } }),
    ]);

    const relatedCount = washCount + distCount + recordCount + phase2Count;
    if (relatedCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete lot with ${relatedCount} related records` },
        { status: 400 }
      );
    }

    await db.lot.delete({ where: { id } });
    return NextResponse.json({ message: 'Lot deleted' });
  } catch (error) {
    console.error('Lot delete error:', error);
    return NextResponse.json({ error: 'Failed to delete lot' }, { status: 500 });
  }
}