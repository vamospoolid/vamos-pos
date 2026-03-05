const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ReportService } = require('./src/modules/reports/report.service');

async function test() {
    console.log(await ReportService.getDailyRevenue());
    console.log(await ReportService.getTableUtilization());
    console.log(await ReportService.getTopPlayers());
}
test();
