async function main() {
    try {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'kasir@vamos.pos', password: 'kasir123' })
        });

        const loginData = await loginRes.json();
        const token = loginData.token || (loginData.data && loginData.data.token);
        if (!token) {
            console.log("Login failed", loginData);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
            '/tables',
            '/sessions/active',
            '/sessions/pending',
            '/pricing/packages',
            '/products',
            '/venues',
            '/reports/daily-revenue?days=1',
            '/reports/today-utilization-split',
            '/members'
        ];

        for (const ep of endpoints) {
            console.log("Testing:", ep);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch(`http://localhost:3000/api${ep}`, { headers, signal: controller.signal });
                clearTimeout(timeoutId);
                console.log("SUCCESS:", ep, res.status);
            } catch (e) {
                console.log("FAILED:", ep, e.name);
            }
        }
    } catch (e) {
        console.error("API error:", e.message);
    }
}
main();
