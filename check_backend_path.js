const { Client } = require('ssh2');

const VPS_CONFIG = {
    host: '173.212.243.240',
    port: 22,
    username: 'root',
    password: 'Ahmad_dcc07',
};

const conn = new Client();

conn.on('ready', () => {
    const cmd = `
        pm2 jlist
    `;
    conn.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            const list = JSON.parse(out);
            const vb = list.find(p => p.name === 'vamos-backend');
            console.log('vamos-backend info:', {
                name: vb?.name,
                pm_exec_path: vb?.pm2_env?.pm_exec_path,
                pm_cwd: vb?.pm2_env?.pm_cwd,
                status: vb?.pm2_env?.status
            });
            conn.end();
        });
    });
}).connect(VPS_CONFIG);
