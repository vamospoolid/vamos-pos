/**
 * VAMOS FORCE DEPLOY SCRIPT
 * Usage: node force_deploy.js <GITHUB_TOKEN>
 * Or:    node force_deploy.js --ssh <VPS_USER@IP> <VPS_PATH>
 * 
 * Example (GitHub):
 *   node force_deploy.js ghp_xxxxxxxxxxxxxxxx
 * 
 * Example (SSH):
 *   node force_deploy.js --ssh root@pos.vamospool.id /home/vamos/backend
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const MODE = args[0];

function run(cmd, opts = {}) {
    console.log(`\n▶ ${cmd}`);
    try {
        const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts });
        if (out) process.stdout.write(out);
        return out;
    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.stdout) console.error(e.stdout);
        if (e.stderr) console.error(e.stderr);
        process.exit(1);
    }
}

async function deployViaGithub(token) {
    console.log('\n🚀 FORCE DEPLOY via GitHub Token\n');
    
    // Set remote with token
    run(`git remote set-url origin https://${token}@github.com/vamospoolid/vamos-pos.git`);
    
    // Push
    run('git push origin main --force');
    
    // Reset remote URL (remove token from URL for security)
    run('git remote set-url origin https://github.com/vamospoolid/vamos-pos.git');
    
    console.log('\n✅ GitHub push berhasil!\n');
    console.log('📡 Sekarang jalankan di VPS:');
    console.log('   cd /path/to/backend');
    console.log('   git pull origin main');
    console.log('   npm run build');
    console.log('   pm2 restart all\n');
}

async function deployViaSSH(sshTarget, remotePath) {
    console.log(`\n🚀 FORCE DEPLOY via SSH ke ${sshTarget}:${remotePath}\n`);
    
    const filesToDeploy = [
        'src/modules/player/player.controller.ts',
        'src/modules/loyalty/loyalty.service.ts',
    ];
    
    // Copy changed files
    for (const file of filesToDeploy) {
        const remoteFile = `${remotePath}/${file}`;
        const remoteDir = path.dirname(remoteFile);
        console.log(`📤 Uploading ${file}...`);
        run(`ssh ${sshTarget} "mkdir -p ${remoteDir}"`);
        run(`scp ${file} ${sshTarget}:${remoteFile}`);
        console.log(`   ✓ Done`);
    }
    
    // Restart backend on VPS
    console.log('\n🔄 Restarting backend on VPS...');
    run(`ssh ${sshTarget} "cd ${remotePath} && npm run build 2>&1 || true && pm2 restart all"`);
    
    console.log('\n✅ Deploy via SSH berhasil!\n');
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
if (!MODE) {
    console.log(`
╔══════════════════════════════════════════════╗
║        VAMOS FORCE DEPLOY SCRIPT            ║
╠══════════════════════════════════════════════╣
║ Cara pakai:                                 ║
║                                             ║
║ 1. Via GitHub Token:                        ║
║    node force_deploy.js ghp_XXXXX           ║
║                                             ║
║ 2. Via SSH:                                 ║
║    node force_deploy.js --ssh               ║
║      root@pos.vamospool.id /home/vamos/app  ║
╚══════════════════════════════════════════════╝
`);
    process.exit(0);
}

if (MODE === '--ssh') {
    const sshTarget = args[1];
    const remotePath = args[2];
    if (!sshTarget || !remotePath) {
        console.error('❌ Usage: node force_deploy.js --ssh <user@ip> <remote_path>');
        process.exit(1);
    }
    deployViaSSH(sshTarget, remotePath).catch(console.error);
} else {
    // Assume it's a GitHub token
    deployViaGithub(MODE).catch(console.error);
}
