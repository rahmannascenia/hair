import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const worker = await db.worker.findUnique({
      where: { id },
      include: {
        factory: true,
        dailyEntries: {
          include: {
            record: {
              include: { lot: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch worker' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const worker = await db.worker.update({
      where: { id },
      data: {
        workerId: body.workerId,
        name: body.name,
        factoryId: body.factoryId,
        bKash: body.bKash,
        isActive: body.isActive,
      },
      include: {
        factory: true,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error('Worker update error:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entryCount = await db.workerDailyEntry.count({
      where: { workerId: id },
    });

    if (entryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete worker with existing daily entries' },
        { status: 400 }
      );
    }

    await db.worker.delete({ where: { id } });
    return NextResponse.json({ message: 'Worker deleted' });
  } catch (error) {
    console.error('Worker delete error:', error);
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}