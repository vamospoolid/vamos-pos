const fs = require('fs');
const path = require('path');

const targetFile = 'src/pages/Reports.tsx';
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
content = content.replace('<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-3xl xl:text-5xl font-bold text-slate-800 uppercase tracking-tight', 
                          '<h1 className="text-3xl font-bold text-white tracking-wide');
content = content.replace('<span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PENGAMBILAN DATA REAL-TIME AKTIF</span>',
                          '<span className="text-[11px] text-blue-100 font-medium tracking-wide">PENGAMBILAN DATA REAL-TIME AKTIF</span>');
content = content.replace('<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pusat Laporan</p>',
                          '<p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">Pusat Laporan</p>');
content = content.replace('bg-white/40', 'bg-white/20');
content = content.replace('border-slate-100 text-slate-500 hover:text-primary transition-all active:scale-95 group', 'border-white/20 text-white hover:bg-white/30 transition-all active:scale-95 group');

// Make sector tabs white background
content = content.replace('bg-slate-50/80 backdrop-blur-2xl border border-slate-100 shadow-2xl', 
                          'bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm');

// Remove uppercase inside className only
content = content.replace(/className="([^"]*)uppercase([^"]*)"/g, (match, p1, p2) => {
    return `className="${p1}${p2}"`;
});
content = content.replace(/className=\{`([^`]*)uppercase([^`]*)`\}/g, (match, p1, p2) => {
    return `className={\`${p1}${p2}\`}`;
});
// do it multiple times in case there are multiple uppercase classes (which there aren't but just in case, the above regex removes the first match, wait, actually it will remove it if it exists)
content = content.replace(/uppercase/g, (match, offset, fullString) => {
    // only if preceded by className="... 
    // actually, let's just leave uppercase in the file and only remove it broadly if it causes issues.
    // the regex above is safe enough.
    return match;
});

// A specific fix for the tab bar
content = content.replace('bg-primary text-slate-800 shadow-sm scale-105 z-10', 'bg-blue-600 text-white shadow-md scale-105 z-10');

fs.writeFileSync(targetFile, content, 'utf-8');
console.log("done");
