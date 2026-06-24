import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const washLog = await db.washLog.findUnique({
      where: { id },
      include: { lot: { include: { procurement: { include: { supplier: true } } } } },
    });
    if (!washLog) return NextResponse.json({ error: 'Wash log not found' }, { status: 404 });
    return NextResponse.json(washLog);
  } catch (error) {
    console.error('Wash log GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wash log' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = body.inputKg;
    const output = body.outputKg;
    const wastageKg = input - output;
    const wastagePct = input > 0 ? wastageKg / input : 0;
    const chemicalsBdt = Math.round(input * 12);
    const labourBdt = Math.round(input * 8);
    const costPerKgOut = output > 0 ? (chemicalsBdt + labourBdt) / output : 0;

    const settings = await db.settings.findUnique({ where: { id: 'default' } });
    const washTol = settings?.washTol ?? 0.15;
    const status = wastagePct > washTol ? 'INVESTIGATE' : 'OK';

    const updated = await db.washLog.update({
      where: { id },
      data: {
        washId: body.washId,
        lotId: body.lotId,
        washDate: new Date(body.washDate),
        operator: body.operator,
        inputKg: input,
        outputKg: output,
        wastageKg,
        wastagePct,
        chemicalsBdt,
        labourBdt,
        costPerKgOut,
        status,
      },
      include: { lot: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Wash log PUT error:', error);
    return NextResponse.json({ error: 'Failed to update wash log' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.washLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wash log DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete wash log' }, { status: 500 });
  }
}