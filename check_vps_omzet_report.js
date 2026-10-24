const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/vamos/vamos-pos-backend && node -e "const { ReportService } = require(\\"./dist/modules/reports/report.service\\"); ReportService.getCurrentOperationalDayRevenue().then(d => { console.log(\\"VPS_REPORT_REVENUE:\\", JSON.stringify(d)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07'
});
