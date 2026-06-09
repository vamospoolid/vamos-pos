const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/Reports.tsx',
    'src/pages/Players.tsx',
    'src/pages/Events.tsx',
    'src/pages/Announcements.tsx',
    'src/pages/Bookings.tsx'
];

filesToProcess.forEach(targetFile => {
    if (!fs.existsSync(targetFile)) return;
    
    let content = fs.readFileSync(targetFile, 'utf-8');

    // Remove inline dark backgrounds
    content = content.replace(/style=\{\{\s*background:\s*'#111528'\s*\}\}/g, '');
    content = content.replace(/style=\{\{\s*background:\s*'#101423'\s*\}\}/g, '');
    content = content.replace(/style=\{\{\s*background:\s*'#0a0d18'\s*\}\}/g, '');
    content = content.replace(/style=\{\{\s*background:\s*'#1a1f35'\s*\}\}/g, '');
    content = content.replace(/style=\{\{\s*background:\s*'#0e111a'\s*\}\}/g, '');
    
    // Some cards have empty style={{  }} after replace, let's clean it up
    content = content.replace(/style=\{\{\s*\}\}/g, '');

    fs.writeFileSync(targetFile, content, 'utf-8');
    console.log(`Cleaned inline styles in ${targetFile}`);
});
