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
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const tRes = await fetch('http://localhost:3000/api/tournaments', { headers });
        const tData = await tRes.json();
        console.log("Tournaments API:", tData.data.length);

        if (tData.data.length === 0) {
            console.log("Creating FUN GAME tournament...");
            await fetch('http://localhost:3000/api/tournaments', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: 'FUN GAME', description: 'Testing', entryFee: 50000, prizePool: 1300000, maxPlayers: 32
                })
            });
            const tRes2 = await fetch('http://localhost:3000/api/tournaments', { headers });
            const tData2 = await tRes2.json();
            var tournament = tData2.data[0];
        } else {
            var tournament = tData.data[0];
        }

        console.log("Tournament:", tournament.name, tournament.id);

        let mRes = await fetch('http://localhost:3000/api/members', { headers });
        let mData = await mRes.json();
        let members = mData.data;
        console.log("Found members:", members.length);

        if (members.length < 32) {
            console.log("Adding members up to 32...");
            for (let i = members.length + 1; i <= 32; i++) {
                await fetch('http://localhost:3000/api/members', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name: `Player ${i}`, phone: `0811000${i.toString().padStart(2, '0')}` })
                });
            }
            let mRes2 = await fetch('http://localhost:3000/api/members', { headers });
            let mData2 = await mRes2.json();
            members = mData2.data;
        }

        let pCount = 0;
        console.log("Registering 32 participants...");
        for (let i = 0; i < 32; i++) {
            const regRes = await fetch(`http://localhost:3000/api/tournaments/${tournament.id}/register`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ memberId: members[i].id })
            });
            const regData = await regRes.json();
            if (regData.success) pCount++;
        }

        console.log(`Registered ${pCount} participants to tournament!`);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
