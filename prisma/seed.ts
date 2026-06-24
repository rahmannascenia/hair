import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ─── Constants ───────────────────────────────────────────────
const FX = 120;

// Size pricing master lookup: lengthInch → bdtPerKg
const SIZE_RATES: Record<number, number> = {
  5: 500,
  6: 1200,
  8: 5000,
  10: 8000,
  12: 12000,
  14: 18000,
  16: 25000,
  18: 35000,
  20: 50000,
  24: 70000,
  30: 90000,
};

// Size pricing segments
const SIZE_SEGMENTS: Record<number, string> = {
  5: "Short \u2014 low-end",
  6: "Short",
  8: "Short-medium",
  10: "Medium",
  12: "Medium-long",
  14: "Long",
  16: "Long",
  18: "Long-premium",
  20: "Premium",
  24: "Premium",
  30: "Top-tier",
};

// ─── Import LC raw data ─────────────────────────────────────
interface ImportLC {
  lcNo: string;
  supplier: string;
  country: string;
  lotNo: string;
  qty: number;
  usdPerKg: number;
  colour: string;
  date: string;
  contact: string;
  phone: string;
}

const importLCs: ImportLC[] = [
  { lcNo: "LC-2026-001", supplier: "Rajesh Hair Exports", country: "India", lotNo: "LOT-20260412-01", qty: 500, usdPerKg: 35.0, colour: "#600", date: "2026-04-10", contact: "Rajesh Patel", phone: "+91-98765-43210" },
  { lcNo: "LC-2026-002", supplier: "Tashkent Hair Co", country: "Uzbekistan", lotNo: "LOT-20260425-02", qty: 350, usdPerKg: 22.0, colour: "#1B", date: "2026-04-22", contact: "Dilshod Karimov", phone: "+998-90-123-4567" },
  { lcNo: "LC-2026-003", supplier: "Tajik Raw Hair Ltd", country: "Tajikistan", lotNo: "LOT-20260503-03", qty: 280, usdPerKg: 18.5, colour: "Natural", date: "2026-05-01", contact: "Saidakbar Rahmonov", phone: "+992-91-234-5678" },
  { lcNo: "LC-2026-004", supplier: "Karachi Hair Traders", country: "Pakistan", lotNo: "LOT-20260518-04", qty: 420, usdPerKg: 28.0, colour: "#627", date: "2026-05-15", contact: "Imran Ahmed", phone: "+92-300-1234567" },
  { lcNo: "LC-2026-005", supplier: "Yangon Hair Suppliers", country: "Myanmar", lotNo: "LOT-20260602-05", qty: 300, usdPerKg: 15.0, colour: "#1B", date: "2026-05-30", contact: "Aung Myint", phone: "+95-9-123-456789" },
  { lcNo: "LC-2026-006", supplier: "Premium Hair Pvt Ltd", country: "India", lotNo: "LOT-20260615-06", qty: 200, usdPerKg: 95.0, colour: "#600", date: "2026-06-12", contact: "Vikram Sharma", phone: "+91-99876-54321" },
];

// ─── Local Purchase raw data ────────────────────────────────
interface LocalPurchase {
  voucherNo: string;
  supplier: string;
  region: string;
  lotNo: string;
  qty: number;
  costPerKgBdt: number;
  colour: string;
  date: string;
}

const localPurchases: LocalPurchase[] = [
  { voucherNo: "LPV-2026-001", supplier: "Karim Uddin", region: "Narayanganj", lotNo: "LOT-20260415-L01", qty: 80, costPerKgBdt: 1800, colour: "#600", date: "2026-04-13" },
  { voucherNo: "LPV-2026-002", supplier: "Salma Begum", region: "Gazipur", lotNo: "LOT-20260422-L02", qty: 60, costPerKgBdt: 2200, colour: "#627", date: "2026-04-20" },
  { voucherNo: "LPV-2026-003", supplier: "Rohim Collector", region: "Tangail", lotNo: "LOT-20260508-L03", qty: 95, costPerKgBdt: 1500, colour: "Natural", date: "2026-05-06" },
  { voucherNo: "LPV-2026-004", supplier: "Jahura Hair Agency", region: "Dhaka", lotNo: "LOT-20260520-L04", qty: 50, costPerKgBdt: 12000, colour: "#600", date: "2026-05-18" },
  { voucherNo: "LPV-2026-005", supplier: "Maa Shetu Traders", region: "Narayanganj", lotNo: "LOT-20260605-L05", qty: 110, costPerKgBdt: 2000, colour: "#627", date: "2026-06-03" },
];

// ─── Wash Log raw data ──────────────────────────────────────
interface WashRow {
  washId: string;
  date: string;
  lotNo: string;
  operator: string;
  inputKg: number;
  outputKg: number;
}

const washRows: WashRow[] = [
  { washId: "W-2026-001", date: "2026-04-15", lotNo: "LOT-20260412-01", operator: "Rina Begum", inputKg: 500, outputKg: 462 },
  { washId: "W-2026-002", date: "2026-04-26", lotNo: "LOT-20260425-02", operator: "Rina Begum", inputKg: 350, outputKg: 322 },
  { washId: "W-2026-003", date: "2026-05-04", lotNo: "LOT-20260503-03", operator: "Selina Akter", inputKg: 280, outputKg: 257 },
  { washId: "W-2026-004", date: "2026-05-19", lotNo: "LOT-20260518-04", operator: "Selina Akter", inputKg: 420, outputKg: 386 },
  { washId: "W-2026-005", date: "2026-06-03", lotNo: "LOT-20260602-05", operator: "Rina Begum", inputKg: 300, outputKg: 277 },
  { washId: "W-2026-006", date: "2026-06-16", lotNo: "LOT-20260615-06", operator: "Selina Akter", inputKg: 200, outputKg: 181 },
  { washId: "W-2026-007", date: "2026-06-18", lotNo: "LOT-20260422-L02", operator: "Rina Begum", inputKg: 60, outputKg: 55 },
  { washId: "W-2026-008", date: "2026-06-19", lotNo: "LOT-20260520-L04", operator: "Selina Akter", inputKg: 50, outputKg: 46 },
];

// ─── Buyer data ─────────────────────────────────────────────
const buyers = [
  { name: "African Bulk Co", country: "Nigeria" },
  { name: "US Wig Distributors", country: "USA" },
  { name: "EU Hair Boutique", country: "Germany" },
  { name: "China Trade Hub", country: "China" },
];

const buyerPricings: { buyerIdx: number; lengthInch: number; premiumPct: number }[] = [
  { buyerIdx: 0, lengthInch: 10, premiumPct: -0.30 },
  { buyerIdx: 0, lengthInch: 16, premiumPct: -0.20 },
  { buyerIdx: 1, lengthInch: 16, premiumPct: 0.15 },
  { buyerIdx: 1, lengthInch: 20, premiumPct: 0.20 },
  { buyerIdx: 2, lengthInch: 18, premiumPct: 0.10 },
  { buyerIdx: 3, lengthInch: 12, premiumPct: -0.10 },
];

// ─── Sales raw data ─────────────────────────────────────────
interface SaleRow {
  contractNo: string;
  date: string;
  buyerIdx: number;
  spec: string;
  lengthInch: number;
  qtyKg: number;
  usdPerKg: number;
}

const saleRows: SaleRow[] = [
  { contractNo: "EXP-2026-001", date: "2026-06-10", buyerIdx: 0, spec: "Color #600, 10\" weft", lengthInch: 10, qtyKg: 250, usdPerKg: 35.0 },
  { contractNo: "EXP-2026-002", date: "2026-06-12", buyerIdx: 1, spec: "Color #627, 16\" premium", lengthInch: 16, qtyKg: 80, usdPerKg: 120.0 },
  { contractNo: "EXP-2026-003", date: "2026-06-15", buyerIdx: 2, spec: "Natural, 18\" premium", lengthInch: 18, qtyKg: 60, usdPerKg: 95.0 },
  { contractNo: "EXP-2026-004", date: "2026-06-17", buyerIdx: 3, spec: "Color #1B, 12\" mid", lengthInch: 12, qtyKg: 200, usdPerKg: 42.0 },
  { contractNo: "EXP-2026-005", date: "2026-06-18", buyerIdx: 1, spec: "Color #600, 20\" premium", lengthInch: 20, qtyKg: 50, usdPerKg: 165.0 },
  { contractNo: "EXP-2026-006", date: "2026-06-19", buyerIdx: 0, spec: "Mixed, 8\" volume", lengthInch: 8, qtyKg: 350, usdPerKg: 18.0 },
  { contractNo: "EXP-2026-007", date: "2026-06-20", buyerIdx: 2, spec: "Color #627, 14\" long", lengthInch: 14, qtyKg: 70, usdPerKg: 85.0 },
  { contractNo: "EXP-2026-008", date: "2026-06-21", buyerIdx: 3, spec: "Natural, 10\" bulk", lengthInch: 10, qtyKg: 180, usdPerKg: 25.0 },
];

// ─── Phase 2 Job data ───────────────────────────────────────
interface Phase2Row {
  jobId: string;
  lotNo: string;
  date: string;
  inputKg: number;
  sizes: Record<number, number>; // lengthInch → kg
}

const phase2Rows: Phase2Row[] = [
  { jobId: "P2-001", lotNo: "LOT-20260412-01", date: "2026-06-15", inputKg: 250, sizes: { 5: 30, 8: 45, 10: 50, 12: 40, 14: 30, 16: 20, 18: 15, 20: 10, 24: 5, 30: 2 } },
  { jobId: "P2-002", lotNo: "LOT-20260425-02", date: "2026-06-17", inputKg: 180, sizes: { 5: 20, 8: 35, 10: 30, 12: 30, 14: 25, 16: 15, 18: 10, 20: 8, 24: 4, 30: 1 } },
  { jobId: "P2-003", lotNo: "LOT-20260503-03", date: "2026-06-19", inputKg: 200, sizes: { 5: 25, 8: 40, 10: 35, 12: 30, 14: 25, 16: 18, 18: 12, 20: 8, 24: 4, 30: 2 } },
  { jobId: "P2-004", lotNo: "LOT-20260518-04", date: "2026-06-20", inputKg: 300, sizes: { 5: 35, 8: 60, 10: 50, 12: 45, 14: 35, 16: 25, 18: 18, 20: 12, 24: 8, 30: 4 } },
  { jobId: "P2-005", lotNo: "LOT-20260602-05", date: "2026-06-21", inputKg: 220, sizes: { 5: 25, 8: 40, 10: 35, 12: 30, 14: 25, 16: 20, 18: 15, 20: 10, 24: 6, 30: 3 } },
];

// ─── Risks ──────────────────────────────────────────────────
const risks = [
  { riskId: "R-01", description: "Material theft during field distribution", category: "Operational", likelihood: 4, impact: 5, mitigation: "GPS-tagged bags, surprise audits", owner: "Store Keeper", status: "Open" },
  { riskId: "R-02", description: "Line Leader salary skimming", category: "Financial", likelihood: 3, impact: 5, mitigation: "Direct bKash disbursement", owner: "Accountant", status: "Open" },
  { riskId: "R-03", description: "Worker grade disputes", category: "Quality", likelihood: 4, impact: 3, mitigation: "Standardized grading rubric", owner: "QC Team", status: "Open" },
  { riskId: "R-04", description: "Inventory valuation errors across 8 buckets", category: "Financial", likelihood: 4, impact: 5, mitigation: "Automated real-time valuation", owner: "Accountant", status: "Open" },
  { riskId: "R-05", description: "Manual data entry errors", category: "Operational", likelihood: 5, impact: 4, mitigation: "Mobile app with validation", owner: "Production Manager", status: "Open" },
  { riskId: "R-06", description: "LC documentation errors", category: "Compliance", likelihood: 2, impact: 4, mitigation: "Pre-shipment document checklist", owner: "Accountant", status: "Mitigated" },
  { riskId: "R-07", description: "FX exposure on USD export sales", category: "Financial", likelihood: 4, impact: 4, mitigation: "Forward contracts, hedging", owner: "Owner/MD", status: "Open" },
  { riskId: "R-08", description: "Buyer-specific price list mismanagement", category: "Commercial", likelihood: 3, impact: 4, mitigation: "Centralized pricing engine", owner: "Owner/MD", status: "Open" },
  { riskId: "R-09", description: "Adhesive glue counterfeit", category: "Quality", likelihood: 2, impact: 5, mitigation: "Approved vendor list", owner: "Floor Manager", status: "Mitigated" },
  { riskId: "R-10", description: "Owner-centric approval bottleneck", category: "Governance", likelihood: 4, impact: 4, mitigation: "Delegation matrix with limits", owner: "Owner/MD", status: "Open" },
  { riskId: "R-11", description: "Worker attrition/turnover", category: "Workforce", likelihood: 3, impact: 3, mitigation: "Retention bonuses, better pay", owner: "HR", status: "Open" },
  { riskId: "R-12", description: "Factory A-grade below 60%", category: "Quality", likelihood: 3, impact: 3, mitigation: "Training programs, lot quality check", owner: "Production Manager", status: "Open" },
  { riskId: "R-13", description: "Lot-quality skew", category: "Quality", likelihood: 3, impact: 4, mitigation: "Pre-distribution lot grading", owner: "QC Team", status: "Open" },
  { riskId: "R-14", description: "Washing loss > 15%", category: "Operational", likelihood: 3, impact: 3, mitigation: "Process monitoring, chemical QC", owner: "Washing Lead", status: "Open" },
  { riskId: "R-15", description: "Hackling/combing loss > 15%", category: "Operational", likelihood: 3, impact: 3, mitigation: "Equipment maintenance, training", owner: "Floor Manager", status: "Open" },
  { riskId: "R-16", description: "Phase 1 distribution bottleneck", category: "Operational", likelihood: 2, impact: 4, mitigation: "Buffer stock at each tier", owner: "Production Manager", status: "Open" },
  { riskId: "R-17", description: "Buyer ethical-sourcing non-compliance", category: "Compliance", likelihood: 3, impact: 5, mitigation: "Certification and audit trail", owner: "Owner/MD", status: "Open" },
  { riskId: "R-18", description: "Internet connectivity gaps", category: "IT", likelihood: 4, impact: 2, mitigation: "Offline-capable mobile app", owner: "IT Lead", status: "Mitigated" },
];

// ─── Inventory Buckets ──────────────────────────────────────
const buckets = [
  { name: "Raw Material", weightKg: 500, valueBdt: 250000 },
  { name: "Washed Stock", weightKg: 850, valueBdt: 722500 },
  { name: "Distributed (Field)", weightKg: 420, valueBdt: 176400 },
  { name: "In-Factory (Home)", weightKg: 280, valueBdt: 78400 },
  { name: "Half-Finish Return", weightKg: 150, valueBdt: 22500 },
  { name: "In Final Production", weightKg: 95, valueBdt: 28500 },
  { name: "Finished Goods", weightKg: 70, valueBdt: 49000 },
  { name: "Reject / Wastage", weightKg: 35, valueBdt: 10500 },
];

// ─── Worker raw data per factory ────────────────────────────
// [workerId, name, bKash, aKg, bKg, cKg, wastageKg, daysPresent]
type WRow = [string, string, string, number, number, number, number, number];

// Factory 1: F-01 — 10 workers (A-grade target > 60%)
const f01Workers: WRow[] = [
  ["W-FAT-001", "Amina Begum",      "01721-100001", 2.1, 0.5, 0.2, 0.1, 30],
  ["W-FAT-002", "Rabeya Khatun",    "01721-100002", 2.0, 0.6, 0.2, 0.1, 30],
  ["W-FAT-003", "Nasima Akter",     "01721-100003", 2.2, 0.5, 0.2, 0.1, 29],
  ["W-FAT-004", "Halima Begum",     "01721-100004", 2.1, 0.4, 0.3, 0.1, 28],
  ["W-FAT-005", "Jahanara Akter",   "01721-100005", 2.0, 0.5, 0.3, 0.1, 30],
  ["W-FAT-006", "Salma Khatun",     "01721-100006", 1.9, 0.6, 0.3, 0.1, 27],
  ["W-FAT-007", "Asma Begum",       "01721-100007", 2.3, 0.4, 0.2, 0.1, 30],
  ["W-FAT-008", "Noorjahan Begum",  "01721-100008", 1.8, 0.7, 0.3, 0.1, 26],
  ["W-FAT-009", "Nazma Akter",      "01721-100009", 2.1, 0.5, 0.2, 0.1, 29],
  ["W-FAT-010", "Khaleda Begum",    "01721-100010", 2.2, 0.4, 0.2, 0.1, 30],
];

// Factory 2: F-02 — 10 workers (A-grade target > 60%)
const f02Workers: WRow[] = [
  ["W-JHO-001", "Morjina Begum",    "01721-200001", 2.0, 0.5, 0.2, 0.1, 30],
  ["W-JHO-002", "Sabina Khatun",    "01721-200002", 2.1, 0.4, 0.2, 0.1, 30],
  ["W-JHO-003", "Reshma Akter",     "01721-200003", 1.9, 0.6, 0.3, 0.1, 29],
  ["W-JHO-004", "Taslima Begum",    "01721-200004", 2.2, 0.4, 0.2, 0.1, 28],
  ["W-JHO-005", "Hamida Akter",     "01721-200005", 2.0, 0.5, 0.3, 0.1, 27],
  ["W-JHO-006", "Minara Begum",     "01721-200006", 2.1, 0.5, 0.2, 0.1, 30],
  ["W-JHO-007", "Rahima Khatun",    "01721-200007", 1.8, 0.7, 0.3, 0.1, 26],
  ["W-JHO-008", "Shahinur Akter",   "01721-200008", 2.3, 0.4, 0.2, 0.1, 30],
  ["W-JHO-009", "Asrafi Begum",     "01721-200009", 2.0, 0.5, 0.2, 0.1, 29],
  ["W-JHO-010", "Kulsum Begum",     "01721-200010", 2.1, 0.4, 0.3, 0.1, 30],
];

// Factory 3: F-03 — 10 workers (A-grade target > 60%)
const f03Workers: WRow[] = [
  ["W-RAS-001", "Hosne Ara",        "01721-300001", 2.0, 0.5, 0.2, 0.1, 30],
  ["W-RAS-002", "Rokhsana Begum",   "01721-300002", 2.1, 0.5, 0.2, 0.1, 29],
  ["W-RAS-003", "Sayeda Khatun",    "01721-300003", 1.9, 0.6, 0.2, 0.1, 28],
  ["W-RAS-004", "Farida Akter",     "01721-300004", 2.2, 0.4, 0.2, 0.1, 30],
  ["W-RAS-005", "Najma Begum",      "01721-300005", 2.0, 0.5, 0.3, 0.1, 27],
  ["W-RAS-006", "Ayesha Khatun",    "01721-300006", 2.1, 0.4, 0.2, 0.1, 30],
  ["W-RAS-007", "Shirin Begum",     "01721-300007", 1.8, 0.7, 0.3, 0.1, 26],
  ["W-RAS-008", "Tahmina Akter",    "01721-300008", 2.3, 0.4, 0.2, 0.1, 30],
  ["W-RAS-009", "Kulsum Akter",     "01721-300009", 2.0, 0.5, 0.2, 0.1, 29],
  ["W-RAS-010", "Momena Begum",     "01721-300010", 2.1, 0.4, 0.2, 0.1, 30],
];

// Factory 4: F-04 — 8 workers (A-grade target < 60%)
const f04Workers: WRow[] = [
  ["W-SEL-001", "Rashida Begum",    "01721-400001", 1.3, 0.8, 0.5, 0.1, 30],
  ["W-SEL-002", "Jamila Khatun",    "01721-400002", 1.2, 0.9, 0.5, 0.1, 29],
  ["W-SEL-003", "Shilpi Akter",     "01721-400003", 1.4, 0.7, 0.4, 0.1, 28],
  ["W-SEL-004", "Dipali Begum",     "01721-400004", 1.1, 0.9, 0.6, 0.1, 27],
  ["W-SEL-005", "Ranjana Akter",    "01721-400005", 1.3, 0.8, 0.5, 0.1, 30],
  ["W-SEL-006", "Mitali Begum",     "01721-400006", 1.2, 0.8, 0.6, 0.1, 26],
  ["W-SEL-007", "Sumaiya Khatun",   "01721-400007", 1.5, 0.7, 0.3, 0.1, 30],
  ["W-SEL-008", "Tanjila Akter",    "01721-400008", 1.5, 0.7, 0.3, 0.1, 29],
];

// Factory 5: F-05 — 9 workers (A-grade target > 60%)
const f05Workers: WRow[] = [
  ["W-KOH-001", "Nargis Begum",     "01721-500001", 2.1, 0.5, 0.2, 0.1, 30],
  ["W-KOH-002", "Aklima Khatun",    "01721-500002", 2.0, 0.5, 0.3, 0.1, 29],
  ["W-KOH-003", "Parvin Akter",     "01721-500003", 2.2, 0.4, 0.2, 0.1, 28],
  ["W-KOH-004", "Nasreen Begum",    "01721-500004", 1.9, 0.6, 0.3, 0.1, 27],
  ["W-KOH-005", "Asia Khatun",      "01721-500005", 2.1, 0.4, 0.2, 0.1, 30],
  ["W-KOH-006", "Lutfunnesa Begum", "01721-500006", 2.0, 0.5, 0.2, 0.1, 26],
  ["W-KOH-007", "Rafia Akter",      "01721-500007", 2.3, 0.4, 0.2, 0.1, 30],
  ["W-KOH-008", "Sadiya Khatun",    "01721-500008", 2.1, 0.5, 0.2, 0.1, 29],
  ["W-KOH-009", "Rehana Begum",     "01721-500009", 2.2, 0.4, 0.2, 0.1, 30],
];

// ─── Phase 1 Distribution raw data ──────────────────────────
interface DistRow {
  handoffId: string;
  date: string;
  fromRole: string;
  fromName: string;
  toRole: string;
  toName: string;
  lotNo: string;
  qtyKg: number;
  tierMultiplier: number;
}

const distRows: DistRow[] = [
  { handoffId: "H-001", date: "2026-06-01", fromRole: "PM Office", fromName: "Procurement Manager", toRole: "Head Leader", toName: "GH-01 North", lotNo: "LOT-20260412-01", qtyKg: 250, tierMultiplier: 5 },
  { handoffId: "H-002", date: "2026-06-01", fromRole: "PM Office", fromName: "Procurement Manager", toRole: "Head Leader", toName: "GH-02 South", lotNo: "LOT-20260412-01", qtyKg: 250, tierMultiplier: 5 },
  { handoffId: "H-003", date: "2026-06-03", fromRole: "Head Leader", fromName: "GH-01 North", toRole: "Line Leader", toName: "L-03", lotNo: "LOT-20260412-01", qtyKg: 25, tierMultiplier: 10 },
  { handoffId: "H-004", date: "2026-06-03", fromRole: "Head Leader", fromName: "GH-02 South", toRole: "Line Leader", toName: "L-07", lotNo: "LOT-20260412-01", qtyKg: 25, tierMultiplier: 10 },
  { handoffId: "H-005", date: "2026-06-05", fromRole: "Line Leader", fromName: "L-03", toRole: "Supervisor", toName: "S-22", lotNo: "LOT-20260412-01", qtyKg: 3, tierMultiplier: 10 },
  { handoffId: "H-006", date: "2026-06-05", fromRole: "Line Leader", fromName: "L-07", toRole: "Supervisor", toName: "S-45", lotNo: "LOT-20260412-01", qtyKg: 3, tierMultiplier: 10 },
  { handoffId: "H-007", date: "2026-06-07", fromRole: "Supervisor", fromName: "S-22", toRole: "Worker", toName: "W-FAT-001", lotNo: "LOT-20260412-01", qtyKg: 0.3, tierMultiplier: 10 },
  { handoffId: "H-008", date: "2026-06-07", fromRole: "Supervisor", fromName: "S-22", toRole: "Worker", toName: "W-JHO-002", lotNo: "LOT-20260412-01", qtyKg: 0.25, tierMultiplier: 10 },
  { handoffId: "H-009", date: "2026-06-02", fromRole: "PM Office", fromName: "Procurement Manager", toRole: "Head Leader", toName: "GH-01 North", lotNo: "LOT-20260425-02", qtyKg: 200, tierMultiplier: 5 },
  { handoffId: "H-010", date: "2026-06-04", fromRole: "Head Leader", fromName: "GH-01 North", toRole: "Line Leader", toName: "L-12", lotNo: "LOT-20260425-02", qtyKg: 20, tierMultiplier: 10 },
  { handoffId: "H-011", date: "2026-06-06", fromRole: "Line Leader", fromName: "L-12", toRole: "Supervisor", toName: "S-78", lotNo: "LOT-20260425-02", qtyKg: 2.5, tierMultiplier: 10 },
  { handoffId: "H-012", date: "2026-06-08", fromRole: "Supervisor", fromName: "S-78", toRole: "Worker", toName: "W-Rashida-045", lotNo: "LOT-20260425-02", qtyKg: 0.25, tierMultiplier: 10 },
];

// ═══════════════════════════════════════════════════════════════
async function main() {
  // ═══════════════════════════════════════════════════════════
  // SECTION 1: DELETE ALL (child tables first)
  // ═══════════════════════════════════════════════════════════
  await db.workerDailyEntry.deleteMany();
  await db.factoryDailyRecord.deleteMany();
  await db.worker.deleteMany();
  await db.factory.deleteMany();
  await db.lineLeader.deleteMany();
  await db.headLeader.deleteMany();
  await db.phase2Job.deleteMany();
  await db.phase1Distribution.deleteMany();
  await db.washLog.deleteMany();
  await db.lot.deleteMany();
  await db.procurement.deleteMany();
  await db.supplier.deleteMany();
  await db.sale.deleteMany();
  await db.buyerPricing.deleteMany();
  await db.buyer.deleteMany();
  await db.sizePricing.deleteMany();
  await db.risk.deleteMany();
  await db.inventoryBucket.deleteMany();
  await db.settings.deleteMany();

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: SETTINGS
  // ═══════════════════════════════════════════════════════════
  await db.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      fxUsdBdt: 120.0,
      rateA: 500,
      rateB: 400,
      rateC: 300,
      perfThreshold: 0.90,
      perfBonus: 300,
      attDays: 30,
      attBonus: 200,
      supMin: 100,
      supMax: 400,
      supExtra: 150,
      factoryAMin: 0.60,
      washTol: 0.15,
      hackTol: 0.15,
      costPerKgTgt: 320,
      autoCGrams: 50,
      turnoverTgt: 5,
    },
  });
  console.log("  Settings seeded");

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: SIZE PRICING (11 entries)
  // ═══════════════════════════════════════════════════════════
  const sizeLengths = [5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30];
  await db.sizePricing.createMany({
    data: sizeLengths.map((len) => {
      const bdt = SIZE_RATES[len];
      return {
        lengthInch: len,
        bdtPerKg: bdt,
        usdPerKg: parseFloat((bdt / FX).toFixed(4)),
        marketSegment: SIZE_SEGMENTS[len],
        minMarginBdt: parseFloat((bdt * 0.25).toFixed(2)),
        minMarginPct: 0.25,
      };
    }),
  });
  console.log("  Size pricing seeded (11 entries)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: SUPPLIERS
  // ═══════════════════════════════════════════════════════════
  // Create 6 import suppliers
  const importSuppliers = await Promise.all(
    importLCs.map((lc) =>
      db.supplier.create({
        data: {
          name: lc.supplier,
          country: lc.country,
          contact: lc.contact,
          phone: lc.phone,
          isLocal: false,
        },
      })
    )
  );

  // Create 5 local suppliers
  const localSuppliers = await Promise.all(
    localPurchases.map((lp) =>
      db.supplier.create({
        data: {
          name: lp.supplier,
          country: lp.region,
          isLocal: true,
        },
      })
    )
  );
  console.log("  Suppliers seeded (11 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: PROCUREMENTS
  // ═══════════════════════════════════════════════════════════

  // 6 Import LCs — compute all landed costs
  const importProcurements = await Promise.all(
    importLCs.map((lc, i) => {
      const goodsUsd = lc.qty * lc.usdPerKg;
      const freightUsd = goodsUsd * 0.03;
      const dutyUsd = goodsUsd * 0.12;
      const bankChargesUsd = goodsUsd * 0.01;
      const landedUsd = goodsUsd + freightUsd + dutyUsd + bankChargesUsd;
      const totalLandedCostBdt = landedUsd * FX;
      const landedCostPerKgBdt = totalLandedCostBdt / lc.qty;

      return db.procurement.create({
        data: {
          voucherNo: lc.lcNo,
          date: new Date(lc.date),
          supplierId: importSuppliers[i].id,
          originCountry: lc.country,
          rawWeightKg: lc.qty,
          usdPerKg: lc.usdPerKg,
          costPerKgBdt: lc.usdPerKg * FX,
          goodsUsd,
          freightUsd,
          dutyUsd,
          bankChargesUsd,
          landedUsd,
          totalLandedCostBdt,
          landedCostPerKgBdt,
          lcNo: lc.lcNo,
          paymentMode: "LC",
          fxRate: FX,
          status: "Received",
        },
      });
    })
  );

  // 5 Local Purchases
  const localProcurements = await Promise.all(
    localPurchases.map((lp, i) => {
      const totalLandedCostBdt = lp.qty * lp.costPerKgBdt;
      return db.procurement.create({
        data: {
          voucherNo: lp.voucherNo,
          date: new Date(lp.date),
          supplierId: localSuppliers[i].id,
          originCountry: "Bangladesh",
          rawWeightKg: lp.qty,
          usdPerKg: 0,
          costPerKgBdt: lp.costPerKgBdt,
          goodsUsd: 0,
          freightUsd: 0,
          dutyUsd: 0,
          bankChargesUsd: 0,
          landedUsd: 0,
          totalLandedCostBdt,
          landedCostPerKgBdt: lp.costPerKgBdt,
          paymentMode: "Cash",
          fxRate: FX,
          status: "Received",
          notes: `Local purchase from ${lp.region}`,
        },
      });
    })
  );
  console.log("  Procurements seeded (11 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: LOTS (11 total)
  // ═══════════════════════════════════════════════════════════

  // Determine which lots have wash logs
  const washedLotNos = new Set(washRows.map((w) => w.lotNo));

  // 6 Import lots
  const importLots = await Promise.all(
    importLCs.map((lc, i) => {
      const p = importProcurements[i];
      return db.lot.create({
        data: {
          lotNo: lc.lotNo,
          procurementId: p.id,
          colour: lc.colour,
          rawWeightKg: lc.qty,
          landedCostPerKg: p.landedCostPerKgBdt,
          totalLandedCost: p.totalLandedCostBdt,
          washStatus: washedLotNos.has(lc.lotNo) ? "Done" : "Pending",
          status: "Active",
        },
      });
    })
  );

  // 5 Local lots
  const localLots = await Promise.all(
    localPurchases.map((lp, i) => {
      const p = localProcurements[i];
      return db.lot.create({
        data: {
          lotNo: lp.lotNo,
          procurementId: p.id,
          colour: lp.colour,
          rawWeightKg: lp.qty,
          landedCostPerKg: p.landedCostPerKgBdt,
          totalLandedCost: p.totalLandedCostBdt,
          washStatus: washedLotNos.has(lp.lotNo) ? "Done" : "Pending",
          status: "Active",
        },
      });
    })
  );

  // Map lotNo → lot for lookups
  const lotMap = new Map<string, string>();
  [...importLots, ...localLots].forEach((lot) => lotMap.set(lot.lotNo, lot.id));
  console.log("  Lots seeded (11 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: WASH LOGS (8)
  // ═══════════════════════════════════════════════════════════
  await db.washLog.createMany({
    data: washRows.map((w) => {
      const wastageKg = w.inputKg - w.outputKg;
      const wastagePct = wastageKg / w.inputKg;
      const chemicalsBdt = Math.round(w.inputKg * 12);
      const labourBdt = Math.round(w.inputKg * 8);
      const costPerKgOut = (chemicalsBdt + labourBdt) / w.outputKg;
      return {
        washId: w.washId,
        lotId: lotMap.get(w.lotNo)!,
        washDate: new Date(w.date),
        operator: w.operator,
        inputKg: w.inputKg,
        outputKg: w.outputKg,
        wastageKg,
        wastagePct,
        chemicalsBdt,
        labourBdt,
        costPerKgOut: parseFloat(costPerKgOut.toFixed(2)),
        status: wastagePct > 0.15 ? "INVESTIGATE" : "OK",
      };
    }),
  });
  console.log("  Wash logs seeded (8 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 8: BUYERS (4)
  // ═══════════════════════════════════════════════════════════
  const buyerRecords = await Promise.all(
    buyers.map((b) => db.buyer.create({ data: b }))
  );
  console.log("  Buyers seeded (4 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 9: BUYER PRICINGS (6)
  // ═══════════════════════════════════════════════════════════
  await db.buyerPricing.createMany({
    data: buyerPricings.map((bp) => ({
      buyerId: buyerRecords[bp.buyerIdx].id,
      lengthInch: bp.lengthInch,
      premiumPct: bp.premiumPct,
    })),
  });
  console.log("  Buyer pricings seeded (6 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 10: SALES (8) — computed values
  // ═══════════════════════════════════════════════════════════
  await db.sale.createMany({
    data: saleRows.map((s) => {
      const usdValue = s.qtyKg * s.usdPerKg;
      const bdtValue = usdValue * FX;
      const costPerKgBdt = SIZE_RATES[s.lengthInch];
      const totalCostBdt = costPerKgBdt * s.qtyKg;
      const bdtPerKgEffective = bdtValue / s.qtyKg;
      const marginPerKgBdt = bdtPerKgEffective - costPerKgBdt;
      const totalMarginBdt = bdtValue - totalCostBdt;
      const marginPct = marginPerKgBdt / bdtPerKgEffective;
      return {
        contractNo: s.contractNo,
        contractDate: new Date(s.date),
        buyerId: buyerRecords[s.buyerIdx].id,
        productSpec: s.spec,
        lengthInch: s.lengthInch,
        qtyKg: s.qtyKg,
        usdPerKg: s.usdPerKg,
        usdValue,
        bdtValue,
        costPerKgBdt,
        totalCostBdt,
        marginPerKgBdt: parseFloat(marginPerKgBdt.toFixed(2)),
        totalMarginBdt: parseFloat(totalMarginBdt.toFixed(2)),
        marginPct: parseFloat(marginPct.toFixed(6)),
        status: marginPct > 0.20 ? "Healthy" : "Review",
      };
    }),
  });
  console.log("  Sales seeded (8 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 11: ORGANIZATION
  // ═══════════════════════════════════════════════════════════

  // Head Leaders (2)
  const headLeaders = await Promise.all([
    db.headLeader.create({ data: { name: "Abdul Karim", phone: "01711-900001", region: "Dinajpur" } }),
    db.headLeader.create({ data: { name: "Mohammad Ali", phone: "01711-900002", region: "Naogaon" } }),
  ]);

  // Line Leaders (5)
  const lineLeaderData = [
    { name: "Jamil Hossain", phone: "01711-800001", bKash: "01711-800001", headIdx: 0 },
    { name: "Kamal Uddin", phone: "01711-800002", bKash: "01711-800002", headIdx: 0 },
    { name: "Rafiq Islam", phone: "01711-800003", bKash: "01711-800003", headIdx: 0 },
    { name: "Shahidul Islam", phone: "01711-800004", bKash: "01711-800004", headIdx: 1 },
    { name: "Mizanur Rahman", phone: "01711-800005", bKash: "01711-800005", headIdx: 1 },
  ];
  const lineLeaders = await Promise.all(
    lineLeaderData.map((ll) =>
      db.lineLeader.create({
        data: {
          name: ll.name,
          phone: ll.phone,
          bKash: ll.bKash,
          headLeaderId: headLeaders[ll.headIdx].id,
        },
      })
    )
  );
  console.log("  Organization seeded (2 HL, 5 LL)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 12: FACTORIES (5)
  // ═══════════════════════════════════════════════════════════
  const factoryDefs = [
    { factoryId: "F-01", name: "F-01 Fatema", supervisor: "Fatema Khatun", bkash: "01711-100001", location: "Dinajpur-Chirirbandar", llIdx: 0, gh: "GH-01", fuel: 200, transport: 150, lotNo: "LOT-20260412-01" },
    { factoryId: "F-02", name: "F-02 Jhorna", supervisor: "Jhorna Akter", bkash: "01711-100002", location: "Dinajpur-Phulbari", llIdx: 1, gh: "GH-01", fuel: 200, transport: 150, lotNo: "LOT-20260425-02" },
    { factoryId: "F-03", name: "F-03 Rashida", supervisor: "Rashida Begum", bkash: "01711-100003", location: "Dinajpur-Birampur", llIdx: 2, gh: "GH-01", fuel: 200, transport: 150, lotNo: "LOT-20260503-03" },
    { factoryId: "F-04", name: "F-04 Selina", supervisor: "Selina Akter", bkash: "01711-100004", location: "Naogaon-Manda", llIdx: 3, gh: "GH-02", fuel: 220, transport: 180, lotNo: "LOT-20260518-04" },
    { factoryId: "F-05", name: "F-05 Kohinoor", supervisor: "Kohinoor Akter", bkash: "01711-100005", location: "Dinajpur-Ghoraghat", llIdx: 4, gh: "GH-02", fuel: 200, transport: 150, lotNo: "LOT-20260602-05" },
  ];

  const factories = await Promise.all(
    factoryDefs.map((f) =>
      db.factory.create({
        data: {
          factoryId: f.factoryId,
          name: f.name,
          supervisorName: f.supervisor,
          supervisorBkash: f.bkash,
          location: f.location,
          fuelBdt: f.fuel,
          transportBdt: f.transport,
          lineLeaderId: lineLeaders[f.llIdx].id,
          groupHead: f.gh,
        },
      })
    )
  );
  console.log("  Factories seeded (5 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 13: WORKERS (47 total)
  // ═══════════════════════════════════════════════════════════
  const allFactoryWorkers = [f01Workers, f02Workers, f03Workers, f04Workers, f05Workers];

  // Create all workers, grouped by factory
  const workerIdMap = new Map<string, string>(); // workerId → db id
  for (let fi = 0; fi < factories.length; fi++) {
    const rows = allFactoryWorkers[fi];
    for (const w of rows) {
      const created = await db.worker.create({
        data: {
          workerId: w[0],
          name: w[1],
          bKash: w[2],
          factoryId: factories[fi].id,
        },
      });
      workerIdMap.set(w[0], created.id);
    }
  }
  console.log(`  Workers seeded (47 total)`);

  // ═══════════════════════════════════════════════════════════
  // SECTION 14: FACTORY DAILY RECORDS + WORKER DAILY ENTRIES
  // ═══════════════════════════════════════════════════════════
  const RECORD_DATE = new Date("2026-06-21");

  for (let fi = 0; fi < factories.length; fi++) {
    const rows = allFactoryWorkers[fi];
    const lotNo = factoryDefs[fi].lotNo;
    const lotId = lotMap.get(lotNo)!;

    // Compute aggregates from worker data
    let totalInputKg = 0;
    let totalAGradeKg = 0;
    let totalBGradeKg = 0;
    let totalCGradeKg = 0;
    let totalWastageKg = 0;
    let totalPayrollBdt = 0;

    const entriesData = rows.map((w) => {
      const [workerId, , , a, b, c, wastage, days] = w;
      const input = a + b + c + wastage;
      const baseWage = a * 500 + b * 400 + c * 300;
      const attendanceBonus = days >= 30 ? 200 : days >= 28 ? 100 : 0;
      const totalPayable = baseWage + attendanceBonus;

      totalInputKg += input;
      totalAGradeKg += a;
      totalBGradeKg += b;
      totalCGradeKg += c;
      totalWastageKg += wastage;
      totalPayrollBdt += totalPayable;

      return {
        workerId: workerIdMap.get(workerId)!,
        inputGivenKg: input,
        aWeightKg: a,
        bWeightKg: b,
        cWeightKg: c,
        wastageKg: wastage,
        balanceStatus: "OK" as const,
        daysPresent: days,
        baseWage,
        attendanceBonus,
        totalPayable,
        status: "Pending Approval" as const,
      };
    });

    // Record-level computations
    const totalABC = totalAGradeKg + totalBGradeKg + totalCGradeKg;
    const aGradePct = totalABC > 0 ? totalAGradeKg / totalABC : 0;
    const hostingAllowance = aGradePct >= 0.60 ? 400 : 100;
    const perfBonus = aGradePct >= 0.60 ? 150 : 0;
    const totalSupPay = hostingAllowance + perfBonus;
    const grandTotalBdt = totalPayrollBdt + totalSupPay;
    // wipStatus: all input = output(A+B+C) + wastage → COMPLETED
    const outputKg = totalAGradeKg + totalBGradeKg + totalCGradeKg;
    const wipStatus = Math.abs(totalInputKg - (outputKg + totalWastageKg)) < 0.0001 ? "COMPLETED" : "IN PROGRESS";

    // Create the daily record
    const record = await db.factoryDailyRecord.create({
      data: {
        recordDate: RECORD_DATE,
        factoryId: factories[fi].id,
        lotId,
        hostingAllowance,
        perfBonus,
        totalSupPay,
        totalInputKg,
        totalAGradeKg,
        totalBGradeKg,
        totalCGradeKg,
        totalWastageKg,
        totalPayrollBdt,
        grandTotalBdt,
        wipStatus,
      },
    });

    // Create worker daily entries
    await db.workerDailyEntry.createMany({
      data: entriesData.map((e) => ({
        recordId: record.id,
        workerId: e.workerId,
        inputGivenKg: e.inputGivenKg,
        aWeightKg: e.aWeightKg,
        bWeightKg: e.bWeightKg,
        cWeightKg: e.cWeightKg,
        wastageKg: e.wastageKg,
        balanceStatus: e.balanceStatus,
        daysPresent: e.daysPresent,
        baseWage: e.baseWage,
        attendanceBonus: e.attendanceBonus,
        totalPayable: e.totalPayable,
        status: e.status,
      })),
    });

    console.log(
      `  Factory ${factoryDefs[fi].factoryId}: ${rows.length} workers, A-grade=${(aGradePct * 100).toFixed(1)}%, wip=${wipStatus}, payroll=${totalPayrollBdt}, supPay=${totalSupPay}, grand=${grandTotalBdt}`
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION 15: PHASE 1 DISTRIBUTIONS (12)
  // ═══════════════════════════════════════════════════════════

  // Compute cumulative kg per lot (running sum)
  const cumulativeByLot = new Map<string, number>();
  await db.phase1Distribution.createMany({
    data: distRows.map((d) => {
      const prev = cumulativeByLot.get(d.lotNo) || 0;
      const cumulative = parseFloat((prev + d.qtyKg).toFixed(4));
      cumulativeByLot.set(d.lotNo, cumulative);
      return {
        handoffId: d.handoffId,
        date: new Date(d.date),
        fromRole: d.fromRole,
        fromName: d.fromName,
        toRole: d.toRole,
        toName: d.toName,
        lotId: lotMap.get(d.lotNo)!,
        qtyKg: d.qtyKg,
        cumulativeKg: cumulative,
        tierMultiplier: d.tierMultiplier,
        status: d.qtyKg > 0 ? "OK" : "CHECK",
      };
    }),
  });
  console.log("  Phase 1 distributions seeded (12 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 16: PHASE 2 JOBS (5) — computed values
  // ═══════════════════════════════════════════════════════════
  await db.phase2Job.createMany({
    data: phase2Rows.map((j) => {
      const sizeEntries = Object.entries(j.sizes).map(([len, kg]) => ({
        length: parseInt(len),
        kg: kg as number,
      }));

      const totalSizedKg = sizeEntries.reduce((sum, s) => sum + s.kg, 0);
      const combingLossKg = j.inputKg - totalSizedKg;
      const lossPct = combingLossKg / j.inputKg;

      // Realisable value = Σ(size_kg × sizeRate)
      const realisableValueBdt = sizeEntries.reduce(
        (sum, s) => sum + s.kg * (SIZE_RATES[s.length] || 0),
        0
      );

      const costBdt = j.inputKg * 4000;
      const marginBdt = realisableValueBdt - costBdt;

      return {
        jobId: j.jobId,
        lotId: lotMap.get(j.lotNo)!,
        date: new Date(j.date),
        inputKg: j.inputKg,
        size5Kg: j.sizes[5] || 0,
        size6Kg: j.sizes[6] || 0,
        size8Kg: j.sizes[8] || 0,
        size10Kg: j.sizes[10] || 0,
        size12Kg: j.sizes[12] || 0,
        size14Kg: j.sizes[14] || 0,
        size16Kg: j.sizes[16] || 0,
        size18Kg: j.sizes[18] || 0,
        size20Kg: j.sizes[20] || 0,
        size24Kg: j.sizes[24] || 0,
        size30Kg: j.sizes[30] || 0,
        totalSizedKg,
        combingLossKg: parseFloat(combingLossKg.toFixed(2)),
        lossPct: parseFloat(lossPct.toFixed(6)),
        realisableValueBdt,
        costBdt,
        marginBdt,
      };
    }),
  });
  console.log("  Phase 2 jobs seeded (5 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 17: RISKS (18)
  // ═══════════════════════════════════════════════════════════
  await db.risk.createMany({
    data: risks.map((r) => ({
      riskId: r.riskId,
      description: r.description,
      category: r.category,
      likelihood: r.likelihood,
      impact: r.impact,
      riskScore: r.likelihood * r.impact,
      mitigation: r.mitigation,
      owner: r.owner,
      status: r.status,
    })),
  });
  console.log("  Risks seeded (18 total)");

  // ═══════════════════════════════════════════════════════════
  // SECTION 18: INVENTORY BUCKETS (8)
  // ═══════════════════════════════════════════════════════════
  await db.inventoryBucket.createMany({
    data: buckets.map((b) => ({
      bucketName: b.name,
      weightKg: b.weightKg,
      valueBdt: b.valueBdt,
    })),
  });
  console.log("  Inventory buckets seeded (8 total)");

  // ═══════════════════════════════════════════════════════════
  console.log("\n  Seed complete.");
}

// ═══════════════════════════════════════════════════════════════
main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });