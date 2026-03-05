const fs = require('fs');
const path = require('path');

const files = [
    'Settings.tsx',
    'Pricing.tsx',
    'Members.tsx',
    'Inventory.tsx',
    'FnBOrder.tsx',
    'Expenses.tsx',
    'Employees.tsx',
    'Competitions.tsx',
    'App.tsx'
];

files.forEach(f => {
    const filePath = path.join(__dirname, 'src', f);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        let write = false;
        if (content.split('vamosConfirm').length === 2) { // only matches the import
            content = content.replace('vamosConfirm, ', '');
            content = content.replace(', vamosConfirm', ''); // in case it was at the end
            write = true;
        }
        if (content.split('vamosAlert').length === 2) {
            content = content.replace('vamosAlert, ', '');
            content = content.replace(', vamosAlert', '');
            write = true;
        }

        if (write) {
            fs.writeFileSync(filePath, content);
            console.log(`Cleaned up unused imports in ${f}`);
        }
    }
});
