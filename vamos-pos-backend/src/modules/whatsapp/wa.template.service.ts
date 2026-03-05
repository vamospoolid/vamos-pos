import { prisma } from '../../database/db';

// ── ID tetap untuk setiap trigger ────────────────────────────────────────────
export const WA_TEMPLATE_IDS = {
    WELCOME_MEMBER: 'wa_welcome_member',
    PAYMENT_RECEIPT: 'wa_payment_receipt',
    BOOKING_CONFIRM: 'wa_booking_confirm',
    WAITLIST_CONFIRM: 'wa_waitlist_confirm',
    WAITLIST_READY: 'wa_waitlist_ready',
} as const;


// ── Default templates ─────────────────────────────────────────────────────────
const DEFAULTS: Record<string, { name: string; body: string }> = {
    [WA_TEMPLATE_IDS.WELCOME_MEMBER]: {
        name: 'Selamat Datang Member Baru',
        body: `Halo {{name}}! 👋\n\nSelamat bergabung di *{{venue}}*! 🎉\n\nTerima kasih telah mendaftar sebagai member kami. Sekarang Anda dapat menikmati berbagai keuntungan member, mulai dari poin loyalti hingga diskon khusus.\n\nSelamat bermain! 🎱`,
    },
    [WA_TEMPLATE_IDS.PAYMENT_RECEIPT]: {
        name: 'Notifikasi Pembayaran',
        body: `Halo {{name}}! 🧾\n\nTerima kasih telah bermain di {{venue}}.\nPembayaran Anda untuk meja *{{table}}* sebesar *Rp {{amount}}* telah kami terima.\n\nSelamat beristirahat dan sampai jumpa kembali! 🎱`,
    },
    [WA_TEMPLATE_IDS.BOOKING_CONFIRM]: {
        name: 'Konfirmasi Booking',
        body: `Halo {{name}}! 📅\n\nBooking Anda di *{{venue}}* telah dikonfirmasi.\n\n🗓 Tanggal: {{date}}\n🕐 Waktu: {{time}}\n🎱 Meja: {{table}}\n\nTerima kasih! Sampai jumpa di {{venue}}.`,
    },
    [WA_TEMPLATE_IDS.WAITLIST_CONFIRM]: {
        name: 'Antrean Diterima',
        body: `Halo {{name}}! 🎱\n\nBooking/Antrean Anda di {{venue}} telah kami terima.\n\nDetail:\n- Meja: {{table}}\n- Jam: {{time}}\n\nTerima kasih! Tunggu kabar dari Kasir kami ya.`,
    },
    [WA_TEMPLATE_IDS.WAITLIST_READY]: {
        name: 'Meja Siap (Panggil Antrean)',
        body: `Halo {{name}}! 🚨🎱\n\nMeja Anda sudah siap!\nSilakan segera menuju meja Kasir {{venue}}.\nTerima kasih!`,
    },
};


export class WaTemplateService {

    /**
     * Pastikan semua template default sudah ada di database.
     * Dipanggil saat server start.
     */
    static async ensureDefaults() {
        for (const [id, { name, body }] of Object.entries(DEFAULTS)) {
            await prisma.waTemplate.upsert({
                where: { id },
                update: {},          // jangan overwrite jika sudah diedit user
                create: { id, name, body, imageUrl: null, isActive: true },
            });
        }
    }


    static async getAll() {
        return prisma.waTemplate.findMany({ orderBy: { id: 'asc' } });
    }

    static async getById(id: string) {
        return prisma.waTemplate.findUnique({ where: { id } });
    }

    static async update(id: string, body: string, imageUrl: string | null, isActive: boolean, updatedBy?: string) {
        return prisma.waTemplate.update({
            where: { id },
            data: { body, imageUrl, isActive, updatedBy },
        });
    }


    static async resetToDefault(id: string) {
        const def = DEFAULTS[id];
        if (!def) throw new Error(`No default found for template: ${id}`);
        return prisma.waTemplate.update({
            where: { id },
            data: { body: def.body, imageUrl: null, isActive: true },
        });
    }


    /**
     * Render template — ganti semua {{variable}} dengan nilai nyata.
     */
    static render(body: string, vars: Record<string, string>): string {
        return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    }

    /**
     * Ambil template aktif dan render langsung.
     * Returns null jika template tidak aktif atau tidak ada.
     */
    static async renderTemplate(id: string, vars: Record<string, string>): Promise<{ body: string; imageUrl: string | null } | null> {
        const tpl = await prisma.waTemplate.findUnique({ where: { id } });
        if (!tpl || !tpl.isActive) return null;
        return {
            body: WaTemplateService.render(tpl.body, vars),
            imageUrl: tpl.imageUrl
        };
    }

}
