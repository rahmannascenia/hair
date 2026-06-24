import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lineLeader = await db.lineLeader.findUnique({
      where: { id },
      include: {
        headLeader: true,
        factories: {
          orderBy: { factoryId: 'asc' },
        },
      },
    });

    if (!lineLeader) {
      return NextResponse.json({ error: 'Line leader not found' }, { status: 404 });
    }

    return NextResponse.json(lineLeader);
  } catch (error) {
    console.error('Line leader detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch line leader' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const lineLeader = await db.lineLeader.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        bKash: body.bKash,
        headLeaderId: body.headLeaderId,
        isActive: body.isActive,
      },
      include: {
        headLeader: true,
        _count: {
          select: { factories: true },
        },
      },
    });

    return NextResponse.json(lineLeader);
  } catch (error) {
    console.error('Line leader update error:', error);
    return NextResponse.json({ error: 'Failed to update line leader' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const factoryCount = await db.factory.count({
      where: { lineLeaderId: id },
    });

    if (factoryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete line leader: has associated factories' },
        { status: 400 }
      );
    }

    await db.lineLeader.delete({ where: { id } });
    return NextResponse.json({ message: 'Line leader deleted' });
  } catch (error) {
    console.error('Line leader delete error:', error);
    return NextResponse.json({ error: 'Failed to delete line leader' }, { status: 500 });
  }
}