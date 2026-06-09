import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../utils/errors';


export class TournamentCreativeService {
    private static getGenAI() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new AppError('Gemini API Key tidak terkonfigurasi. Silakan tambahkan GEMINI_API_KEY di file .env', 500);
        }
        return new GoogleGenerativeAI(apiKey);
    }

    /**
     * Menghasilkan prompt gambar & copy sosmed berdasarkan detail turnamen
     */
    static async generatePromoPack(data: {
        name: string;
        prizePool: number;
        prizes: string;
        entryFee: number;
        rules: string;
        style: string;
        date: string;
        venue: string;
    }) {
        const genAI = this.getGenAI();
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const promptText = `
        Anda adalah asisten pemasaran digital profesional untuk arena billiard Vamos Pool.
        Buatlah paket promo turnamen biliar berdasarkan data berikut:
        - Nama Turnamen: ${data.name}
        - Total Hadiah (Prize Pool): Rp ${data.prizePool.toLocaleString('id-ID')}
        - Pembagian Hadiah (Prizes detail): ${data.prizes}
        - Biaya Pendaftaran: Rp ${data.entryFee.toLocaleString('id-ID')}
        - Aturan Turnamen: ${data.rules}
        - Tanggal/Waktu: ${data.date}
        - Lokasi (Venue): ${data.venue}
        - Gaya Desain Visual Poster: ${data.style} (misalnya: Cyberpunk Neon, Classic Retro, Luxury Gold, dll.)

        Hasilkan output berupa JSON dengan dua properti:
        1. "imagePrompt": Prompt deskripsi gambar (dalam Bahasa Inggris) yang sangat detail untuk disalin ke generator gambar AI seperti Bing Image Creator atau Midjourney. Prompt harus mendeskripsikan background bernuansa meja biliar yang sesuai gaya desain "${data.style}", pencahayaan dramatis, dan HARUS menginstruksikan AI untuk membiarkan area kosong besar di tengah/tengah bawah untuk diisi teks nantinya (jangan ada tulisan bawaan AI pada gambar).
        2. "caption": Copywriting promosi media sosial (WhatsApp & Instagram) dalam Bahasa Indonesia yang persuasif, berjarak rapi, dilengkapi dengan emoji billiard/olahraga, detail turnamen di atas, dan ajakan bertindak (CTA) untuk mendaftar.

        Contoh format JSON respon:
        {
          "imagePrompt": "A stunning high-resolution billiard table in a futuristic cyberpunk room with neon green and purple lights, cinematic composition, leaving a large empty dark space in the center for custom text overlay, photorealistic, 4k",
          "caption": "🎱 VAMOS CHAMPIONSHIP IS HERE! 🎱\\n\\nAre you ready..."
        }
        `;

        try {
            const result = await model.generateContent(promptText);
            const textResponse = result.response.text();
            return JSON.parse(textResponse);
        } catch (error: any) {
            throw new AppError(`Gagal menghubungi Gemini API: ${error.message}`, 500);
        }
    }

    /**
     * Menganalisis gambar (kopi/venue/fnb) dan membuat caption serta tulisan overlay
     */
    static async analyzeImagePromo(imageBuffer: Buffer, mimeType: string, briefText: string) {
        const genAI = this.getGenAI();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        // Konversi buffer gambar ke format bagian inlineData untuk Gemini
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };

        const promptText = `
        Anda adalah asisten pemasaran digital profesional untuk arena biliar & cafe Vamos Pool.
        Analisis gambar yang dilampirkan ini (yang bisa berupa foto kopi, makanan cafe, sudut arena biliar, dll.).
        Berdasarkan isi gambar tersebut dan instruksi promo singkat ini: "${briefText}", buatlah promosi media sosial.

        Hasilkan output berupa JSON dengan dua properti:
        1. "caption": Copywriting promosi media sosial (WhatsApp & Instagram) dalam Bahasa Indonesia yang persuasif, menarik, berjarak rapi, mencerminkan produk dalam foto, dan menyertakan promo dari instruksi "${briefText}".
        2. "overlayText": Rekomendasi teks pendek (1 sampai 3 kata) yang kontras dan menarik untuk digambar/ditempelkan di atas foto tersebut (misal: "COFFEE TIME", "VAMOS COZY", "FRIDAY PROMO").

        Format JSON respon wajib seperti ini:
        {
          "caption": "Teks promosi lengkap...",
          "overlayText": "TEKS PENDEK OVERLAY"
        }
        `;

        try {
            const result = await model.generateContent([promptText, imagePart]);
            const textResponse = result.response.text();
            return JSON.parse(textResponse);
        } catch (error: any) {
            throw new AppError(`Gagal menganalisis gambar via Gemini API: ${error.message}`, 500);
        }
    }
}
