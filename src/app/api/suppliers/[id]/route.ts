import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        procurements: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Supplier detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: body.name,
        country: body.country,
        contact: body.contact,
        phone: body.phone,
        isLocal: body.isLocal,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Supplier update error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const procurementCount = await db.procurement.count({
      where: { supplierId: id },
    });

    if (procurementCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing procurements' },
        { status: 400 }
      );
    }

    await db.supplier.delete({ where: { id } });
    return NextResponse.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Supplier delete error:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}