import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting massive seeding...');

  // 1. Suppliers
  console.log('Seeding 500 suppliers...');
  for (let i = 1; i <= 500; i++) {
    await prisma.supplier.create({
      data: {
        name: `Supplier ${i}`,
        country: i % 2 === 0 ? 'India' : 'Myanmar',
        contact: `Contact ${i}`,
        phone: `+880123456${i.toString().padStart(3, '0')}`,
      }
    });
  }
  const allSuppliers = await prisma.supplier.findMany({ select: { id: true } });

  // 2. Procurements & Lots
  console.log('Seeding 500 procurements and lots...');
  for (let i = 1; i <= 500; i++) {
    const sId = allSuppliers[i-1].id;
    const proc = await prisma.procurement.create({
      data: {
        voucherNo: `V-${2024}-${i.toString().padStart(4, '0')}`,
        date: new Date(),
        supplierId: sId,
        originCountry: 'India',
        rawWeightKg: 100 + Math.random() * 50,
        costPerKgBdt: 300 + Math.random() * 50,
        totalLandedCostBdt: 40000,
        lcNo: i % 5 === 0 ? `LC-${2024}-${i}` : null,
      }
    });

    await prisma.lot.create({
      data: {
        lotNo: `LOT-${i.toString().padStart(4, '0')}`,
        procurementId: proc.id,
        colour: i % 3 === 0 ? 'Natural Black' : 'Dark Brown',
        rawWeightKg: proc.rawWeightKg,
        landedCostPerKg: 350,
        totalLandedCost: proc.rawWeightKg * 350,
        status: 'Active'
      }
    });
  }

  // 3. Organization (Head Leaders, Line Leaders)
  console.log('Seeding leaders...');
  for (let i = 1; i <= 20; i++) {
    const hl = await prisma.headLeader.create({
      data: { name: `Head Leader ${i}`, region: 'North' }
    });
    for (let j = 1; j <= 5; j++) {
      await prisma.lineLeader.create({
        data: { name: `Line Leader ${i}-${j}`, headLeaderId: hl.id }
      });
    }
  }
  const allLineLeaders = await prisma.lineLeader.findMany({ select: { id: true } });

  // 4. Factories & Workers
  console.log('Seeding 500 factories...');
  for (let i = 1; i <= 500; i++) {
    const llId = allLineLeaders[Math.floor(Math.random() * allLineLeaders.length)].id;
    await prisma.factory.create({
      data: {
        factoryId: `F${i.toString().padStart(4, '0')}`,
        name: `Factory ${i}`,
        supervisorName: `Supervisor ${i}`,
        location: 'Gazipur',
        lineLeaderId: llId,
        groupHead: 'Group A'
      }
    });
  }

  console.log('Seeding 500 workers...');
  const allFactories = await prisma.factory.findMany({ select: { id: true } });
  for (let i = 1; i <= 500; i++) {
    const fId = allFactories[Math.floor(Math.random() * allFactories.length)].id;
    await prisma.worker.create({
      data: {
        workerId: `W${i.toString().padStart(4, '0')}`,
        name: `Worker ${i}`,
        factoryId: fId,
      }
    });
  }

  // 5. Sales
  console.log('Seeding 500 sales...');
  let buyer = await prisma.buyer.findFirst();
  if (!buyer) {
    buyer = await prisma.buyer.create({ data: { name: 'Global Buyer', country: 'USA' } });
  }

  for (let i = 1; i <= 500; i++) {
    await prisma.sale.create({
      data: {
        contractNo: `C-${i.toString().padStart(4, '0')}`,
        contractDate: new Date(),
        buyerId: buyer.id,
        productSpec: 'Double Drawn',
        lengthInch: 18,
        qtyKg: 10 + Math.random() * 10,
        usdPerKg: 100,
        usdValue: 1000,
        bdtValue: 120000,
        costPerKgBdt: 800,
        totalCostBdt: 8000,
        marginPerKgBdt: 200,
        totalMarginBdt: 2000,
        marginPct: 20,
      }
    });
  }

  console.log('Massive seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
