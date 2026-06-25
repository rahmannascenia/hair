import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) return NextResponse.json({ results: [] });
    const results: { type: string; id: string; label: string; sub: string; section: string }[] = [];

    const workers = await db.worker.findMany({ where: { OR: [{ name: { contains: q } }, { workerId: { contains: q } }] }, take: 10, include: { factory: true } });
    workers.forEach(w => results.push({ type: 'Worker', id: w.id, label: `${w.workerId} — ${w.name}`, sub: `${w.factory?.factoryId} — ${w.factory?.name}`, section: 'worker-profile' }));

    const lots = await db.lot.findMany({ where: { OR: [{ lotNo: { contains: q } }, { colour: { contains: q } }] }, take: 10 });
    lots.forEach(l => results.push({ type: 'Lot', id: l.id, label: l.lotNo, sub: `${l.colour} — ${l.rawWeightKg}kg — ${l.status}`, section: 'lot-tracker' }));

    const factories = await db.factory.findMany({ where: { OR: [{ name: { contains: q } }, { factoryId: { contains: q } }] }, take: 10, include: { workers: { select: { id: true } } } });
    factories.forEach(f => results.push({ type: 'Factory', id: f.id, label: `${f.factoryId} — ${f.name}`, sub: `${f.supervisorName} — ${f.workers.length} workers`, section: 'factory' }));

    const suppliers = await db.supplier.findMany({ where: { OR: [{ name: { contains: q } }, { country: { contains: q } }] }, take: 10 });
    suppliers.forEach(s => results.push({ type: 'Supplier', id: s.id, label: s.name, sub: s.country + (s.isLocal ? ' (Local)' : ''), section: 'suppliers' }));

    const buyers = await db.buyer.findMany({ where: { OR: [{ name: { contains: q } }, { country: { contains: q } }] }, take: 10 });
    buyers.forEach(b => results.push({ type: 'Buyer', id: b.id, label: b.name, sub: b.country, section: 'buyers' }));

    const sales = await db.sale.findMany({ where: { OR: [{ contractNo: { contains: q } }, { buyer: { name: { contains: q } } }] }, take: 10, include: { buyer: true } });
    sales.forEach(s => results.push({ type: 'Sale', id: s.id, label: s.contractNo, sub: `${s.buyer?.name} — ${s.qtyKg}kg — ${s.status}`, section: 'sales' }));

    const lcs = await db.lCManagement.findMany({ where: { OR: [{ lcNo: { contains: q } }, { bankName: { contains: q } }] }, take: 10, include: { procurement: { include: { supplier: true } } } });
    lcs.forEach(l => results.push({ type: 'LC', id: l.id, label: l.lcNo, sub: `${l.procurement?.supplier?.name || ''} — $${(l.usdAmount || 0).toLocaleString()} — ${l.status}`, section: 'lc-management' }));

    const procs = await db.procurement.findMany({ where: { OR: [{ voucherNo: { contains: q } }, { lcNo: { contains: q } }] }, take: 10, include: { supplier: true } });
    procs.forEach(p => results.push({ type: 'Procurement', id: p.id, label: p.voucherNo, sub: `${p.supplier?.name} — ${p.rawWeightKg}kg`, section: 'procurement' }));

    const hls = await db.headLeader.findMany({ where: { name: { contains: q } }, take: 10 });
    hls.forEach(h => results.push({ type: 'Head Leader', id: h.id, label: h.name, sub: h.region, section: 'organization' }));

    const lls = await db.lineLeader.findMany({ where: { name: { contains: q } }, take: 10, include: { headLeader: true, factories: { select: { id: true } } } });
    lls.forEach(l => results.push({ type: 'Line Leader', id: l.id, label: l.name, sub: `${l.headLeader?.name} — ${l.factories.length} factories`, section: 'organization' }));

    return NextResponse.json({ results: results.slice(0, 30) });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}