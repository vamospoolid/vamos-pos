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

        // Ensure not already imported
        if (!content.includes("import { vamosAlert, vamosConfirm }")) {
            content = content.replace(
                "import { api } from './api';",
                "import { api } from './api';\nimport { vamosAlert, vamosConfirm } from './utils/dialog';"
            );
        }

        content = content.replace(/!confirm\(/g, "!(await vamosConfirm(");
        content = content.replace(/\balert\(/g, "vamosAlert(");

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${f}`);
    }
});
