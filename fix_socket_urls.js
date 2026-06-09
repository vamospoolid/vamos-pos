const fs = require('fs');
const path = require('path');

const files = [
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Waitlist.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Reports.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Incomes.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Expenses.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Competitions.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/Challenges.tsx',
    'd:/APPS/vamosmobile/vamos-pos-frontend/src/App.tsx'
];

console.log('🛠️ Memperbaiki bug .replace(\'/api\', \'\') di frontend...');

files.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`⚠️ File tidak ditemukan: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Ganti .replace('/api', '') dengan .replace(/\/api$/, '')
    const updatedContent = content.replace(/\.replace\('\/api',\s*''\)/g, ".replace(/\\/api$/, '')");
    
    if (content !== updatedContent) {
        fs.writeFileSync(file, updatedContent, 'utf8');
        console.log(`✅ Berhasil memperbaiki: ${path.basename(file)}`);
    } else {
        console.log(`ℹ️ Tidak ada perubahan pada: ${path.basename(file)}`);
    }
});

console.log('🎉 Selesai memperbaiki file lokal!');
