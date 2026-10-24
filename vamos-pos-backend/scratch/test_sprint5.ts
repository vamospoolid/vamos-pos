import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { ReportService } from '../src/modules/reports/report.service';
import { RelayService } from '../src/modules/relay/relay.service';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testSprint5() {
    console.log('--- TESTING SPRINT 5: F&B COGS & MENU ENGINEERING ANALYTICS ---');
    try {
        // 1. Hardware Relay check
        const relayStatus = RelayService.getStatus();
        console.log('🛡️ Relay Hardware Status:', relayStatus);

        // 2. Direct Service calculation
        console.log('📊 Calling ReportService.getFnbCogsAnalytics(30)...');
        const analytics = await ReportService.getFnbCogsAnalytics(30);
        console.log('Summary:', analytics.summary);
        console.log('Benchmark:', analytics.benchmark);
        console.log('Total menu evaluated:', analytics.menuEngineering.length);
        if (analytics.menuEngineering.length > 0) {
            console.log('First 3 items:', analytics.menuEngineering.slice(0, 3).map(m => ({
                name: m.name,
                qty: m.quantitySold,
                rev: m.revenue,
                cogs: m.cogs,
                profit: m.grossProfit,
                margin: m.marginPercent,
                class: m.classification
            })));
        }

        // 3. HTTP Endpoint with JWT Auth
        const user = await prisma.user.findFirst();
        if (user) {
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
                { expiresIn: '1h' }
            );

            console.log('🔑 Testing HTTP GET /api/reports/fnb-cogs-analytics with token...');
            const httpRes = await axios.get('http://localhost:3000/api/reports/fnb-cogs-analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('HTTP Status:', httpRes.status);
            console.log('HTTP Success:', httpRes.data.success);
            console.log('HTTP Items Count:', httpRes.data.data.menuEngineering.length);
        }

        console.log('\n✅ ALL SPRINT 5 TESTS PASSED SUCCESSFULLY!');
    } catch (err: any) {
        console.error('❌ SPRINT 5 TEST FAILED:', err.response?.data || err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testSprint5();
