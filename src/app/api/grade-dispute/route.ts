import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const data = await db.gradeDispute.findMany({
      where,
      include: { worker: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Grade dispute list error:', error);
    return NextResponse.json({ error: 'Failed to fetch grade disputes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dispute = await db.gradeDispute.create({
      data: {
        entryId: body.entryId,
        workerId: body.workerId,
        reason: body.reason,
        status: 'Pending',
      },
      include: { worker: true },
    });
    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('Grade dispute create error:', error);
    return NextResponse.json({ error: 'Failed to create grade dispute' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, resolution } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const dispute = await db.gradeDispute.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedAt: status === 'Upheld' || status === 'Overturned' ? new Date() : null,
      },
      include: { worker: true },
    });
    return NextResponse.json(dispute);
  } catch (error) {
    console.error('Grade dispute PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update grade dispute' }, { status: 500 });
  }
}