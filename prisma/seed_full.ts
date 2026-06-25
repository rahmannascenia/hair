import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// ===================== HELPERS =====================
const r = (min: number, max: number, dec = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(dec));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const d = (s: string) => new Date(s);

// ===================== DATA POOLS =====================
const bengaliNames = [
  'Fatema Begum','Jhorna Akter','Rashida Khatun','Ayesha Siddika','Nasreen Akter',
  'Momena Begum','Sharmin Sultana','Rehana Begum','Halima Khatun','Nurjahan Begum',
  'Roksana Akter','Asma Khatun','Shahida Begum','Jahanara Akter','Salma Begum',
  'Sabina Akter','Khaleda Begum','Zohra Khatun','Mominul Islam','Shafiqul Islam',
  'Abdul Karim','Mohammad Ali','Rahim Uddin','Karim Uddin','Jamil Hossain',
  'Kamal Hossain','Abdul Rahim','Habibur Rahman','Delwar Hossain','Shamsul Haque',
  'Nurul Islam','Mozammel Hossain','Abdul Hamid','Matiar Rahman','Jasim Uddin',
  'Bazlur Rahman','Mizanur Rahman','Anwar Hossain','Shah Alam','Enamul Haque',
  'Abdul Khalek','Farid Uddin','Nur Mohammad','Abdus Sattar','Mokbul Hossain',
  'Sirajul Islam','Abdul Gani','Zahurul Islam','Kafil Uddin','Motaleb Hossain',
  'Amir Hossain','Rafiqul Islam','Golam Mostofa','Abdul Bari','Jahangir Alam',
  'Abdur Rashid','Mokhlesur Rahman','Elias Hossain','Tofazzal Hossain','Khairul Islam',
  'Sheikh Farid','Habibullah','Nuruzzaman','Mohammad Faruq','Asadul Haque',
  'Tareq Mahmud','Shafiq Rahman','Imran Hossain','Riad Ahmed','Tanvir Alam',
  'Sakib Hasan','Mehedi Hasan','Arif Hossain','Sohel Rana','Mamun Mia',
  'Rafiq Mia','Jahid Hasan','Sumon Mia','Liton Mia','Raju Ahmed',
  'Nayem Hossain','Saddam Hossain','Masud Rana','Al Amin','Nazrul Islam',
  'Kawser Ahmed','Zahid Hasan','Firoz Ahmed','Selim Reza','Hanif Miah',
  'Shohag Hossain','Ripon Mia','Milon Hossain','Bappi Mia','Tipu Sultan',
  'Nasir Uddin','Sohel Ahmed','Maruf Hossain','Yasin Arafat','Shuvo Mia',
  'Pappu Mia','Kalu Miah','Chhoton Mia','Badal Mia','Babu Mia'
];

const washOperators = ['Abdul Wahab','Mohsin Miah','Nur Alam','Kamal Uddin','Rafiq Miah','Shamsu Miah','Halim Miah','Jabbar Miah'];
const factoryNames = [
  'Fatema Hair Works','Jhorna Enterprise','Rashida Factory','Ayesha Hair Processing',
  'Nasreen Hair Unit','Momena Works','Sharmin Enterprise','Rehana Hair Factory',
  'Halima Processing','Nurjahan Hair Works','Momena Hair Studio','Sharmin Hair Hub'
];
const factoryLocations = ['Tongi','Gazipur','Narayanganj','Savar','Demra','Keraniganj','Rupganj','Kaliganj','Kapasia','Kalindi','Dhamrai','Narsingdi'];
const factorySupervisors = ['Akbar Ali','Bakul Miah','Chhoton Das','Dilwar Hossain','Ekramul Haque','Faruq Ahmed','Golam Sarwar','Hannan Miah','Iqbal Hossain','Jalal Uddin','Kamal Miah','Latif Miah'];
const headLeaderData = [
  { name: 'Abdul Malek', region: 'Dhaka North', phone: '01711-123456' },
  { name: 'Mizanur Rahman', region: 'Dhaka South', phone: '01712-234567' },
  { name: 'Kamal Uddin Bhuiyan', region: 'Comilla', phone: '01713-345678' },
];
const lineLeaderData = [
  { name: 'Shafiqul Islam', phone: '01811-111111', bKash: '01811-111111', headIdx: 0 },
  { name: 'Jasim Uddin', phone: '01811-222222', bKash: '01811-222222', headIdx: 0 },
  { name: 'Delwar Hossain', phone: '01812-333333', bKash: '01812-333333', headIdx: 1 },
  { name: 'Nurul Islam', phone: '01812-444444', bKash: '01812-444444', headIdx: 1 },
  { name: 'Habibur Rahman', phone: '01813-555555', bKash: '01813-555555', headIdx: 2 },
  { name: 'Bazlur Rahman', phone: '01813-666666', bKash: '01813-666666', headIdx: 2 },
];

const supplierData = [
  { name: 'Tamil Nadu Hair Exports', country: 'India', contact: 'Rajesh Kumar', phone: '+91-98765-43210', isLocal: false, active: true },
  { name: 'Myanmar Hair Trading Co.', country: 'Myanmar', contact: 'Aung Kyaw', phone: '+95-9-123-456-789', isLocal: false, active: true },
  { name: 'Vietnam Virgin Hair Ltd.', country: 'Vietnam', contact: 'Nguyen Van Minh', phone: '+84-901-234-567', isLocal: false, active: true },
  { name: 'Phnom Penh Hair Supply', country: 'Cambodia', contact: 'Sokha Chea', phone: '+855-12-345-678', isLocal: false, active: false },
  { name: 'Guangzhou Hair Industries', country: 'China', contact: 'Li Wei', phone: '+86-139-1234-5678', isLocal: false, active: true },
  { name: 'Dhaka Hair Traders', country: 'Bangladesh', contact: 'Motiur Rahman', phone: '01911-100100', isLocal: true, active: true },
  { name: 'Chittagong Hair Supply', country: 'Bangladesh', contact: 'Alamgir Hossain', phone: '01912-200200', isLocal: true, active: true },
  { name: 'Sylhet Local Collection', country: 'Bangladesh', contact: 'Abdul Mumin', phone: '01913-300300', isLocal: true, active: true },
  { name: 'Rajshahi Hair Hub', country: 'Bangladesh', contact: 'Nazrul Islam', phone: '01914-400400', isLocal: true, active: false },
  { name: 'Khulna Hair Sources', country: 'Bangladesh', contact: 'Mizan Ali', phone: '01915-500500', isLocal: true, active: true },
  { name: 'Beijing Hair Products', country: 'China', contact: 'Zhang Wei', phone: '+86-138-8765-4321', isLocal: false, active: true },
  { name: 'Temple Hair India Pvt Ltd', country: 'India', contact: 'Priya Sharma', phone: '+91-99887-76655', isLocal: false, active: true },
  { name: 'Rangoon Hair Export', country: 'Myanmar', contact: 'Thiha Win', phone: '+95-9-987-654-321', isLocal: false, active: true },
  { name: 'Ho Chi Minh Hair Co.', country: 'Vietnam', contact: 'Tran Duc Anh', phone: '+84-912-345-678', isLocal: false, active: false },
  { name: 'Comilla Local Supply', country: 'Bangladesh', contact: 'Mokbul Hossain', phone: '01916-600600', isLocal: true, active: true },
  { name: 'Mymensingh Hair Traders', country: 'Bangladesh', contact: 'Abdul Halim', phone: '01917-700700', isLocal: true, active: true },
  { name: 'Barisal Hair Collection', country: 'Bangladesh', contact: 'Shahin Alam', phone: '01918-800800', isLocal: true, active: true },
  { name: 'Shenzhen Hair Factory', country: 'China', contact: 'Chen Jie', phone: '+86-137-5544-3322', isLocal: false, active: true },
  { name: 'Hyderabad Hair Exports', country: 'India', contact: 'Suresh Reddy', phone: '+91-96543-21098', isLocal: false, active: true },
  { name: 'Naypyidaw Hair Co.', country: 'Myanmar', contact: 'Myo Lwin', phone: '+95-9-876-543-210', isLocal: false, active: false },
];

const colours = ['#1B','#2','#4','#600','#1','#1B/613','#2/613','#4/30','#613','#99J','#350','#1B/350','#2/4','#4/27','#1B/99J'];

const buyerData = [
  { name: 'Shenzhen Hair Products Co.', country: 'China' },
  { name: 'Guangzhou Beauty Supply', country: 'China' },
  { name: 'New York Hair Extensions Inc.', country: 'USA' },
  { name: 'Los Angeles Beauty Corp', country: 'USA' },
  { name: 'Amsterdam Hair Trading BV', country: 'Netherlands' },
  { name: 'London Hair House Ltd', country: 'UK' },
  { name: 'Lagos Hair Emporium', country: 'Nigeria' },
  { name: 'Dubai Hair Trading LLC', country: 'UAE' },
  { name: 'Nairobi Beauty Supply', country: 'Kenya' },
  { name: 'Johannesburg Hair Co.', country: 'South Africa' },
];

async function main() {
  console.log('🧹 Clearing existing data...');

  // Delete in reverse dependency order
  await db.gradeDispute.deleteMany();
  await db.workerDailyEntry.deleteMany();
  await db.factoryDailyRecord.deleteMany();
  await db.phase2Job.deleteMany();
  await db.sale.deleteMany();
  await db.buyerPricing.deleteMany();
  await db.buyer.deleteMany();
  await db.sizePricing.deleteMany();
  await db.washLog.deleteMany();
  await db.phase1Distribution.deleteMany();
  await db.lCManagement.deleteMany();
  await db.lot.deleteMany();
  await db.procurement.deleteMany();
  await db.supplier.deleteMany();
  await db.worker.deleteMany();
  await db.factory.deleteMany();
  await db.lineLeader.deleteMany();
  await db.headLeader.deleteMany();
  await db.risk.deleteMany();
  await db.inventoryBucket.deleteMany();
  await db.consumable.deleteMany();
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();

  console.log('✅ All data cleared.');

  let total = 0;

  // ==================== 1. ORGANIZATION ====================
  console.log('📋 Creating organization hierarchy...');

  const headLeaders = [];
  for (const hl of headLeaderData) {
    const record = await db.headLeader.create({ data: hl });
    headLeaders.push(record);
    total++;
  }

  const lineLeaders = [];
  let llIdx = 0;
  for (const ll of lineLeaderData) {
    const record = await db.lineLeader.create({
      data: {
        name: ll.name,
        phone: ll.phone,
        bKash: ll.bKash,
        headLeaderId: headLeaders[ll.headIdx].id,
      },
    });
    lineLeaders.push(record);
    total++;
  }

  const factories = [];
  let factoryIdx = 0;
  for (let li = 0; li < lineLeaders.length; li++) {
    for (let f = 0; f < 2; f++) {
      const fIdx = factoryIdx++;
      const fid = `F-${String(fIdx + 1).padStart(2, '0')}`;
      const record = await db.factory.create({
        data: {
          factoryId: fid,
          name: factoryNames[fIdx],
          supervisorName: factorySupervisors[fIdx],
          supervisorBkash: `017${String(fIdx + 1).padStart(2, '0')}-${100000 + fIdx * 1111}`,
          location: factoryLocations[fIdx],
          fuelBdt: r(150, 350, 0),
          transportBdt: r(100, 250, 0),
          lineLeaderId: lineLeaders[li].id,
          groupHead: headLeaders[lineLeaderData[li].headIdx].name,
        },
      });
      factories.push(record);
      total++;
    }
  }

  // ==================== 2. WORKERS ====================
  console.log('👷 Creating workers...');

  const workers = [];
  let nameIdx = 0;
  for (let fi = 0; fi < factories.length; fi++) {
    const count = 8 + Math.floor(Math.random() * 5); // 8-12
    for (let w = 0; w < count; w++) {
      const wIdx = nameIdx++;
      if (wIdx >= bengaliNames.length) break;
      const wid = `W-${String(wIdx + 1).padStart(3, '0')}`;
      const record = await db.worker.create({
        data: {
          workerId: wid,
          name: bengaliNames[wIdx],
          bKash: `016${String(wIdx % 10)}-${1000000 + wIdx * 12345}`,
          factoryId: factories[fi].id,
        },
      });
      workers.push(record);
      total++;
    }
  }

  // ==================== 3. SUPPLIERS ====================
  console.log('🚚 Creating suppliers...');

  const suppliers = [];
  for (const s of supplierData) {
    const record = await db.supplier.create({
      data: {
        name: s.name,
        country: s.country,
        contact: s.contact,
        phone: s.phone,
        isLocal: s.isLocal,
        isActive: s.active,
      },
    });
    suppliers.push(record);
    total++;
  }

  // ==================== 4. PROCUREMENTS ====================
  console.log('📦 Creating procurements...');

  const procurements = [];
  for (let i = 0; i < 15; i++) {
    const sup = suppliers[i % suppliers.length];
    const rawKg = r(50, 200, 1);
    const usdPerKg = r(15, 45, 2);
    const fxRate = r(118, 125, 2);
    const goodsUsd = rawKg * usdPerKg;
    const freightUsd = r(200, 800, 2);
    const dutyUsd = r(100, 500, 2);
    const bankCharges = r(50, 200, 2);
    const landedUsd = goodsUsd + freightUsd + dutyUsd + bankCharges;
    const totalLandedBdt = landedUsd * fxRate;

    const record = await db.procurement.create({
      data: {
        voucherNo: `PRO-2026-${String(i + 1).padStart(4, '0')}`,
        date: d(`2026-0${3 + Math.floor(i / 5)}-${String(1 + (i % 28)).padStart(2, '0')}`),
        supplierId: sup.id,
        originCountry: sup.country,
        rawWeightKg: rawKg,
        usdPerKg,
        costPerKgBdt: usdPerKg * fxRate,
        goodsUsd,
        freightUsd,
        dutyUsd,
        bankChargesUsd: bankCharges,
        landedUsd,
        totalLandedCostBdt: totalLandedBdt,
        landedCostPerKgBdt: totalLandedBdt / rawKg,
        lcNo: `LC-${String(202600 + i).padStart(8, '0')}`,
        paymentMode: i % 3 === 0 ? 'LC' : i % 3 === 1 ? 'TT' : 'CAD',
        qualityGrade: pick(['A','A','A','B','B']),
        fxRate,
        status: pick(['Received','Received','Cleared','In Transit','Pending']),
        notes: `Procurement batch ${i + 1} from ${sup.name}`,
      },
    });
    procurements.push(record);
    total++;
  }

  // ==================== 5. LC MANAGEMENT ====================
  console.log('🏦 Creating LC management records...');

  const lcStatuses = ['Open','Open','Shipped','Shipped','Cleared','Cleared','Paid','Paid','Closed','Closed',
                       'Open','Shipped','Cleared','Paid','Closed'];
  const banks = ['Sonali Bank','Janata Bank','Agrani Bank','Rupali Bank','Pubali Bank','Dutch-Bangla Bank','BRAC Bank','IBBL','City Bank','EBL'];

  const lcRecords = [];
  for (let i = 0; i < 15; i++) {
    const p = procurements[i];
    const status = lcStatuses[i];
    const fxR = r(118, 125, 2);
    const usdAmt = p.goodsUsd + p.freightUsd + p.dutyUsd;
    const baseDate = d(`2026-0${3 + Math.floor(i / 5)}-${String(5 + i).padStart(2, '0')}`);

    const record = await db.lCManagement.create({
      data: {
        lcNo: `LC-2026-${String(i + 1).padStart(4, '0')}`,
        procurementId: p.id,
        lcDate: baseDate,
        bankName: banks[i % banks.length],
        usdAmount: usdAmt,
        bdtAmount: usdAmt * fxR,
        fxRate: fxR,
        status,
        shipmentDate: ['Shipped','Cleared','Paid','Closed'].includes(status) ? new Date(baseDate.getTime() + 7 * 86400000) : null,
        clearanceDate: ['Cleared','Paid','Closed'].includes(status) ? new Date(baseDate.getTime() + 14 * 86400000) : null,
        paymentDate: ['Paid','Closed'].includes(status) ? new Date(baseDate.getTime() + 21 * 86400000) : null,
        notes: `LC for procurement ${p.voucherNo}`,
      },
    });
    lcRecords.push(record);
    total++;
  }

  // ==================== 6. LOTS ====================
  console.log('🏷️ Creating lots...');

  const lotStages = ['Created','Washing','Washed','Distributed','InFactory','InFactory','HalfFinish','Finished','Wastage','Closed'];
  const lots = [];

  for (let i = 0; i < 20; i++) {
    const p = procurements[i % procurements.length];
    const rawKg = r(10, 30, 1);
    const landedPerKg = p.landedCostPerKgBdt || r(3500, 5500, 2);
    const lotNo = `LOT-20260401-${String(i + 1).padStart(2, '0')}`.replace('0401', `0${4 + Math.floor(i / 7)}${String(1 + (i % 28)).padStart(2, '0')}`);
    const stageIdx = Math.min(i, lotStages.length - 1);
    const stage = lotStages[stageIdx];

    const distKg = ['Distributed','InFactory','HalfFinish','Finished','Closed'].includes(stage) ? r(5, rawKg - 2, 1) : 0;
    const finKg = ['Finished','Closed'].includes(stage) ? r(3, distKg || rawKg - 3, 1) : 0;

    const record = await db.lot.create({
      data: {
        lotNo,
        procurementId: p.id,
        colour: colours[i % colours.length],
        rawWeightKg: rawKg,
        landedCostPerKg: landedPerKg,
        totalLandedCost: rawKg * landedPerKg,
        washStatus: ['Created','Washing','Washed','Distributed','InFactory','HalfFinish','Finished','Closed'].includes(stage) ? 'Done' : 'Pending',
        distributedKg: distKg,
        returnedKg: 0,
        finishedKg: finKg,
        status: stage === 'Wastage' ? 'Wastage' : stage === 'Closed' ? 'Closed' : 'Active',
      },
    });
    lots.push(record);
    total++;
  }

  // ==================== 7. WASH LOGS ====================
  console.log('🧴 Creating wash logs...');

  const washLots = lots.filter((_, i) => i < 15); // first 15 lots washed
  const washLogs = [];

  for (let i = 0; i < 15; i++) {
    const lot = washLots[i];
    const inputKg = lot.rawWeightKg;
    const wastagePct = r(0.10, 0.15, 3);
    const outputKg = Number((inputKg * (1 - wastagePct)).toFixed(2));
    const wastageKg = Number((inputKg - outputKg).toFixed(2));
    const chemicals = r(500, 2000, 0);
    const labour = r(800, 1500, 0);

    const record = await db.washLog.create({
      data: {
        washId: `WASH-${String(i + 1).padStart(4, '0')}`,
        lotId: lot.id,
        washDate: d(`2026-04-${String(1 + i).padStart(2, '0')}`),
        operator: pick(washOperators),
        inputKg,
        outputKg,
        wastageKg,
        wastagePct,
        chemicalsBdt: chemicals,
        labourBdt: labour,
        costPerKgOut: Number(((chemicals + labour) / outputKg).toFixed(2)),
        status: wastagePct > 0.14 ? 'High Loss' : 'OK',
      },
    });
    washLogs.push(record);
    total++;

    // Update lot wash status
    await db.lot.update({
      where: { id: lot.id },
      data: { washStatus: 'Done' },
    });
  }

  // ==================== 8. PHASE 1 DISTRIBUTIONS ====================
  console.log('🚛 Creating phase 1 distributions...');

  const distLots = lots.filter((_, i) => [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(i));
  const distributions = [];
  let cumKgMap: Record<string, number> = {};

  for (let i = 0; i < 25; i++) {
    const lot = distLots[i % distLots.length];
    const qty = r(2, 5, 1);
    cumKgMap[lot.id] = (cumKgMap[lot.id] || 0) + qty;

    const fromRoles = ['PM','PM','HeadLeader','HeadLeader','LineLeader'];
    const toRoles = ['HeadLeader','HeadLeader','LineLeader','LineLeader','Factory'];
    const ri = Math.floor(i / 5) % 5;

    const fromName = fromRoles[ri] === 'PM' ? 'Procurement Manager' :
                     fromRoles[ri] === 'HeadLeader' ? pick(headLeaders).name :
                     pick(lineLeaders).name;
    const toName = toRoles[ri] === 'HeadLeader' ? pick(headLeaders).name :
                   toRoles[ri] === 'LineLeader' ? pick(lineLeaders).name :
                   pick(factories).name;

    const record = await db.phase1Distribution.create({
      data: {
        handoffId: `HO-${String(i + 1).padStart(4, '0')}`,
        date: d(`2026-05-${String(1 + (i % 28)).padStart(2, '0')}`),
        fromRole: fromRoles[ri],
        fromName,
        toRole: toRoles[ri],
        toName,
        lotId: lot.id,
        qtyKg: qty,
        cumulativeKg: cumKgMap[lot.id],
        tierMultiplier: ri + 1,
        status: 'OK',
      },
    });
    distributions.push(record);
    total++;

    // Update lot distributed kg
    await db.lot.update({
      where: { id: lot.id },
      data: { distributedKg: cumKgMap[lot.id] },
    });
  }

  // ==================== 9. FACTORY DAILY RECORDS ====================
  console.log('🏭 Creating factory daily records...');

  const dates = ['2026-06-01','2026-06-03','2026-06-05','2026-06-08','2026-06-10','2026-06-13','2026-06-16','2026-06-19'];
  const factoryRecords = [];

  for (let fi = 0; fi < factories.length; fi++) {
    const isGoodFactory = fi % 3 === 0; // every 3rd factory is "good"
    for (let di = 0; di < dates.length; di++) {
      const lot = lots[(fi + di) % lots.length];
      const totalInput = r(2, 8, 1);
      const aPct = isGoodFactory ? r(0.60, 0.75, 2) : r(0.40, 0.60, 2);
      const bPct = isGoodFactory ? r(0.15, 0.25, 2) : r(0.20, 0.35, 2);
      const cPct = isGoodFactory ? r(0.03, 0.10, 2) : r(0.05, 0.15, 2);
      const aKg = totalInput * aPct;
      const bKg = totalInput * bPct;
      const cKg = totalInput * cPct;
      const wastageKg = totalInput - aKg - bKg - cKg;
      const payroll = r(3000, 8000, 0);
      const hosting = r(200, 500, 0);
      const perfB = isGoodFactory ? r(200, 500, 0) : r(0, 100, 0);

      const record = await db.factoryDailyRecord.create({
        data: {
          recordDate: d(dates[di]),
          factoryId: factories[fi].id,
          lotId: lot.id,
          hostingAllowance: hosting,
          perfBonus: perfB,
          totalSupPay: hosting + perfB,
          totalInputKg: totalInput,
          totalAGradeKg: aKg,
          totalBGradeKg: bKg,
          totalCGradeKg: cKg,
          totalWastageKg: wastageKg,
          totalPayrollBdt: payroll,
          grandTotalBdt: payroll + hosting + perfB,
          wipStatus: di === dates.length - 1 ? 'IN PROGRESS' : 'DONE',
        },
      });
      factoryRecords.push(record);
      total++;
    }
  }

  // ==================== 10. WORKER DAILY ENTRIES ====================
  console.log('📝 Creating worker daily entries...');

  const workerEntries = [];
  const statuses = ['Approved','Approved','Approved','Approved','Pending Approval','Pending Approval','Pending Approval'];
  let entryIdx = 0;

  for (let fi = 0; fi < factories.length; fi++) {
    const factoryWorkers = workers.filter(w => w.factoryId === factories[fi].id);
    const factoryFDRs = factoryRecords.filter(r => r.factoryId === factories[fi].id);

    for (const fdr of factoryFDRs) {
      const numWorkers = Math.min(factoryWorkers.length, 10);
      for (let wi = 0; wi < numWorkers; wi++) {
        const worker = factoryWorkers[wi];
        const inputG = r(200, 400, 0);
        const aG = r(50, 250, 0);
        const bG = r(20, 100, 0);
        const cG = r(0, 50, 0);
        const wastG = Math.max(0, inputG - aG - bG - cG);
        const baseWage = r(200, 400, 0);
        const attBonus = r(50, 200, 0);
        const totalPay = baseWage + attBonus;

        const record = await db.workerDailyEntry.create({
          data: {
            recordId: fdr.id,
            workerId: worker.id,
            inputGivenKg: inputG / 1000,
            aWeightKg: aG / 1000,
            bWeightKg: bG / 1000,
            cWeightKg: cG / 1000,
            wastageKg: wastG / 1000,
            balanceStatus: wastG / inputG > 0.2 ? 'Short' : 'OK',
            daysPresent: 1,
            baseWage,
            attendanceBonus: attBonus,
            totalPayable: totalPay,
            status: pick(statuses),
          },
        });
        workerEntries.push(record);
        total++;
        entryIdx++;
      }
    }
  }

  // ==================== 11. PHASE 2 JOBS ====================
  console.log('🔧 Creating phase 2 jobs...');

  const phase2Lots = lots.filter((_, i) => [6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(i));
  const phase2Jobs = [];

  for (let i = 0; i < 10; i++) {
    const lot = phase2Lots[i];
    const inputKg = lot.distributedKg > 0 ? lot.distributedKg * 0.7 : r(5, 15, 1);
    const lossPct = r(0.05, 0.12, 3);
    const totalSized = Number((inputKg * (1 - lossPct)).toFixed(2));
    const lossKg = Number((inputKg - totalSized).toFixed(2));

    // Distribute across sizes
    const sizeWeights: number[] = [];
    let remaining = totalSized;
    const sizeCount = 11;
    for (let s = 0; s < sizeCount - 1; s++) {
      const w = s === 0 ? r(0.05, 0.10, 3) : s < 3 ? r(0.05, 0.08, 3) : r(0.08, 0.15, 3);
      const wKg = Number((totalSized * w).toFixed(2));
      sizeWeights.push(wKg);
      remaining -= wKg;
    }
    sizeWeights.push(Number(Math.max(0, remaining).toFixed(2)));

    const costBdt = inputKg * (lot.landedCostPerKg || 4000);
    const rateMap: Record<number, number> = { 5: 500, 6: 800, 8: 2000, 10: 5000, 12: 10000, 14: 18000, 16: 28000, 18: 40000, 20: 55000, 24: 72000, 30: 90000 };
    const sizes = [5, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30];
    let realisableValue = 0;
    for (let s = 0; s < sizes.length; s++) {
      realisableValue += sizeWeights[s] * (rateMap[sizes[s]] || 5000);
    }

    const record = await db.phase2Job.create({
      data: {
        jobId: `P2-${String(i + 1).padStart(4, '0')}`,
        lotId: lot.id,
        date: d(`2026-06-${String(1 + i * 2).padStart(2, '0')}`),
        inputKg,
        size5Kg: sizeWeights[0],
        size6Kg: sizeWeights[1],
        size8Kg: sizeWeights[2],
        size10Kg: sizeWeights[3],
        size12Kg: sizeWeights[4],
        size14Kg: sizeWeights[5],
        size16Kg: sizeWeights[6],
        size18Kg: sizeWeights[7],
        size20Kg: sizeWeights[8],
        size24Kg: sizeWeights[9],
        size30Kg: sizeWeights[10],
        totalSizedKg: totalSized,
        combingLossKg: lossKg,
        lossPct,
        realisableValueBdt: realisableValue,
        costBdt,
        marginBdt: realisableValue - costBdt,
      },
    });
    phase2Jobs.push(record);
    total++;
  }

  // ==================== 12. BUYERS ====================
  console.log('💰 Creating buyers...');

  const buyerRecords = [];
  for (const b of buyerData) {
    const record = await db.buyer.create({
      data: {
        name: b.name,
        country: b.country,
      },
    });
    buyerRecords.push(record);
    total++;
  }

  // ==================== 13. SIZE PRICING ====================
  console.log('📏 Creating size pricing...');

  const sizePricingData = [
    { len: 5, bdt: 500, usd: 4.17, seg: 'Bulk/Short', margin: 150, marginPct: 30 },
    { len: 6, bdt: 800, usd: 6.67, seg: 'Bulk/Short', margin: 200, marginPct: 25 },
    { len: 8, bdt: 2000, usd: 16.67, seg: 'Mid-Range', margin: 500, marginPct: 25 },
    { len: 10, bdt: 5000, usd: 41.67, seg: 'Mid-Range', margin: 1200, marginPct: 24 },
    { len: 12, bdt: 10000, usd: 83.33, seg: 'Premium', margin: 2500, marginPct: 25 },
    { len: 14, bdt: 18000, usd: 150, seg: 'Premium', margin: 4500, marginPct: 25 },
    { len: 16, bdt: 28000, usd: 233.33, seg: 'Premium', margin: 7000, marginPct: 25 },
    { len: 18, bdt: 40000, usd: 333.33, seg: 'Luxury', margin: 10000, marginPct: 25 },
    { len: 20, bdt: 55000, usd: 458.33, seg: 'Luxury', margin: 13750, marginPct: 25 },
    { len: 24, bdt: 72000, usd: 600, seg: 'Luxury', margin: 18000, marginPct: 25 },
    { len: 30, bdt: 90000, usd: 750, seg: 'Ultra-Premium', margin: 22500, marginPct: 25 },
  ];

  for (const sp of sizePricingData) {
    await db.sizePricing.create({
      data: {
        lengthInch: sp.len,
        bdtPerKg: sp.bdt,
        usdPerKg: sp.usd,
        marketSegment: sp.seg,
        minMarginBdt: sp.margin,
        minMarginPct: sp.marginPct,
      },
    });
    total++;
  }

  // ==================== 14. BUYER PRICING ====================
  console.log('🏷️ Creating buyer pricing...');

  const premiumSizes = [8, 10, 12, 16, 20, 24];
  for (let i = 0; i < 20; i++) {
    const buyer = buyerRecords[i % buyerRecords.length];
    const sizeInch = premiumSizes[i % premiumSizes.length];
    await db.buyerPricing.create({
      data: {
        buyerId: buyer.id,
        lengthInch: sizeInch,
        premiumPct: r(-5, 20, 1),
      },
    });
    total++;
  }

  // ==================== 15. SALES ====================
  console.log('📊 Creating sales...');

  const saleLengths = [8, 10, 12, 14, 16, 18, 20, 24];
  const saleStatuses = ['Healthy','Healthy','Healthy','At Risk','Loss'];

  for (let i = 0; i < 15; i++) {
    const buyer = buyerRecords[i % buyerRecords.length];
    const lenInch = saleLengths[i % saleLengths.length];
    const sp = sizePricingData.find(s => s.len === lenInch) || sizePricingData[2];
    const qtyKg = r(2, 15, 1);
    const usdPerKg = sp.usd * r(0.85, 1.20, 2);
    const usdValue = qtyKg * usdPerKg;
    const bdtValue = usdValue * 120;
    const costPerKg = sp.bdt * r(0.9, 1.1, 2);
    const totalCost = costPerKg * qtyKg;
    const marginPerKg = (bdtValue - totalCost) / qtyKg;
    const marginPct = marginPerKg / costPerKg * 100;
    const status = marginPct > 20 ? 'Healthy' : marginPct > 5 ? 'At Risk' : 'Loss';

    await db.sale.create({
      data: {
        contractNo: `SC-2026-${String(i + 1).padStart(4, '0')}`,
        contractDate: d(`2026-0${5 + Math.floor(i / 5)}-${String(1 + (i % 28)).padStart(2, '0')}`),
        buyerId: buyer.id,
        productSpec: `${lenInch} inch ${pick(colours)} hair`,
        lengthInch: lenInch,
        qtyKg,
        usdPerKg,
        usdValue,
        bdtValue,
        costPerKgBdt: costPerKg,
        totalCostBdt: totalCost,
        marginPerKgBdt: marginPerKg,
        totalMarginBdt: marginPerKg * qtyKg,
        marginPct,
        status,
      },
    });
    total++;
  }

  // ==================== 16. RISK REGISTER ====================
  console.log('⚠️ Creating risk register...');

  const riskData = [
    { desc: 'Hair quality inconsistent across suppliers in Myanmar region', cat: 'Quality', l: 4, i: 4, mit: 'Implement pre-shipment inspection and quality scoring system', own: 'QC Manager', st: 'Open' },
    { desc: 'BDT/USD exchange rate volatility impacting landed costs', cat: 'Financial', l: 5, i: 4, mit: 'Hedge 50% of forex exposure through forward contracts', own: 'Finance Director', st: 'Open' },
    { desc: 'Delay in LC clearance at Chittagong port', cat: 'Supply Chain', l: 4, i: 3, mit: 'Maintain 2-week buffer stock and use expedited clearance agents', own: 'Logistics Lead', st: 'Open' },
    { desc: 'Key factory supervisor resignation risk', cat: 'Operational', l: 3, i: 4, mit: 'Cross-train deputies and offer retention bonuses', own: 'HR Manager', st: 'Mitigated' },
    { desc: 'New Bangladesh import regulation on hair products', cat: 'Regulatory', l: 3, i: 5, mit: 'Engage trade association and prepare compliance documentation', own: 'Compliance Officer', st: 'Open' },
    { desc: 'Wastage rate exceeding 15% in washing process', cat: 'Quality', l: 3, i: 3, mit: 'Standardize chemical mix ratios and retrain operators', own: 'Production Manager', st: 'In Progress' },
    { desc: 'Buyer payment default on large contracts', cat: 'Financial', l: 2, i: 5, mit: 'Require 30% advance and LC-backed payment terms', own: 'Finance Director', st: 'Open' },
    { desc: 'Fuel price increase impacting transport costs', cat: 'Operational', l: 4, i: 2, mit: 'Negotiate fixed-rate contracts with transporters', own: 'Operations Lead', st: 'Mitigated' },
    { desc: 'Shortage of skilled hair sorting workers', cat: 'Operational', l: 4, i: 3, mit: 'Partner with vocational training centers for recruitment', own: 'HR Manager', st: 'Open' },
    { desc: 'Indian supplier shipment contamination risk', cat: 'Supply Chain', l: 2, i: 4, mit: 'Add container inspection step at origin warehouse', own: 'Procurement Lead', st: 'In Progress' },
    { desc: 'Warehouse fire or flood damage to inventory', cat: 'Operational', l: 1, i: 5, mit: 'Comprehensive insurance and climate-controlled storage', own: 'Facility Manager', st: 'Mitigated' },
    { desc: 'China buyer market demand decline', cat: 'Financial', l: 3, i: 4, mit: 'Diversify buyer base to Africa and Middle East markets', own: 'Sales Director', st: 'Open' },
    { desc: 'Chemical supply chain disruption for washing', cat: 'Supply Chain', l: 3, i: 3, mit: 'Maintain 3-month chemical inventory buffer', own: 'Procurement Lead', st: 'In Progress' },
    { desc: 'Worker health issues from chemical exposure', cat: 'Regulatory', l: 2, i: 5, mit: 'Provide PPE and schedule regular health checkups', own: 'Safety Officer', st: 'Open' },
    { desc: 'Grade dispute frequency increasing across factories', cat: 'Quality', l: 4, i: 2, mit: 'Implement digital weighing and grading verification system', own: 'QC Manager', st: 'Open' },
    { desc: 'IT system downtime affecting production tracking', cat: 'Operational', l: 2, i: 3, mit: 'Deploy backup server and daily database backups', own: 'IT Lead', st: 'Mitigated' },
    { desc: 'Competitive pricing pressure from Vietnam suppliers', cat: 'Financial', l: 4, i: 3, mit: 'Focus on premium product quality differentiation', own: 'Sales Director', st: 'Open' },
    { desc: 'Customs duty increase on hair imports', cat: 'Regulatory', l: 3, i: 4, mit: 'Lobby through industry association, explore FTA benefits', own: 'Compliance Officer', st: 'Open' },
    { desc: 'Power outage disrupting factory operations', cat: 'Operational', l: 3, i: 2, mit: 'Install backup generators at all factory locations', own: 'Facility Manager', st: 'In Progress' },
    { desc: 'Data breach compromising buyer information', cat: 'Regulatory', l: 1, i: 5, mit: 'Implement AES-256 encryption and access control policies', own: 'IT Lead', st: 'Mitigated' },
  ];

  for (const rd of riskData) {
    await db.risk.create({
      data: {
        riskId: `RSK-${String(riskData.indexOf(rd) + 1).padStart(3, '0')}`,
        description: rd.desc,
        category: rd.cat,
        likelihood: rd.l,
        impact: rd.i,
        riskScore: rd.l * rd.i,
        mitigation: rd.mit,
        owner: rd.own,
        status: rd.st,
      },
    });
    total++;
  }

  // ==================== 17. INVENTORY BUCKETS ====================
  console.log('📦 Creating inventory buckets...');

  const bucketData = [
    { name: 'Raw Material', weight: 185.5, value: 742000 },
    { name: 'Washed', weight: 142.3, value: 639750 },
    { name: 'Distributed', weight: 98.7, value: 493500 },
    { name: 'In-Factory', weight: 65.2, value: 358600 },
    { name: 'Half-Finish', weight: 38.4, value: 268800 },
    { name: 'In Final Production', weight: 22.1, value: 198900 },
    { name: 'Finished Goods', weight: 45.8, value: 916000 },
    { name: 'Wastage', weight: 12.3, value: 0 },
  ];

  for (const b of bucketData) {
    await db.inventoryBucket.create({
      data: {
        bucketName: b.name,
        weightKg: b.weight,
        valueBdt: b.value,
      },
    });
    total++;
  }

  // ==================== 18. CONSUMABLES ====================
  console.log('🧴 Creating consumables...');

  const consumableData = [
    { name: 'Shampoo (1L)', cat: 'Chemical', unit: 'bottle', stock: 120, reorder: 30, cost: 350, sup: 'Dhaka Chemicals', date: '2026-05-15' },
    { name: 'Conditioner (1L)', cat: 'Chemical', unit: 'bottle', stock: 85, reorder: 25, cost: 420, sup: 'Dhaka Chemicals', date: '2026-05-15' },
    { name: 'Hair Dye - Black', cat: 'Chemical', unit: 'kg', stock: 45, reorder: 15, cost: 800, sup: 'Color World BD', date: '2026-05-20' },
    { name: 'Hair Dye - Brown', cat: 'Chemical', unit: 'kg', stock: 38, reorder: 15, cost: 850, sup: 'Color World BD', date: '2026-05-20' },
    { name: 'Bleach Powder', cat: 'Chemical', unit: 'kg', stock: 12, reorder: 20, cost: 600, sup: 'Color World BD', date: '2026-04-10' },
    { name: 'Acetone (5L)', cat: 'Chemical', unit: 'can', stock: 25, reorder: 10, cost: 1200, sup: 'Industrial Solvents Ltd', date: '2026-05-05' },
    { name: 'Packaging Bags (Small)', cat: 'Packaging', unit: 'pcs', stock: 2000, reorder: 500, cost: 5, sup: 'Plastic Pack BD', date: '2026-06-01' },
    { name: 'Packaging Bags (Large)', cat: 'Packaging', unit: 'pcs', stock: 800, reorder: 200, cost: 12, sup: 'Plastic Pack BD', date: '2026-06-01' },
    { name: 'Cardboard Boxes', cat: 'Packaging', unit: 'pcs', stock: 350, reorder: 100, cost: 45, sup: 'Box Master', date: '2026-05-25' },
    { name: 'Label Stickers', cat: 'Packaging', unit: 'roll', stock: 15, reorder: 10, cost: 180, sup: 'Print World', date: '2026-05-28' },
    { name: 'Adhesive Glue (500ml)', cat: 'Adhesive', unit: 'bottle', stock: 60, reorder: 20, cost: 250, sup: 'Adhesive BD', date: '2026-05-18' },
    { name: 'Tape Roll (Wide)', cat: 'Adhesive', unit: 'roll', stock: 40, reorder: 15, cost: 80, sup: 'Adhesive BD', date: '2026-05-18' },
    { name: 'Rubber Bands (Pack)', cat: 'Adhesive', unit: 'pack', stock: 200, reorder: 50, cost: 30, sup: 'Stationery House', date: '2026-05-22' },
    { name: 'Weighing Scale Batteries', cat: 'Equipment', unit: 'pcs', stock: 8, reorder: 10, cost: 150, sup: 'Electro Mart', date: '2026-04-15' },
    { name: 'Cutting Scissors', cat: 'Equipment', unit: 'pcs', stock: 5, reorder: 5, cost: 350, sup: 'Tool Shop BD', date: '2026-04-20' },
    { name: 'Combing Brush Set', cat: 'Equipment', unit: 'set', stock: 3, reorder: 5, cost: 500, sup: 'Tool Shop BD', date: '2026-04-20' },
    { name: 'Hand Gloves (Box)', cat: 'Equipment', unit: 'box', stock: 20, reorder: 8, cost: 450, sup: 'Safety First BD', date: '2026-05-10' },
    { name: 'Face Masks (Box)', cat: 'Equipment', unit: 'box', stock: 15, reorder: 8, cost: 300, sup: 'Safety First BD', date: '2026-05-10' },
    { name: 'Hair Net (Pack 100)', cat: 'Equipment', unit: 'pack', stock: 25, reorder: 10, cost: 200, sup: 'Safety First BD', date: '2026-05-10' },
    { name: 'Silicone Spray', cat: 'Chemical', unit: 'can', stock: 4, reorder: 5, cost: 900, sup: 'Industrial Solvents Ltd', date: '2026-04-05' },
  ];

  for (const c of consumableData) {
    await db.consumable.create({
      data: {
        itemName: c.name,
        category: c.cat,
        unit: c.unit,
        stockQty: c.stock,
        reorderLevel: c.reorder,
        costPerUnit: c.cost,
        supplierName: c.sup,
        lastOrderDate: d(c.date),
      },
    });
    total++;
  }

  // ==================== 19. NOTIFICATIONS ====================
  console.log('🔔 Creating notifications...');

  const notifData = [
    { title: 'Lot LOT-20260401-01 washed successfully', msg: 'Wash output: 24.5kg (12.5% wastage). Operator: Abdul Wahab.', type: 'success', cat: 'lot', read: true },
    { title: 'Low stock alert: Bleach Powder', msg: 'Current stock: 12kg. Reorder level: 20kg. Please place order immediately.', type: 'warning', cat: 'financial', read: false },
    { title: 'Low stock alert: Silicone Spray', msg: 'Current stock: 4 cans. Reorder level: 5 cans.', type: 'warning', cat: 'financial', read: false },
    { title: 'Worker attendance below target', msg: 'Factory F-03 had only 6 workers present today. Minimum required: 8.', type: 'warning', cat: 'worker', read: false },
    { title: 'High wastage detected in F-07', msg: 'Today wastage rate: 22%. Threshold: 15%. Investigate immediately.', type: 'error', cat: 'factory', read: false },
    { title: 'New procurement received', msg: 'PRO-2026-0003 from Tamil Nadu Hair Exports: 85.5kg received at warehouse.', type: 'info', cat: 'lot', read: true },
    { title: 'Sale contract SC-2026-0008 confirmed', msg: 'Buyer: Amsterdam Hair Trading BV. 12.5kg of 16-inch hair. USD $233.33/kg.', type: 'success', cat: 'financial', read: true },
    { title: 'System maintenance scheduled', msg: 'Database backup and optimization scheduled for tonight at 2:00 AM.', type: 'info', cat: 'system', read: true },
    { title: 'Grade dispute filed by W-023', msg: 'Worker claims grade was incorrect for 2026-06-10 entry. Status: Pending review.', type: 'warning', cat: 'worker', read: false },
    { title: 'FX rate updated', msg: 'USD/BDT rate updated to 122.50. Previous: 121.00.', type: 'info', cat: 'financial', read: true },
    { title: 'LC LC-2026-0005 cleared at port', msg: 'Shipment from Myanmar cleared. Ready for pickup.', type: 'success', cat: 'lot', read: true },
    { title: 'Factory F-02 daily record completed', msg: 'All 10 workers processed. A-grade: 68%. Payroll: BDT 5,200.', type: 'success', cat: 'factory', read: true },
    { title: 'Risk RSK-005 status changed to Open', msg: 'New Bangladesh import regulation risk has been escalated.', type: 'warning', cat: 'system', read: false },
    { title: 'Buyer payment received', msg: 'Shenzhen Hair Products Co. paid USD 4,166.50 for SC-2026-0001.', type: 'success', cat: 'financial', read: true },
    { title: 'Phase 2 job P2-0003 completed', msg: '10.5kg input processed. Combing loss: 7.2%. Realisable value: BDT 245,000.', type: 'success', cat: 'factory', read: true },
  ];

  for (const n of notifData) {
    await db.notification.create({
      data: {
        title: n.title,
        message: n.msg,
        type: n.type,
        category: n.cat,
        isRead: n.read,
      },
    });
    total++;
  }

  // ==================== 20. AUDIT LOGS ====================
  console.log('📝 Creating audit logs...');

  const auditData = [
    { entity: 'Procurement', action: 'CREATE', oldV: null, newV: '{"voucherNo":"PRO-2026-0001","rawWeightKg":85.5}', by: 'admin' },
    { entity: 'Procurement', action: 'UPDATE', oldV: '{"status":"Pending"}', newV: '{"status":"Received"}', by: 'admin' },
    { entity: 'Lot', action: 'CREATE', oldV: null, newV: '{"lotNo":"LOT-20260401-01","colour":"#1B","rawWeightKg":25}', by: 'admin' },
    { entity: 'Lot', action: 'UPDATE', oldV: '{"washStatus":"Pending"}', newV: '{"washStatus":"Done"}', by: 'admin' },
    { entity: 'WashLog', action: 'CREATE', oldV: null, newV: '{"washId":"WASH-0001","outputKg":22.1}', by: 'admin' },
    { entity: 'Factory', action: 'CREATE', oldV: null, newV: '{"factoryId":"F-01","name":"Fatema Hair Works"}', by: 'admin' },
    { entity: 'Factory', action: 'UPDATE', oldV: '{"fuelBdt":200}', newV: '{"fuelBdt":280}', by: 'admin' },
    { entity: 'Worker', action: 'CREATE', oldV: null, newV: '{"workerId":"W-001","name":"Fatema Begum"}', by: 'admin' },
    { entity: 'Worker', action: 'UPDATE', oldV: '{"isActive":true}', newV: '{"isActive":false}', by: 'admin' },
    { entity: 'Worker', action: 'DELETE', oldV: '{"workerId":"W-101","name":"Test Worker"}', newV: null, by: 'admin' },
    { entity: 'Supplier', action: 'CREATE', oldV: null, newV: '{"name":"Tamil Nadu Hair Exports","country":"India"}', by: 'admin' },
    { entity: 'Supplier', action: 'UPDATE', oldV: '{"isActive":true}', newV: '{"isActive":false}', by: 'admin' },
    { entity: 'Buyer', action: 'CREATE', oldV: null, newV: '{"name":"Shenzhen Hair Products Co.","country":"China"}', by: 'admin' },
    { entity: 'Sale', action: 'CREATE', oldV: null, newV: '{"contractNo":"SC-2026-0001","qtyKg":10}', by: 'admin' },
    { entity: 'Sale', action: 'UPDATE', oldV: '{"status":"Healthy"}', newV: '{"status":"At Risk"}', by: 'admin' },
    { entity: 'SizePricing', action: 'UPDATE', oldV: '{"bdtPerKg":18000}', newV: '{"bdtPerKg":19000}', by: 'admin' },
    { entity: 'Phase1Distribution', action: 'CREATE', oldV: null, newV: '{"handoffId":"HO-0001","qtyKg":5}', by: 'admin' },
    { entity: 'Phase2Job', action: 'CREATE', oldV: null, newV: '{"jobId":"P2-0001","inputKg":12}', by: 'admin' },
    { entity: 'Risk', action: 'CREATE', oldV: null, newV: '{"riskId":"RSK-001","category":"Quality"}', by: 'admin' },
    { entity: 'Risk', action: 'UPDATE', oldV: '{"status":"Open"}', newV: '{"status":"Mitigated"}', by: 'admin' },
    { entity: 'Settings', action: 'UPDATE', oldV: '{"fxUsdBdt":120}', newV: '{"fxUsdBdt":122.5}', by: 'admin' },
    { entity: 'InventoryBucket', action: 'UPDATE', oldV: '{"weightKg":180}', newV: '{"weightKg":185.5}', by: 'admin' },
    { entity: 'Consumable', action: 'CREATE', oldV: null, newV: '{"itemName":"Shampoo (1L)","stockQty":120}', by: 'admin' },
    { entity: 'Consumable', action: 'UPDATE', oldV: '{"stockQty":20}', newV: '{"stockQty":12}', by: 'admin' },
    { entity: 'HeadLeader', action: 'CREATE', oldV: null, newV: '{"name":"Abdul Malek","region":"Dhaka North"}', by: 'admin' },
    { entity: 'LineLeader', action: 'CREATE', oldV: null, newV: '{"name":"Shafiqul Islam","phone":"01811-111111"}', by: 'admin' },
    { entity: 'LineLeader', action: 'UPDATE', oldV: '{"bKash":"01811-111111"}', newV: '{"bKash":"01811-999999"}', by: 'admin' },
    { entity: 'FactoryDailyRecord', action: 'CREATE', oldV: null, newV: '{"totalInputKg":5.2,"totalAGradeKg":3.5}', by: 'admin' },
    { entity: 'WorkerDailyEntry', action: 'UPDATE', oldV: '{"status":"Pending Approval"}', newV: '{"status":"Approved"}', by: 'admin' },
    { entity: 'LCManagement', action: 'CREATE', oldV: null, newV: '{"lcNo":"LC-2026-0001","status":"Open"}', by: 'admin' },
  ];

  for (const a of auditData) {
    await db.auditLog.create({
      data: {
        entity: a.entity,
        action: a.action,
        oldValues: a.oldV,
        newValues: a.newV,
        performedBy: a.by,
      },
    });
    total++;
  }

  // ==================== 21. GRADE DISPUTES ====================
  console.log('⚖️ Creating grade disputes...');

  const disputeReasons = [
    'Lot quality was poor, could not produce A-grade from this material',
    'Weight was correct, the scale may have been miscalibrated',
    'Was sick that day and could not perform at full capacity',
    'The input material had too many short pieces mixed in',
    'Grade assignment seems unfair compared to other workers with same input',
    'Scale showed different reading before and after processing',
    'The lot colour was #600 which is harder to process than #1B',
    'I was assigned more input than usual without prior notice',
    'The wastage calculation does not match my count',
    'Request re-verification of grade by independent QC team',
  ];
  const disputeStatuses = ['Pending','Pending','Pending','UnderReview','UnderReview','Upheld','Upheld','Overturned','Overturned','Upheld'];
  const resolutions = [
    null, null, null,
    'QC team assigned for re-inspection on 2026-06-20',
    'Meeting scheduled with factory supervisor',
    'Grade upheld. Original grading was accurate.',
    'Grade upheld after re-weighing. No change needed.',
    'Grade overturned. B-grade corrected to A-grade. Difference: 35g.',
    'Grade overturned. Supervisor error in data entry.',
    'Grade upheld. Worker training recommended.',
  ];

  const pendingEntries = workerEntries.filter(e => e.status === 'Pending Approval');

  for (let i = 0; i < 10; i++) {
    const entry = pendingEntries[i % pendingEntries.length] || workerEntries[i % workerEntries.length];
    await db.gradeDispute.create({
      data: {
        entryId: entry.id,
        workerId: entry.workerId,
        reason: disputeReasons[i],
        status: disputeStatuses[i],
        resolution: resolutions[i],
        resolvedAt: ['Upheld','Overturned'].includes(disputeStatuses[i]) ? d('2026-06-18') : null,
      },
    });
    total++;
  }

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log(`✅ SEED COMPLETE — Total records created: ${total}`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });