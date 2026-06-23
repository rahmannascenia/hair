import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const factory = await db.factory.findUnique({
      where: { id },
      include: {
        lineLeader: {
          include: { headLeader: true },
        },
        workers: {
          orderBy: { name: 'asc' },
        },
        dailyRecords: {
          include: {
            lot: true,
            entries: { include: { worker: true } },
          },
          orderBy: { recordDate: 'desc' },
        },
      },
    });

    if (!factory) {
      return NextResponse.json({ error: 'Factory not found' }, { status: 404 });
    }

    return NextResponse.json(factory);
  } catch (error) {
    console.error('Factory detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch factory' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const factory = await db.factory.update({
      where: { id },
      data: {
        factoryId: body.factoryId,
        name: body.name,
        supervisorName: body.supervisorName,
        supervisorBkash: body.supervisorBkash,
        location: body.location,
        lineLeaderId: body.lineLeaderId,
        groupHead: body.groupHead,
        isActive: body.isActive,
      },
      include: {
        lineLeader: { include: { headLeader: true } },
        workers: true,
      },
    });

    return NextResponse.json(factory);
  } catch (error) {
    console.error('Factory update error:', error);
    return NextResponse.json({ error: 'Failed to update factory' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [workerCount, recordCount] = await Promise.all([
      db.worker.count({ where: { factoryId: id } }),
      db.factoryDailyRecord.count({ where: { factoryId: id } }),
    ]);

    if (workerCount > 0 || recordCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete factory with existing workers or daily records' },
        { status: 400 }
      );
    }

    await db.factory.delete({ where: { id } });
    return NextResponse.json({ message: 'Factory deleted' });
  } catch (error) {
    console.error('Factory delete error:', error);
    return NextResponse.json({ error: 'Failed to delete factory' }, { status: 500 });
  }
}