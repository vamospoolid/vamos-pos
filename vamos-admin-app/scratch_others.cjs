const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/Players.tsx',
    'src/pages/Events.tsx',
    'src/pages/Announcements.tsx',
    'src/pages/Bookings.tsx' // if exists
];

filesToProcess.forEach(targetFile => {
    if (!fs.existsSync(targetFile)) return;
    
    let content = fs.readFileSync(targetFile, 'utf-8');

    // Colors & Backgrounds
    content = content.replace(/bg-\[#101423\]/g, 'bg-slate-50');
    content = content.replace(/bg-\[#111528\]/g, 'bg-slate-50');
    content = content.replace(/bg-\[#1a1f35\]/g, 'bg-white');
    content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50');
    content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-slate-50');

    // Borders
    content = content.replace(/border-white\/5/g, 'border-slate-100');
    content = content.replace(/border-white\/10/g, 'border-slate-200');

    // Text
    content = content.replace(/text-white/g, 'text-slate-800');
    content = content.replace(/text-slate-300/g, 'text-slate-600');
    content = content.replace(/text-slate-400/g, 'text-slate-500');

    // Fonts
    content = content.replace(/font-black/g, 'font-bold');
    content = content.replace(/italic /g, ' ');
    content = content.replace(/ italic/g, '');
    content = content.replace(/tracking-tighter/g, 'tracking-tight');
    content = content.replace(/tracking-widest/g, 'tracking-wider');
    content = content.replace(/tracking-\[0\.[1234]em\]/g, 'tracking-wider');

    // Card / Input
    content = content.replace(/fiery-card/g, 'bg-white rounded-[24px] shadow-sm border border-slate-100');
    content = content.replace(/fiery-input/g, 'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all');
    content = content.replace(/fiery-btn-primary/g, 'bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-md transition-all active:scale-95');

    // Hovers
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-100');
    content = content.replace(/hover:bg-white\/\[0\.03\]/g, 'hover:bg-slate-50');

    // Clean up shadows
    content = content.replace(/shadow-\[0_0_[^\]]+\]/g, 'shadow-sm');

    // Fix headers to keep text-white against blue layout backdrop
    content = content.replace(/<h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight"/g, '<h1 className="text-xl font-bold text-white tracking-wide"');
    content = content.replace(/<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-3xl xl:text-5xl font-bold text-slate-800 uppercase tracking-tight/g, '<h1 className="text-3xl font-bold text-white tracking-wide');
    content = content.replace(/<h1 className="text-4xl font-bold text-slate-800 uppercase tracking-tight/g, '<h1 className="text-3xl font-bold text-white tracking-wide');
    content = content.replace(/<p className="text-\[10px\] font-bold text-slate-500 uppercase tracking-wider mb-2">/g, '<p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">');
    
    // Remove uppercase inside className only
    content = content.replace(/className="([^"]*)uppercase([^"]*)"/g, (match, p1, p2) => {
        return `className="${p1}${p2}"`;
    });
    content = content.replace(/className=\{`([^`]*)uppercase([^`]*)`\}/g, (match, p1, p2) => {
        return `className={\`${p1}${p2}\`}`;
    });

    // Fix modal overlay backgrounds that became slate-50 instead of black/80
    content = content.replace(/fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50\/80 backdrop-blur-sm/g, 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm');
    content = content.replace(/fixed inset-0 bg-slate-50\/80 backdrop-blur-sm z-50/g, 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50');
    content = content.replace(/fixed inset-0 z-50 bg-slate-50\/80 backdrop-blur-md/g, 'fixed inset-0 z-50 bg-black/50 backdrop-blur-md');

    // Common fixes for blue layout wrapper block
    content = content.replace(/<div className="flex justify-between items-center bg-white\/10 backdrop-blur-md/g, '<div className="flex justify-between items-center bg-white/10 backdrop-blur-md');

    fs.writeFileSync(targetFile, content, 'utf-8');
    console.log(`Processed ${targetFile}`);
});
