-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "fxUsdBdt" REAL NOT NULL DEFAULT 120.0,
    "rateA" REAL NOT NULL DEFAULT 500.0,
    "rateB" REAL NOT NULL DEFAULT 400.0,
    "rateC" REAL NOT NULL DEFAULT 300.0,
    "washTol" REAL NOT NULL DEFAULT 0.15,
    "hackTol" REAL NOT NULL DEFAULT 0.15,
    "costPerKgTgt" REAL NOT NULL DEFAULT 320.0,
    "factoryAMin" REAL NOT NULL DEFAULT 0.60,
    "supMax" REAL NOT NULL DEFAULT 400.0,
    "supMin" REAL NOT NULL DEFAULT 100.0,
    "supExtra" REAL NOT NULL DEFAULT 150.0,
    "perfThreshold" REAL NOT NULL DEFAULT 0.90,
    "perfBonus" REAL NOT NULL DEFAULT 300.0,
    "attDays" INTEGER NOT NULL DEFAULT 30,
    "attBonus" REAL NOT NULL DEFAULT 200.0,
    "autoCGrams" REAL NOT NULL DEFAULT 50.0,
    "turnoverTgt" REAL NOT NULL DEFAULT 5.0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "isLocal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "supplierId" TEXT NOT NULL,
    "originCountry" TEXT NOT NULL,
    "rawWeightKg" REAL NOT NULL,
    "usdPerKg" REAL NOT NULL DEFAULT 0,
    "costPerKgBdt" REAL NOT NULL,
    "goodsUsd" REAL NOT NULL DEFAULT 0,
    "freightUsd" REAL NOT NULL DEFAULT 0,
    "dutyUsd" REAL NOT NULL DEFAULT 0,
    "bankChargesUsd" REAL NOT NULL DEFAULT 0,
    "landedUsd" REAL NOT NULL DEFAULT 0,
    "totalLandedCostBdt" REAL NOT NULL,
    "landedCostPerKgBdt" REAL NOT NULL DEFAULT 0,
    "lcNo" TEXT,
    "paymentMode" TEXT,
    "qualityGrade" TEXT,
    "fxRate" REAL NOT NULL DEFAULT 120.0,
    "status" TEXT NOT NULL DEFAULT 'Received',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Procurement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotNo" TEXT NOT NULL,
    "procurementId" TEXT,
    "colour" TEXT NOT NULL,
    "rawWeightKg" REAL NOT NULL,
    "landedCostPerKg" REAL NOT NULL,
    "totalLandedCost" REAL NOT NULL,
    "washStatus" TEXT NOT NULL DEFAULT 'Pending',
    "distributedKg" REAL NOT NULL DEFAULT 0,
    "returnedKg" REAL NOT NULL DEFAULT 0,
    "finishedKg" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lot_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WashLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "washId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "washDate" DATETIME NOT NULL,
    "operator" TEXT NOT NULL,
    "inputKg" REAL NOT NULL,
    "outputKg" REAL NOT NULL,
    "wastageKg" REAL NOT NULL,
    "wastagePct" REAL NOT NULL,
    "chemicalsBdt" REAL NOT NULL,
    "labourBdt" REAL NOT NULL,
    "costPerKgOut" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WashLog_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Phase1Distribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handoffId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "fromRole" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "qtyKg" REAL NOT NULL,
    "cumulativeKg" REAL NOT NULL,
    "tierMultiplier" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Phase1Distribution_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeadLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "LineLeader" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "bKash" TEXT,
    "headLeaderId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LineLeader_headLeaderId_fkey" FOREIGN KEY ("headLeaderId") REFERENCES "HeadLeader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "supervisorBkash" TEXT,
    "location" TEXT NOT NULL,
    "fuelBdt" REAL NOT NULL DEFAULT 200,
    "transportBdt" REAL NOT NULL DEFAULT 150,
    "lineLeaderId" TEXT NOT NULL,
    "groupHead" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Factory_lineLeaderId_fkey" FOREIGN KEY ("lineLeaderId") REFERENCES "LineLeader" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bKash" TEXT,
    "factoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Worker_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FactoryDailyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordDate" DATETIME NOT NULL,
    "factoryId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "hostingAllowance" REAL NOT NULL DEFAULT 0,
    "perfBonus" REAL NOT NULL DEFAULT 0,
    "totalSupPay" REAL NOT NULL DEFAULT 0,
    "totalInputKg" REAL NOT NULL DEFAULT 0,
    "totalAGradeKg" REAL NOT NULL DEFAULT 0,
    "totalBGradeKg" REAL NOT NULL DEFAULT 0,
    "totalCGradeKg" REAL NOT NULL DEFAULT 0,
    "totalWastageKg" REAL NOT NULL DEFAULT 0,
    "totalPayrollBdt" REAL NOT NULL DEFAULT 0,
    "grandTotalBdt" REAL NOT NULL DEFAULT 0,
    "wipStatus" TEXT NOT NULL DEFAULT 'IN PROGRESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FactoryDailyRecord_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactoryDailyRecord_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerDailyEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "inputGivenKg" REAL NOT NULL,
    "aWeightKg" REAL NOT NULL,
    "bWeightKg" REAL NOT NULL,
    "cWeightKg" REAL NOT NULL,
    "wastageKg" REAL NOT NULL,
    "balanceStatus" TEXT NOT NULL DEFAULT 'OK',
    "daysPresent" INTEGER NOT NULL DEFAULT 0,
    "baseWage" REAL NOT NULL,
    "attendanceBonus" REAL NOT NULL,
    "totalPayable" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending Approval',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerDailyEntry_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "FactoryDailyRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkerDailyEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Phase2Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "inputKg" REAL NOT NULL,
    "size5Kg" REAL NOT NULL DEFAULT 0,
    "size6Kg" REAL NOT NULL DEFAULT 0,
    "size8Kg" REAL NOT NULL DEFAULT 0,
    "size10Kg" REAL NOT NULL DEFAULT 0,
    "size12Kg" REAL NOT NULL DEFAULT 0,
    "size14Kg" REAL NOT NULL DEFAULT 0,
    "size16Kg" REAL NOT NULL DEFAULT 0,
    "size18Kg" REAL NOT NULL DEFAULT 0,
    "size20Kg" REAL NOT NULL DEFAULT 0,
    "size24Kg" REAL NOT NULL DEFAULT 0,
    "size30Kg" REAL NOT NULL DEFAULT 0,
    "totalSizedKg" REAL NOT NULL,
    "combingLossKg" REAL NOT NULL,
    "lossPct" REAL NOT NULL,
    "realisableValueBdt" REAL NOT NULL,
    "costBdt" REAL NOT NULL,
    "marginBdt" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Phase2Job_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SizePricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lengthInch" INTEGER NOT NULL,
    "bdtPerKg" REAL NOT NULL,
    "usdPerKg" REAL NOT NULL,
    "marketSegment" TEXT NOT NULL,
    "minMarginBdt" REAL NOT NULL,
    "minMarginPct" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BuyerPricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "lengthInch" INTEGER NOT NULL,
    "premiumPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuyerPricing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNo" TEXT NOT NULL,
    "contractDate" DATETIME NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productSpec" TEXT NOT NULL,
    "lengthInch" INTEGER NOT NULL,
    "qtyKg" REAL NOT NULL,
    "usdPerKg" REAL NOT NULL,
    "usdValue" REAL NOT NULL,
    "bdtValue" REAL NOT NULL,
    "costPerKgBdt" REAL NOT NULL,
    "totalCostBdt" REAL NOT NULL,
    "marginPerKgBdt" REAL NOT NULL,
    "totalMarginBdt" REAL NOT NULL,
    "marginPct" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Healthy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "riskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "mitigation" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LCManagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lcNo" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "lcDate" DATETIME NOT NULL,
    "bankName" TEXT NOT NULL,
    "usdAmount" REAL NOT NULL,
    "bdtAmount" REAL NOT NULL,
    "fxRate" REAL NOT NULL DEFAULT 120.0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "shipmentDate" DATETIME,
    "clearanceDate" DATETIME,
    "paymentDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LCManagement_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'system',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GradeDispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "workerId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consumable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "stockQty" REAL NOT NULL DEFAULT 0,
    "reorderLevel" REAL NOT NULL DEFAULT 0,
    "costPerUnit" REAL NOT NULL DEFAULT 0,
    "supplierName" TEXT,
    "lastOrderDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryBucket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketName" TEXT NOT NULL,
    "weightKg" REAL NOT NULL DEFAULT 0,
    "valueBdt" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lot_lotNo_key" ON "Lot"("lotNo");

-- CreateIndex
CREATE UNIQUE INDEX "WashLog_washId_key" ON "WashLog"("washId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase1Distribution_handoffId_key" ON "Phase1Distribution"("handoffId");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_factoryId_key" ON "Factory"("factoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_workerId_key" ON "Worker"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Phase2Job_jobId_key" ON "Phase2Job"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "SizePricing_lengthInch_key" ON "SizePricing"("lengthInch");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_contractNo_key" ON "Sale"("contractNo");

-- CreateIndex
CREATE UNIQUE INDEX "Risk_riskId_key" ON "Risk"("riskId");

-- CreateIndex
CREATE UNIQUE INDEX "LCManagement_lcNo_key" ON "LCManagement"("lcNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBucket_bucketName_key" ON "InventoryBucket"("bucketName");
