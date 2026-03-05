import { PricingService } from './src/modules/pricing/pricing.service';

async function test() {
    console.log('--- TEST PRICING CALCULATION ---');

    // Simulate 18:00 to 19:00 (Malam)
    const startTime = new Date();
    startTime.setHours(18, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60000);

    console.log(`Testing 1 hour (18:00-19:00), Member: true`);
    const price = await PricingService.calculateTableAmount('REGULAR', startTime, endTime, true);
    console.log(`Price: ${price} PTS (Expected around 35000 based on Regular Malam rule)`);

    // Simulate 10:00 to 11:00 (Siang)
    const startTimeSiang = new Date();
    startTimeSiang.setHours(10, 0, 0, 0);
    const endTimeSiang = new Date(startTimeSiang.getTime() + 60 * 60000);

    console.log(`Testing 1 hour (10:00-11:00), Member: true`);
    const priceSiang = await PricingService.calculateTableAmount('REGULAR', startTimeSiang, endTimeSiang, true);
    console.log(`Price: ${priceSiang} PTS (Expected around 25000 based on PAKET SIANG REGULAR rule)`);

    // Simulate 23:30 to 01:30 (Cross Midnight)
    const startMidnight = new Date();
    startMidnight.setHours(23, 30, 0, 0);
    const endMidnight = new Date(startMidnight.getTime() + 120 * 60000);

    console.log(`Testing 2 hours (23:30-01:30), Member: true`);
    const priceMid = await PricingService.calculateTableAmount('REGULAR', startMidnight, endMidnight, true);
    console.log(`Price: ${priceMid} PTS (Expected 2 * 35000 = 70000)`);
}

test().catch(console.error);
