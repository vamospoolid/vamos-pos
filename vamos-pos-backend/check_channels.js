const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
    const tables = await p.table.findMany({
        select: { name: true, relayChannel: true },
        orderBy: { relayChannel: 'asc' }
    });
    let out = '=== MAPPING MEJA -> RELAY CHANNEL ===\n';
    tables.forEach(t => {
        out += `Meja: ${String(t.name).padEnd(12)} -> Channel: ${t.relayChannel}\n`;
    });
    out += '=====================================\n';
    fs.writeFileSync('channel_map.txt', out, 'utf8');
    console.log(out);
}

main().catch(console.error).finally(() => p.$disconnect());
