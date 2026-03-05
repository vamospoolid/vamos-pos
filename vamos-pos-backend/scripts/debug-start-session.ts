import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN' // I don't have a token, but I can check the code
    }
});

async function test() {
    try {
        // Find an available table
        const tablesRes = await axios.get('http://localhost:5000/api/tables');
        const availableTable = tablesRes.data.data.find((t: any) => t.status === 'AVAILABLE');
        if (!availableTable) {
            console.log('No available tables');
            return;
        }

        // Find a package
        const packagesRes = await axios.get('http://localhost:5000/api/pricing/packages');
        const pkg = packagesRes.data.data[0];
        if (!pkg) {
            console.log('No packages available');
            return;
        }

        console.log(`Starting session for table ${availableTable.name} with package ${pkg.name}...`);

        // This is just a simulation of what the frontend does
        const payload = {
            tableId: availableTable.id,
            packageId: pkg.id
        };

        // Since I don't have a token, I'll just check if the logic in the backend seems flawed
    } catch (err) {
        console.error(err);
    }
}
