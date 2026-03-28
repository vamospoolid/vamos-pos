const { spawn } = require('child_process');

function runSsh(command) {
    return new Promise((resolve, reject) => {
        const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@5.189.165.222', command], {
            stdio: ['pipe', 'inherit', 'inherit']
        });

        ssh.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Exit code ${code}`));
        });

        // This is the tricky part - some SSH versions on Windows don't like this
        setTimeout(() => {
            try {
                ssh.stdin.write('Ahmaddcc07\n');
            } catch (e) {
                console.error('Failed to write password:', e.message);
            }
        }, 2000);
    });
}

async function main() {
    try {
        console.log('--- Pulling latest code on VPS ---');
        await runSsh('cd /var/www/vamos-pos && git pull');
        console.log('--- Running Prisma DB Push ---');
        await runSsh('cd /var/www/vamos-pos/vamos-pos-backend && npx prisma db push --accept-data-loss');
        console.log('--- Building Player App ---');
        await runSsh('cd /var/www/vamos-pos/vamos-player-app && npm run build');
        console.log('--- Building POS Frontend ---');
        await runSsh('cd /var/www/vamos-pos/vamos-pos-frontend && npm run build');
        console.log('--- Restarting Backend ---');
        await runSsh('pm2 restart all');
        console.log('--- DEPLOYMENT COMPLETE ---');
    } catch (err) {
        console.error('Deployment failed:', err.message);
    }
}

main();
