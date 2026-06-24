import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.phase2Job.findUnique({
      where: { id },
      include: { lot: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Phase 2 job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Phase2 detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch phase 2 job' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const job = await db.phase2Job.update({
      where: { id },
      data: {
        jobId: body.jobId,
        lotId: body.lotId,
        date: body.date ? new Date(body.date) : undefined,
        inputKg: body.inputKg,
        size5Kg: body.size5Kg,
        size6Kg: body.size6Kg,
        size8Kg: body.size8Kg,
        size10Kg: body.size10Kg,
        size12Kg: body.size12Kg,
        size14Kg: body.size14Kg,
        size16Kg: body.size16Kg,
        size18Kg: body.size18Kg,
        size20Kg: body.size20Kg,
        size24Kg: body.size24Kg,
        size30Kg: body.size30Kg,
        totalSizedKg: body.totalSizedKg,
        combingLossKg: body.combingLossKg,
        lossPct: body.lossPct,
        realisableValueBdt: body.realisableValueBdt,
        costBdt: body.costBdt,
        marginBdt: body.marginBdt,
      },
      include: { lot: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Phase2 update error:', error);
    return NextResponse.json({ error: 'Failed to update phase 2 job' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.phase2Job.delete({ where: { id } });
    return NextResponse.json({ message: 'Phase 2 job deleted' });
  } catch (error) {
    console.error('Phase2 delete error:', error);
    return NextResponse.json({ error: 'Failed to delete phase 2 job' }, { status: 500 });
  }
}