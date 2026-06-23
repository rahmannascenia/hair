import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const risk = await db.risk.update({
      where: { id },
      data: {
        description: body.description,
        category: body.category,
        likelihood: body.likelihood,
        impact: body.impact,
        riskScore: body.riskScore ?? (body.likelihood * body.impact),
        mitigation: body.mitigation,
        owner: body.owner,
        status: body.status,
      },
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Risk update error:', error);
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.risk.delete({ where: { id } });
    return NextResponse.json({ message: 'Risk deleted' });
  } catch (error) {
    console.error('Risk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete risk' }, { status: 500 });
  }
}