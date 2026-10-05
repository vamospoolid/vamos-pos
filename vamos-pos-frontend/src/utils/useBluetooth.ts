/**
 * useBluetooth.ts
 * Hook untuk mendeteksi dan connect ke printer thermal Bluetooth
 * menggunakan Web Bluetooth API (Chrome 56+ / Edge / Electron Chromium)
 *
 * Kompatibel dengan printer thermal Bluetooth seperti:
 * - EPSON TM-m30
 * - RPP300 / RPP02N (printer billiard café umum)
 * - POS-5890K, POS-58HB
 * - Xprinter XP-365B
 * - Dan printer BT lain yang mendukung SPP (Serial Port Profile)
 */

import { useState, useCallback, useEffect } from 'react';

// ─── ESC/POS Command Builders ───────────────────────────────────────────────

const ESC = 0x1b;
const GS  = 0x1d;

/** Encode string ke Uint8Array (latin-1, kompatibel thermal) */
function encodeText(text: string): Uint8Array {
    const arr: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        arr.push(code < 256 ? code : 63); // '?' fallback untuk karakter non-latin
    }
    return new Uint8Array(arr);
}

/** Initialize printer */
function CMD_INIT() { return new Uint8Array([ESC, 0x40]); }

/** Center alignment */
function CMD_CENTER() { return new Uint8Array([ESC, 0x61, 0x01]); }

/** Left alignment */
function CMD_LEFT() { return new Uint8Array([ESC, 0x61, 0x00]); }

/** Bold ON */
function CMD_BOLD_ON() { return new Uint8Array([ESC, 0x45, 0x01]); }

/** Bold OFF */
function CMD_BOLD_OFF() { return new Uint8Array([ESC, 0x45, 0x00]); }

/** Double height + bold (untuk header) */
function CMD_DOUBLE_SIZE() { return new Uint8Array([ESC, 0x21, 0x30]); }

/** Normal size */
function CMD_NORMAL_SIZE() { return new Uint8Array([ESC, 0x21, 0x00]); }

/** Cut paper */
function CMD_CUT() { return new Uint8Array([GS, 0x56, 0x01]); }

/** Feed N lines */
function CMD_FEED(n: number) { return new Uint8Array([ESC, 0x64, n]); }

/** Divider line sesuai lebar printer */
function divider(width = 32) {
    return encodeText('-'.repeat(width) + '\n');
}

/** Pad teks agar rata kanan-kiri dalam satu baris */
function padRow(left: string, right: string, width = 32): string {
    const totalUsed = left.length + right.length;
    const spaces = Math.max(1, width - totalUsed);
    return left + ' '.repeat(spaces) + right + '\n';
}

/** Gabungkan beberapa Uint8Array menjadi satu */
function mergeBytes(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}

// ─── Receipt Data Type ───────────────────────────────────────────────────────

export interface ReceiptData {
    venue?: { name?: string; address?: string; phone?: string };
    id?: string;
    paidAt?: Date | string;
    table?: { name?: string };
    member?: { name?: string };
    memberId?: string;
    startTime?: string;
    endTime?: string;
    pricingName?: string;
    tableAmount?: number;
    fnbAmount?: number;
    orders?: Array<{ product?: { name?: string }; quantity: number; total?: number }>;
    serviceAmount?: number;
    taxAmount?: number;
    discount?: number;
    discountLabel?: string;
    finalAmount?: number;
    totalAmount?: number;
    method?: string;
    receivedAmount?: number;
    cashier?: { name?: string };
    cashierName?: string;
    printerWidth?: number; // 32 = 58mm, 42 = 80mm
}

// ─── Build ESC/POS Receipt Bytes ─────────────────────────────────────────────

export function buildReceiptBytes(data: ReceiptData): Uint8Array {
    const W = data.printerWidth || 32;
    const parts: Uint8Array[] = [];
    const push = (...chunks: Uint8Array[]) => parts.push(...chunks);

    push(CMD_INIT());

    // HEADER
    push(CMD_CENTER(), CMD_DOUBLE_SIZE(), CMD_BOLD_ON());
    push(encodeText((data.venue?.name || 'VAMOS POS').toUpperCase() + '\n'));
    push(CMD_NORMAL_SIZE(), CMD_BOLD_OFF());
    if (data.venue?.address) push(encodeText(data.venue.address + '\n'));
    if (data.venue?.phone)   push(encodeText('Telp: ' + data.venue.phone + '\n'));
    push(CMD_LEFT(), divider(W));

    // BILL INFO
    const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
    const dateStr = paidAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = paidAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    push(encodeText(padRow('Tanggal', `${dateStr} ${timeStr}`, W)));
    push(encodeText(padRow('Bill #', (data.id?.substring(0, 8) || '-').toUpperCase(), W)));
    if (data.table?.name) push(encodeText(padRow('Meja', data.table.name, W)));
    if (data.memberId && data.member?.name) push(encodeText(padRow('Member', data.member.name, W)));
    push(divider(W));

    // TABLE SESSION
    if ((data.tableAmount || 0) > 0) {
        push(CMD_BOLD_ON());
        push(encodeText('BILLIARD / TABLE\n'));
        push(CMD_BOLD_OFF());
        const startMs = data.startTime ? new Date(data.startTime).getTime() : null;
        const endMs   = data.endTime   ? new Date(data.endTime).getTime()   : null;
        let durStr = 'Table session';
        if (startMs && endMs) {
            const mins = Math.round((endMs - startMs) / 60000);
            durStr = `${Math.floor(mins / 60)}j ${mins % 60}m main`;
        }
        push(encodeText(padRow(durStr, 'Rp ' + Math.round(data.tableAmount || 0).toLocaleString('id-ID'), W)));
        if (data.pricingName) push(encodeText('  (' + data.pricingName + ')\n'));
    }

    // FnB ORDERS
    if (data.orders && data.orders.length > 0) {
        push(CMD_BOLD_ON());
        push(encodeText('FOOD & BEVERAGE\n'));
        push(CMD_BOLD_OFF());
        for (const o of data.orders) {
            const name = (o.product?.name || 'Item').substring(0, W - 10) + ' x' + o.quantity;
            const rp   = 'Rp ' + Math.round(o.total || 0).toLocaleString('id-ID');
            push(encodeText(padRow(name, rp, W)));
        }
        push(encodeText(padRow('  Subtotal F&B', 'Rp ' + Math.round(data.fnbAmount || 0).toLocaleString('id-ID'), W)));
    } else if ((data.fnbAmount || 0) > 0) {
        push(encodeText(padRow('F&B Charges', 'Rp ' + Math.round(data.fnbAmount || 0).toLocaleString('id-ID'), W)));
    }

    // TOTALS
    push(divider(W));
    const subtotal = (data.tableAmount || 0) + (data.fnbAmount || 0);
    push(encodeText(padRow('Subtotal', 'Rp ' + subtotal.toLocaleString('id-ID'), W)));
    if ((data.serviceAmount || 0) > 0)
        push(encodeText(padRow('Service Charge', 'Rp ' + (data.serviceAmount || 0).toLocaleString('id-ID'), W)));
    if ((data.taxAmount || 0) > 0)
        push(encodeText(padRow('PPN', 'Rp ' + (data.taxAmount || 0).toLocaleString('id-ID'), W)));
    if ((data.discount || 0) > 0) {
        const label = data.discountLabel ? `Diskon (${data.discountLabel})` : 'Diskon';
        push(encodeText(padRow(label, '-Rp ' + (data.discount || 0).toLocaleString('id-ID'), W)));
    }
    push(CMD_BOLD_ON());
    push(encodeText(padRow('TOTAL', 'Rp ' + (data.finalAmount || 0).toLocaleString('id-ID'), W)));
    push(CMD_BOLD_OFF());

    // PAYMENT
    push(divider(W));
    push(encodeText(padRow('Pembayaran', (data.method || 'CASH').toUpperCase(), W)));
    if ((data.receivedAmount || 0) > 0 && data.method !== 'QRIS') {
        const change = Math.max(0, (data.receivedAmount || 0) - (data.finalAmount || 0));
        push(encodeText(padRow('Diterima', 'Rp ' + Math.round(data.receivedAmount || 0).toLocaleString('id-ID'), W)));
        push(encodeText(padRow('Kembalian', 'Rp ' + Math.round(change).toLocaleString('id-ID'), W)));
    }
    push(encodeText(padRow('Kasir', data.cashier?.name || data.cashierName || 'Kasir', W)));

    // FOOTER
    push(divider(W));
    push(CMD_CENTER());
    push(encodeText('Terima kasih telah bermain!\n'));
    push(encodeText('Sampai jumpa lagi :)\n'));
    push(encodeText('-- Powered by VamosPOS --\n'));
    push(CMD_FEED(3));
    push(CMD_CUT());

    return mergeBytes(...parts);
}

// ─── Web Bluetooth Hook ───────────────────────────────────────────────────────

export type BluetoothStatus =
    | 'idle'
    | 'scanning'
    | 'connected'
    | 'printing'
    | 'error'
    | 'unsupported';

// Comprehensive BLE Service UUIDs untuk printer thermal
// PENTING: DILARANG memasukkan Classic SPP UUID (00001101-...) karena akan memicu crash "GATT operation failed for unknown reason" di Windows Web Bluetooth.
export const PRINTER_SERVICE_UUIDS = [
    // 1. Rongta / RPP Series (RPP02N, RPP300, dsb.)
    '0000ae30-0000-1000-8000-00805f9b34fb',
    // 2. Standard BLE UART / CC2540 / CC2541 / HM-10 (Banyak printer portable 58mm & clone)
    '0000ffe0-0000-1000-8000-00805f9b34fb',
    // 3. POS Thermal Generic (WizarPOS, MPT, dsb.)
    '000018f0-0000-1000-8000-00805f9b34fb',
    // 4. POS-58HB / Xprinter BLE
    '0000ff00-0000-1000-8000-00805f9b34fb',
    // 5. ISSC BLE Serial (Microchip/ISSC chipsets)
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    // 6. Common ESC/POS BLE Custom
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    // 7. WeChat / Tencent Chinese POS Standard
    '0000fee7-0000-1000-8000-00805f9b34fb',
    // 8. Generic Alternative BLE Clone Service
    '0000fff0-0000-1000-8000-00805f9b34fb',
    // 9. Feasycom BLE UART
    '0000fff1-0000-1000-8000-00805f9b34fb',
    // 10. Nordic UART Service (NUS)
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
];

export const WRITE_CHAR_UUIDS = [
    // Rongta RPP02N write chars
    '0000ae01-0000-1000-8000-00805f9b34fb',
    '0000ae31-0000-1000-8000-00805f9b34fb',
    // HM-10 / CC2541 write char
    '0000ffe1-0000-1000-8000-00805f9b34fb',
    // POS thermal generic write chars
    '00002af1-0000-1000-8000-00805f9b34fb',
    '000018f1-0000-1000-8000-00805f9b34fb',
    // POS-58HB / Xprinter write char
    '0000ff02-0000-1000-8000-00805f9b34fb',
    // ISSC transparent UART write char
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
    // ESC/POS write char
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
    // WeChat write char
    '0000fec7-0000-1000-8000-00805f9b34fb',
    '0000fec8-0000-1000-8000-00805f9b34fb',
    // Clone write chars
    '0000fff1-0000-1000-8000-00805f9b34fb',
    '0000fff2-0000-1000-8000-00805f9b34fb',
    // Nordic NUS TX (write) char
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    '00001525-1212-efde-1523-785feabcd123',
];

// Prefix nama printer BT yang umum di pasaran (termasuk RPP, POS, Xprinter, dsb)
const PRINTER_NAME_PREFIXES = [
    'RPP', 'rpp', 'RPP02', 'RPP02N', 'POS', 'pos', 'POS-58', 'POS-80', 
    'Xprinter', 'xprinter', 'XP-', 'Printer', 'printer', 'Bluetooth', 'BT', 'bt', 
    'MTP', 'mtp', 'TP-', 'BlueBamboo', 'iDPRT', 'MHT', 'SP-', 'ZJ-', 'JP-', 
    'SZZT', 'MPT', 'iPosPrinter', 'Rongta', 'rongta', 'Thermal', 'thermal', 
    'InnerPrinter', 'EPSON', 'Star', '58', '80'
];

// ─── Module-Level Shared State (Singleton across Tabs & Modals) ────────────────
let sharedDevice: any = null;
let sharedCharacteristic: any = null;
let sharedStatus: BluetoothStatus = 'idle';
let sharedDeviceName: string | null = null;
let sharedErrorMsg: string | null = null;

const listeners = new Set<() => void>();

function notifyListeners() {
    listeners.forEach(fn => fn());
}

function setSharedState(status: BluetoothStatus, msg?: string | null, name?: string | null) {
    sharedStatus = status;
    if (msg !== undefined) sharedErrorMsg = msg;
    if (name !== undefined) sharedDeviceName = name;
    notifyListeners();
}

function handleGattDisconnected() {
    console.log('[BT] Device disconnected');
    sharedCharacteristic = null;
    setSharedState('idle', null, null);
}

export function useBluetooth() {
    const [, setTick] = useState(0);

    const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

    useEffect(() => {
        const sync = () => setTick(t => t + 1);
        listeners.add(sync);
        return () => {
            listeners.delete(sync);
        };
    }, []);

    /** Putus koneksi printer */
    const disconnect = useCallback(() => {
        try {
            if (sharedDevice?.gatt?.connected) {
                sharedDevice.gatt.disconnect();
            }
        } catch (e) {
            console.warn('[BT] Disconnect warning:', e);
        }
        sharedDevice = null;
        sharedCharacteristic = null;
        setSharedState('idle', null, null);
    }, []);

    /** Scan + connect ke printer Bluetooth */
    const scanAndConnect = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setSharedState('unsupported', 'Browser tidak mendukung Web Bluetooth. Gunakan Google Chrome atau Microsoft Edge.');
            return false;
        }

        setSharedState('scanning', null);

        let device: any = null;
        try {
            device = await (navigator as any).bluetooth.requestDevice({
                filters: PRINTER_NAME_PREFIXES.map(p => ({ namePrefix: p })),
                optionalServices: PRINTER_SERVICE_UUIDS,
            });
        } catch (pickerErr: any) {
            const msg = pickerErr?.message || '';
            if (msg.includes('cancelled') || msg.includes('chooser') || msg.includes('User cancelled')) {
                setSharedState('idle', null);
            } else {
                setSharedState('error', 'Gagal memilih printer: ' + msg);
            }
            return false;
        }

        if (!device) {
            setSharedState('idle', null);
            return false;
        }

        setSharedState('scanning', null, device.name || 'Printer Bluetooth');
        sharedDevice = device;
        device.removeEventListener('gattserverdisconnected', handleGattDisconnected);
        device.addEventListener('gattserverdisconnected', handleGattDisconnected);

        try {
            // Step 1: Connect to GATT with retry loop (terutama untuk Windows Bluetooth stack)
            let server: any = null;
            let lastConnectErr: any = null;

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    if (!device.gatt.connected) {
                        server = await device.gatt.connect();
                    } else {
                        server = device.gatt;
                    }
                    if (server && server.connected) break;
                } catch (e: any) {
                    lastConnectErr = e;
                    console.warn(`[BT] Connect attempt ${attempt}/3 failed:`, e?.message);
                    if (attempt < 3) {
                        await new Promise(r => setTimeout(r, 600));
                    }
                }
            }

            if (!server || !server.connected) {
                throw lastConnectErr || new Error('Gagal terhubung ke GATT server printer.');
            }

            // Step 2: Stabilization delay for Windows OS GATT service enumeration
            await new Promise(r => setTimeout(r, 400));

            // Step 3: Find writable characteristic
            let foundChar: any = null;
            let foundServiceUUID: string = '';

            // Metode Utama: Enumerasi service yang aktif di perangkat via server.getPrimaryServices()
            try {
                const services = await server.getPrimaryServices();
                console.log(`[BT] Discovered ${services.length} primary service(s) on ${device.name}`);
                
                for (const service of services) {
                    try {
                        const chars = await service.getCharacteristics();
                        
                        // Cek apakah ada characteristic dari daftar WRITE_CHAR_UUIDS
                        for (const targetUUID of WRITE_CHAR_UUIDS) {
                            const match = chars.find((c: any) => c.uuid.toLowerCase() === targetUUID.toLowerCase());
                            if (match && (match.properties.write || match.properties.writeWithoutResponse)) {
                                foundChar = match;
                                foundServiceUUID = service.uuid;
                                break;
                            }
                        }
                        if (foundChar) break;

                        // Jika tidak ada di daftar target, ambil characteristic pertama yang writable
                        for (const c of chars) {
                            if (c.properties.write || c.properties.writeWithoutResponse) {
                                foundChar = c;
                                foundServiceUUID = service.uuid;
                                break;
                            }
                        }
                        if (foundChar) break;
                    } catch (charErr) {
                        console.warn(`[BT] Error inspecting chars in service ${service.uuid}:`, charErr);
                    }
                }
            } catch (servicesErr) {
                console.warn('[BT] getPrimaryServices() fallback to individual queries:', servicesErr);
            }

            // Metode Fallback: Coba satu per satu UUID dari PRINTER_SERVICE_UUIDS jika getPrimaryServices() kosong
            if (!foundChar) {
                for (const svcUUID of PRINTER_SERVICE_UUIDS) {
                    try {
                        const service = await server.getPrimaryService(svcUUID);
                        const chars = await service.getCharacteristics();
                        for (const c of chars) {
                            if (c.properties.write || c.properties.writeWithoutResponse) {
                                foundChar = c;
                                foundServiceUUID = svcUUID;
                                break;
                            }
                        }
                    } catch {
                        // Skip jika service tidak ada di device
                    }
                    if (foundChar) break;
                }
            }

            if (!foundChar) {
                throw new Error('Printer terhubung via Bluetooth, tetapi layanan cetak (write characteristic) tidak ditemukan. Pastikan printer dalam mode BLE.');
            }

            sharedCharacteristic = foundChar;
            const pName = device.name || 'RPP02N_BLE';
            setSharedState('connected', null, pName);
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('vamos_bt_printer_name', pName);
            }
            console.log(`[BT] Berhasil terkoneksi ke ${pName} (service: ${foundServiceUUID}, char: ${foundChar.uuid})`);
            return true;
        } catch (err: any) {
            console.error('[BT] Connection error:', err);
            const msg: string = err?.message || '';

            // Putus jika ada status hanging
            try {
                if (device?.gatt?.connected) {
                    device.gatt.disconnect();
                }
            } catch { /* ignore */ }

            sharedCharacteristic = null;

            let friendlyMsg = msg;
            if (msg.includes('GATT operation failed') || msg.includes('unknown reason')) {
                friendlyMsg = 'Koneksi GATT ditolak oleh Windows. Solusi: Matikan printer 3 detik lalu nyalakan kembali. Pastikan printer tidak sedang terhubung ke Bluetooth HP / aplikasi lain.';
            } else if (msg.includes('NetworkError') || msg.includes('Connection failed')) {
                friendlyMsg = 'Koneksi terputus. Pastikan printer dalam jarak dekat dan baterai menyala.';
            }

            setSharedState('error', friendlyMsg);
            return false;
        }
    }, [isSupported]);

    /** Kirim bytes ke printer dalam safe BLE chunks (max 64-100 byte) dengan pacing delay */
    const sendBytes = useCallback(async (data: Uint8Array): Promise<void> => {
        const char = sharedCharacteristic;
        if (!char) throw new Error('Printer tidak terkoneksi');

        // Safe MTU chunking: BLE thermal printer umumnya memiliki buffer 20-100 byte
        const maxChunk = char.maxWriteWithoutResponseSize 
            ? Math.min(char.maxWriteWithoutResponseSize, 100) 
            : 64;
        const CHUNK = Math.max(20, maxChunk);

        for (let i = 0; i < data.length; i += CHUNK) {
            const chunk = data.slice(i, i + CHUNK);
            if (char.properties.writeWithoutResponse) {
                await char.writeValueWithoutResponse(chunk);
            } else {
                await char.writeValue(chunk);
            }
            // Pacing delay 25ms untuk mencegah buffer overflow pada printer thermal BLE
            if (i + CHUNK < data.length) {
                await new Promise(r => setTimeout(r, 25));
            }
        }
    }, []);

    /**
     * Print receipt ke printer BT
     * Auto-connect jika belum ada koneksi aktif
     */
    const printReceipt = useCallback(async (
        receiptData: ReceiptData,
        printerWidth = 32
    ): Promise<boolean> => {
        let ok = sharedStatus === 'connected' && sharedCharacteristic !== null;
        if (!ok) ok = await scanAndConnect();
        if (!ok) return false;
        try {
            setSharedState('printing');
            const bytes = buildReceiptBytes({ ...receiptData, printerWidth });
            await sendBytes(bytes);
            setSharedState('connected');
            return true;
        } catch (err: any) {
            console.error('[BT] Print error:', err);
            setSharedState('error', err?.message || 'Gagal mencetak ke printer');
            return false;
        }
    }, [scanAndConnect, sendBytes]);

    /** Cetak test print */
    const testPrint = useCallback(async (printerWidth = 32): Promise<boolean> => {
        return printReceipt({
            venue: { name: 'VAMOS POOL & CAFE', address: 'Test Print Bluetooth OK!' },
            id: 'TEST0001',
            paidAt: new Date(),
            table: { name: 'Meja Test' },
            tableAmount: 50000,
            finalAmount: 50000,
            method: 'TEST',
        }, printerWidth);
    }, [printReceipt]);

    return {
        status: sharedStatus,
        deviceName: sharedDeviceName,
        errorMsg: sharedErrorMsg,
        isSupported,
        isConnected: (sharedStatus === 'connected' || sharedStatus === 'printing') && sharedCharacteristic !== null,
        isPrinting: sharedStatus === 'printing',
        lastKnownPrinterName: typeof window !== 'undefined'
            ? localStorage.getItem('vamos_bt_printer_name')
            : null,
        scanAndConnect,
        disconnect,
        printReceipt,
        testPrint,
        buildReceiptBytes,
    };
}
