import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const buckets = await db.inventoryBucket.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({ data: buckets });
  } catch (error) {
    console.error('Inventory buckets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory buckets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bucket = await db.inventoryBucket.create({
      data: {
        bucketName: body.bucketName,
        weightKg: body.weightKg ?? 0,
        valueBdt: body.valueBdt ?? 0,
      },
    });
    return NextResponse.json(bucket, { status: 201 });
  } catch (error) {
    console.error('Inventory bucket create error:', error);
    return NextResponse.json({ error: 'Failed to create inventory bucket' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const bucket = await db.inventoryBucket.update({
      where: { id: body.id },
      data: {
        bucketName: body.bucketName,
        weightKg: body.weightKg,
        valueBdt: body.valueBdt,
      },
    });
    return NextResponse.json(bucket);
  } catch (error) {
    console.error('Inventory bucket update error:', error);
    return NextResponse.json({ error: 'Failed to update inventory bucket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await db.inventoryBucket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Inventory bucket delete error:', error);
    return NextResponse.json({ error: 'Failed to delete inventory bucket' }, { status: 500 });
  }
}