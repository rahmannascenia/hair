import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headLeader = await db.headLeader.findUnique({
      where: { id },
      include: {
        lineLeaders: {
          include: {
            _count: {
              select: { factories: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!headLeader) {
      return NextResponse.json({ error: 'Head leader not found' }, { status: 404 });
    }

    return NextResponse.json(headLeader);
  } catch (error) {
    console.error('Head leader detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch head leader' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const headLeader = await db.headLeader.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        region: body.region,
        isActive: body.isActive,
      },
      include: {
        _count: {
          select: { lineLeaders: true },
        },
      },
    });

    return NextResponse.json(headLeader);
  } catch (error) {
    console.error('Head leader update error:', error);
    return NextResponse.json({ error: 'Failed to update head leader' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if any line leaders under this head leader have factories
    const lineLeadersWithFactories = await db.lineLeader.count({
      where: {
        headLeaderId: id,
        factories: { some: {} },
      },
    });

    if (lineLeadersWithFactories > 0) {
      return NextResponse.json(
        { error: 'Cannot delete head leader: one or more line leaders have factories' },
        { status: 400 }
      );
    }

    await db.headLeader.delete({ where: { id } });
    return NextResponse.json({ message: 'Head leader deleted' });
  } catch (error) {
    console.error('Head leader delete error:', error);
    return NextResponse.json({ error: 'Failed to delete head leader' }, { status: 500 });
  }
}