const { PricingService } = require('./dist/modules/pricing/pricing.service');
const { prisma } = require('./dist/database/db');

async function test() {
    // Testing non-member night (default rate 45)
    // 60 mins = 1 hour -> should be 45
    const p1 = await PricingService.estimatePrice('REGULAR', 60, false, new Date('2026-03-02T20:00:00'));
    console.log('60 mins (Night, Non-member):', p1);

    // 61 mins = 2 hours -> should be 90
    const p2 = await PricingService.estimatePrice('REGULAR', 61, false, new Date('2026-03-02T20:00:00'));
    console.log('61 mins (Night, Non-member):', p2);

    // 10 mins = 1 hour -> should be 45
    const p3 = await PricingService.estimatePrice('REGULAR', 10, false, new Date('2026-03-02T20:00:00'));
    console.log('10 mins (Night, Non-member):', p3);
}

test().finally(() => process.exit());
