import { SyncService } from './src/modules/system/sync.service';
import dotenv from 'dotenv';
dotenv.config();

async function testSync() {
    console.log("Current Env:");
    console.log("VPS_SYNC_URL:", process.env.VPS_SYNC_URL);
    console.log("SYNC_SECRET:", process.env.SYNC_SECRET ? "SET" : "NOT SET");

    try {
        console.log("Running manual sync test...");
        const count = await SyncService.syncPendingData();
        console.log("Sync success! Total items synced:", count);
    } catch (e: any) {
        console.error("Sync Trial Failed:");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Message:", e.message);
        }
    } finally {
        process.exit(0);
    }
}
testSync();
