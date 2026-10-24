import { PrismaClient } from '@prisma/client';
import { inventoryService } from '../src/modules/inventory/inventory.service';
import { RelayService } from '../src/modules/relay/relay.service';

const prisma = new PrismaClient();

async function runTest() {
  console.log('🧪 Starting Verification Test for Sprint 1, 2, and 3...');

  // 1. Verify Relay Isolation
  const relayStatus = RelayService.getStatus();
  console.log('🛡️ Relay Hardware Status:', relayStatus);
  if (!relayStatus) throw new Error('Relay status check failed!');

  // 2. Fetch raw materials
  const materials = await inventoryService.getRawMaterials();
  console.log(`✅ Loaded ${materials.length} Raw Materials.`);

  if (materials.length === 0) {
    console.log('Importing starter pack for test...');
    await inventoryService.importStarterPack();
  }

  const sampleMaterial = (await inventoryService.getRawMaterials())[0];
  console.log(`📦 Testing with material: "${sampleMaterial.name}" | Current Stock: ${sampleMaterial.currentStock} ${sampleMaterial.unit} | Cost: Rp ${sampleMaterial.costPerUnit}`);

  // 3. Test Sprint 1 & 2: Restock with Purchase Unit & Moving Average
  const restockResult = await inventoryService.restockRawMaterial(sampleMaterial.id, {
    purchaseQty: 1,
    purchasePricePerUnit: 200000,
    notes: 'Test Kulakan Faktur #TEST-01',
    useMovingAverage: true
  });
  console.log(`✅ Restock Success! New Stock: ${restockResult.currentStock} ${restockResult.unit}, New Cost: Rp ${restockResult.costPerUnit}/${restockResult.unit}`);

  // 4. Test Sprint 3: Stock Opname Digital
  const stockBeforeOpname = restockResult.currentStock;
  const physicalCount = stockBeforeOpname - 100; // 100 units short
  console.log(`📋 Conducting Stock Opname: System=${stockBeforeOpname}, Physical=${physicalCount} (-100 shortage)`);

  const opname = await inventoryService.createStockOpname({
    conductedBy: 'Barista Antigravity Test',
    notes: 'Audit Fisik Mingguan Bar & Cafe',
    applyAdjustment: true,
    items: [
      {
        rawMaterialId: sampleMaterial.id,
        physicalStock: physicalCount,
        notes: 'Residu takaran barista'
      }
    ]
  });

  console.log(`✅ Stock Opname Created: #${opname.opnameNumber} | Status: ${opname.status} | Total Variance Cost: Rp ${opname.totalVarianceCost}`);

  // Verify adjusted stock in database
  const updatedMaterial = await prisma.rawMaterial.findUnique({ where: { id: sampleMaterial.id } });
  console.log(`✅ Reconciled Stock in DB: ${updatedMaterial?.currentStock} ${sampleMaterial.unit} (Expected: ${physicalCount})`);

  if (updatedMaterial?.currentStock !== physicalCount) {
    throw new Error('Stock adjustment mismatch!');
  }

  // 5. Test Opname History Listing
  const allOpnames = await inventoryService.getStockOpnames();
  console.log(`✅ Successfully fetched ${allOpnames.length} Stock Opname sessions from database.`);

  console.log('🎉 ALL SPRINT 1, 2 & 3 TESTS PASSED PERFECTLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('❌ Test Error:', err);
  process.exit(1);
});
