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

        // Let's fix missing closing parenthesis for vamosConfirm
        // Original replace made: !(await vamosConfirm("msg")
        // We match that and add a closing paren.
        content = content.replace(/!\(await vamosConfirm\(([^)]+)\)/g, '!(await vamosConfirm($1))');

        fs.writeFileSync(filePath, content);
        console.log(`Fixed parenthesis in ${f}`);
    }
});
