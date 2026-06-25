import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sub: string;
  section: string;
  entityId?: string; // for drill-down
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) return NextResponse.json({ results: [] });
    const results: SearchResult[] = [];

    // ===== 1. WORKERS — find by name or ID =====
    const workers = await db.worker.findMany({
      where: { OR: [{ name: { contains: q } }, { workerId: { contains: q } }] },
      take: 15, include: { factory: true },
    });
    workers.forEach(w => results.push({
      type: 'Worker', id: w.id, label: `${w.workerId} — ${w.name}`,
      sub: `${w.factory?.factoryId || ''} ${w.factory?.name || ''}`, section: 'worker-profile',
    }));

    // ===== 2. LOTS — find by lot number or colour =====
    const lots = await db.lot.findMany({
      where: { OR: [{ lotNo: { contains: q } }, { colour: { contains: q } }] },
      take: 15,
    });
    lots.forEach(l => results.push({
      type: 'Lot', id: l.id, label: l.lotNo,
      sub: `${l.colour} — ${l.rawWeightKg}kg raw — ${l.status}`, section: 'lot-tracker',
    }));

    // ===== 3. FACTORIES — find by name, ID, or supervisor =====
    const factories = await db.factory.findMany({
      where: { OR: [{ name: { contains: q } }, { factoryId: { contains: q } }, { supervisorName: { contains: q } }] },
      take: 10, include: { workers: { select: { id: true } } },
    });
    factories.forEach(f => results.push({
      type: 'Factory', id: f.id, label: `${f.factoryId} — ${f.name}`,
      sub: `${f.supervisorName} — ${f.workers.length} workers`, section: 'factory',
    }));

    // ===== 4. SUPPLIERS =====
    const suppliers = await db.supplier.findMany({
      where: { OR: [{ name: { contains: q } }, { country: { contains: q } }, { contact: { contains: q } }] },
      take: 10,
    });
    suppliers.forEach(s => results.push({
      type: 'Supplier', id: s.id, label: s.name,
      sub: `${s.country}${s.isLocal ? ' (Local)' : ' (Import)'}`, section: 'suppliers',
    }));

    // ===== 5. BUYERS =====
    const buyers = await db.buyer.findMany({
      where: { OR: [{ name: { contains: q } }, { country: { contains: q } }] },
      take: 10,
    });
    buyers.forEach(b => results.push({
      type: 'Buyer', id: b.id, label: b.name, sub: b.country, section: 'buyers',
    }));

    // ===== 6. SALES CONTRACTS =====
    const sales = await db.sale.findMany({
      where: { OR: [{ contractNo: { contains: q } }, { productSpec: { contains: q } }, { buyer: { name: { contains: q } } }] },
      take: 10, include: { buyer: true },
    });
    sales.forEach(s => results.push({
      type: 'Sale', id: s.id, label: s.contractNo,
      sub: `${s.buyer?.name || ''} — ${s.qtyKg}kg — ${s.status}`, section: 'sales',
    }));

    // ===== 7. LC MANAGEMENT =====
    const lcs = await db.lCManagement.findMany({
      where: { OR: [{ lcNo: { contains: q } }, { bankName: { contains: q } }] },
      take: 10, include: { procurement: { include: { supplier: true } } },
    });
    lcs.forEach(l => results.push({
      type: 'LC', id: l.id, label: l.lcNo,
      sub: `${l.procurement?.supplier?.name || ''} — $${(l.usdAmount || 0).toLocaleString()} — ${l.status}`, section: 'lc-management',
    }));

    // ===== 8. PROCUREMENT VOUCHERS =====
    const procs = await db.procurement.findMany({
      where: { OR: [{ voucherNo: { contains: q } }, { lcNo: { contains: q } }, { originCountry: { contains: q } }] },
      take: 10, include: { supplier: true },
    });
    procs.forEach(p => results.push({
      type: 'Procurement', id: p.id, label: p.voucherNo,
      sub: `${p.supplier?.name || ''} — ${p.rawWeightKg}kg — ৳${Math.round(p.totalLandedCostBdt).toLocaleString()}`, section: 'procurement',
    }));

    // ===== 9. HEAD LEADERS =====
    const hls = await db.headLeader.findMany({
      where: { name: { contains: q } }, take: 10, include: { lineLeaders: { select: { id: true } } },
    });
    hls.forEach(h => results.push({
      type: 'Head Leader', id: h.id, label: h.name,
      sub: `${h.region} — ${h.lineLeaders.length} line leaders`, section: 'organization',
    }));

    // ===== 10. LINE LEADERS =====
    const lls = await db.lineLeader.findMany({
      where: { OR: [{ name: { contains: q } }, { bKash: { contains: q } }] },
      take: 10, include: { headLeader: true, factories: { select: { id: true } } },
    });
    lls.forEach(l => results.push({
      type: 'Line Leader', id: l.id, label: l.name,
      sub: `Under ${l.headLeader?.name || ''} — ${l.factories.length} factories`, section: 'organization',
    }));

    // ===== 11. WASH LOGS — search by operator name =====
    const washLogs = await db.washLog.findMany({
      where: { OR: [{ operator: { contains: q } }, { washId: { contains: q } }] },
      take: 10, include: { lot: true },
    });
    washLogs.forEach(w => results.push({
      type: 'Wash Log', id: w.id, label: `${w.washId} — ${w.operator}`,
      sub: `Lot: ${w.lot?.lotNo || ''} — ${w.outputKg}kg out — ${w.wastagePct}% waste`, section: 'washing-log',
    }));

    // ===== 12. RISKS =====
    const risks = await db.risk.findMany({
      where: { OR: [{ description: { contains: q } }, { riskId: { contains: q } }, { owner: { contains: q } }] },
      take: 10,
    });
    risks.forEach(r => results.push({
      type: 'Risk', id: r.id, label: `${r.riskId} — ${r.description.slice(0, 50)}`,
      sub: `${r.category} — Score: ${r.riskScore} — ${r.status}`, section: 'risks',
    }));

    // ===== 13. CONSUMABLES =====
    const consumables = await db.consumable.findMany({
      where: { OR: [{ itemName: { contains: q } }, { category: { contains: q } }] },
      take: 10,
    });
    consumables.forEach(c => results.push({
      type: 'Consumable', id: c.id, label: c.itemName,
      sub: `${c.category} — ${c.stockQty} ${c.unit} in stock`, section: 'consumables',
    }));

    // ===== 14. SIZE PRICING =====
    const sizePricings = await db.sizePricing.findMany({
      where: { OR: [{ marketSegment: { contains: q } }] },
      take: 10,
    });
    sizePricings.forEach(sp => results.push({
      type: 'Size Pricing', id: sp.id, label: `${sp.lengthInch}"`,
      sub: `৳${sp.bdtPerKg}/kg — $${sp.usdPerKg}/kg — ${sp.marketSegment}`, section: 'size-pricing',
    }));

    // ===== 15. CROSS-REFERENCE: Worker name in daily entries =====
    // If query matches a worker name, find all related daily entries
    const workerDailyEntries = await db.workerDailyEntry.findMany({
      where: { worker: { name: { contains: q } } },
      take: 5, include: { worker: true, record: { include: { factory: true, lot: true } } },
      orderBy: { createdAt: 'desc' },
    });
    workerDailyEntries.forEach(e => results.push({
      type: 'Daily Entry', id: e.id,
      label: `${e.worker?.name || ''} — ${new Date(e.record?.recordDate || '').toLocaleDateString()}`,
      sub: `${e.record?.factory?.name || ''} — A:${e.aWeightKg} B:${e.bWeightKg} C:${e.cWeightKg}kg — ${e.status}`,
      section: 'daily-reports',
    }));

    // ===== 16. CROSS-REFERENCE: Lot number in factory daily records =====
    const factoryRecords = await db.factoryDailyRecord.findMany({
      where: { lot: { lotNo: { contains: q } } },
      take: 5, include: { factory: true, lot: true },
      orderBy: { recordDate: 'desc' },
    });
    factoryRecords.forEach(r => results.push({
      type: 'Factory Record', id: r.id,
      label: `${r.factory?.name || ''} — ${new Date(r.recordDate).toLocaleDateString()}`,
      sub: `Lot: ${r.lot?.lotNo || ''} — ${r.totalInputKg}kg in — ${r.totalAGradeKg}kg A-grade`,
      section: 'factory',
    }));

    // ===== 17. CROSS-REFERENCE: Lot in phase 2 jobs =====
    const phase2Jobs = await db.phase2Job.findMany({
      where: { lot: { lotNo: { contains: q } } },
      take: 5, include: { lot: true },
    });
    phase2Jobs.forEach(j => results.push({
      type: 'Phase 2 Job', id: j.id, label: `${j.jobId}`,
      sub: `Lot: ${j.lot?.lotNo || ''} — ${j.inputKg}kg → ${j.totalSizedKg}kg sized — ৳${Math.round(j.marginBdt).toLocaleString()} margin`,
      section: 'phase2',
    }));

    // ===== 18. CROSS-REFERENCE: Lot in distributions =====
    const distributions = await db.phase1Distribution.findMany({
      where: { lot: { lotNo: { contains: q } } },
      take: 5, include: { lot: true },
    });
    distributions.forEach(d => results.push({
      type: 'Distribution', id: d.id, label: `${d.handoffId}`,
      sub: `Lot: ${d.lot?.lotNo || ''} — ${d.fromName} → ${d.toName} — ${d.qtyKg}kg`,
      section: 'phase1',
    }));

    // ===== 19. GRADE DISPUTES =====
    const disputes = await db.gradeDispute.findMany({
      where: { OR: [{ reason: { contains: q } }, { workerId: { contains: q } }] },
      take: 10,
    });
    disputes.forEach(d => results.push({
      type: 'Grade Dispute', id: d.id, label: `Dispute — ${d.workerId || 'N/A'}`,
      sub: `${d.reason.slice(0, 60)} — ${d.status}`, section: 'grade-dispute',
    }));

    // ===== 20. AUDIT LOGS — search by performer =====
    const auditLogs = await db.auditLog.findMany({
      where: { OR: [{ performedBy: { contains: q } }, { entity: { contains: q } }] },
      take: 5, orderBy: { createdAt: 'desc' },
    });
    auditLogs.forEach(a => results.push({
      type: 'Audit Log', id: a.id, label: `${a.action} — ${a.entity}`,
      sub: `By: ${a.performedBy || 'system'} — ${new Date(a.createdAt).toLocaleString()}`, section: 'audit-log',
    }));

    // Sort by relevance (exact matches first) and deduplicate
    const unique = results.filter((r, i, arr) => arr.findIndex(x => x.id === r.id && x.type === r.type) === i);

    return NextResponse.json({ results: unique.slice(0, 50) });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}