import { SystemService } from './src/modules/system/system.service';

async function reset() {
    try {
        console.log("Starting reset operational data process...");
        const result = await SystemService.resetData();
        console.log("Reset successful:", result);
    } catch (e) {
        console.error("Failed to reset:", e);
    } finally {
        process.exit(0);
    }
}
reset();
