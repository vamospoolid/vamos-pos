import fs from 'fs';
import path from 'path';
import { prisma } from '../../database/db';
import { AppError } from '../../utils/errors';
import { ReportService } from '../reports/report.service';

export class StaffService {
    private static getBonusConfigFilePath() {
        const dir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dir)) {
            try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
        }
        return path.join(dir, 'bonus-config.json');
    }

    /**
     * Ambil Konfigurasi Pengaturan Sistem Bonus (Omzet Harian & Zero Late)
     */
    static getBonusConfig() {
        const filePath = this.getBonusConfigFilePath();
        const defaultConfig = {
            dailyOmzetTiers: [
                { level: 1, name: 'Tier 1 (Target Minimum)', target: 2000000, bonusPerStaff: 10000, label: 'Bronze Target' },
                { level: 2, name: 'Tier 2 (Target Reguler)', target: 3500000, bonusPerStaff: 20000, label: 'Silver Target' },
                { level: 3, name: 'Tier 3 (Target Super)', target: 5000000, bonusPerStaff: 35000, label: 'Gold Crown Target' }
            ],
            disciplineBonus: {
                targetDays: 30,
                bonusAmount: 150000,
                allowedAbsenceQuota: 2
            },
            attendanceHardware: {
                enableGpsValidation: true,
                enableCameraPhoto: true,
                googleMapsUrl: ''
            }
        };

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const parsed = JSON.parse(content);
                return {
                    dailyOmzetTiers: parsed.dailyOmzetTiers || defaultConfig.dailyOmzetTiers,
                    disciplineBonus: parsed.disciplineBonus || defaultConfig.disciplineBonus,
                    attendanceHardware: parsed.attendanceHardware ? { ...defaultConfig.attendanceHardware, ...parsed.attendanceHardware } : defaultConfig.attendanceHardware
                };
            }
        } catch (e) {
            console.error('Failed to read bonus-config.json, using defaults', e);
        }

        try {
            fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        } catch (_) {}

        return defaultConfig;
    }

    /**
     * Simpan / Perbarui Pengaturan Sistem Bonus dari POS Kasir / Owner
     */
    static updateBonusConfig(config: any) {
        const filePath = this.getBonusConfigFilePath();
        const current = this.getBonusConfig();
        const updated = {
            dailyOmzetTiers: Array.isArray(config.dailyOmzetTiers) ? config.dailyOmzetTiers : current.dailyOmzetTiers,
            disciplineBonus: config.disciplineBonus ? { ...current.disciplineBonus, ...config.disciplineBonus } : current.disciplineBonus,
            attendanceHardware: config.attendanceHardware ? { ...current.attendanceHardware, ...config.attendanceHardware } : current.attendanceHardware
        };
        fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    /**
     * Perbarui SOP & Jobdesk Karyawan secara Fleksibel
     */
    static async updateEmployeeJobdesk(employeeId: string, jobdesk: string) {
        return prisma.employee.update({
            where: { id: employeeId },
            data: { jobdesk }
        });
    }
    /**
     * Staff Login via Phone & PIN code
     */
    static async login(phone: string, pinCode: string) {
        if (!phone || !pinCode) {
            throw new AppError('Nomor HP dan PIN wajib diisi', 400);
        }

        const employee = await prisma.employee.findFirst({
            where: {
                phone: phone.trim(),
                deletedAt: null,
                status: 'ACTIVE'
            },
            include: {
                shift: true
            }
        });

        if (!employee) {
            throw new AppError('Karyawan tidak ditemukan atau tidak aktif', 404);
        }

        if (employee.approvalStatus === 'PENDING') {
            throw new AppError('Akun Anda masih menunggu konfirmasi & persetujuan dari kasir/manager', 403);
        }

        if (employee.approvalStatus === 'REJECTED') {
            throw new AppError('Pendaftaran akun staf ini telah ditolak oleh manajemen', 403);
        }

        if (!employee.pinCode || employee.pinCode.trim() !== pinCode.trim()) {
            throw new AppError('PIN yang Anda masukkan salah', 401);
        }

        return {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            phone: employee.phone,
            avatarUrl: employee.avatarUrl,
            jobdesk: employee.jobdesk || '1. Melayani pelanggan dengan ramah & profesional.\n2. Menjaga kebersihan area kerja & meja biliar.\n3. Memeriksa ketersediaan stok & pesanan FnB.\n4. Mematuhi SOP operasional & jam kerja shift.',
            approvalStatus: employee.approvalStatus,
            shift: employee.shift
        };
    }

    /**
     * Update Approval Status Staf dari POS Kasir
     */
    static async updateApprovalStatus(employeeId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', jobdesk?: string) {
        return prisma.employee.update({
            where: { id: employeeId },
            data: {
                approvalStatus: status,
                jobdesk: jobdesk !== undefined ? jobdesk : undefined
            }
        });
    }

    /**
     * Update Venue Coordinates, Geofencing Radius & Hardware Validation Toggles dari POS Kasir
     */
    static async updateVenueLocation(data: {
        latitude: number;
        longitude: number;
        radiusMeters?: number;
        enableGpsValidation?: boolean;
        enableCameraPhoto?: boolean;
        googleMapsUrl?: string;
    }) {
        const venue = await prisma.venue.findFirst({ where: { deletedAt: null } });
        if (!venue) throw new AppError('Venue tidak ditemukan', 404);

        // Simpan juga toggle hardware di bonus-config.json agar non-destruktif terhadap skema DB
        if (data.enableGpsValidation !== undefined || data.enableCameraPhoto !== undefined || data.googleMapsUrl !== undefined) {
            const currentConfig = this.getBonusConfig();
            this.updateBonusConfig({
                ...currentConfig,
                attendanceHardware: {
                    enableGpsValidation: data.enableGpsValidation !== undefined ? Boolean(data.enableGpsValidation) : currentConfig.attendanceHardware.enableGpsValidation,
                    enableCameraPhoto: data.enableCameraPhoto !== undefined ? Boolean(data.enableCameraPhoto) : currentConfig.attendanceHardware.enableCameraPhoto,
                    googleMapsUrl: data.googleMapsUrl !== undefined ? String(data.googleMapsUrl) : currentConfig.attendanceHardware.googleMapsUrl
                }
            });
        }

        const updatedVenue = await prisma.venue.update({
            where: { id: venue.id },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                attendanceRadiusMeters: data.radiusMeters || venue.attendanceRadiusMeters
            }
        });

        const hw = this.getBonusConfig().attendanceHardware;
        return {
            ...updatedVenue,
            radiusMeters: updatedVenue.attendanceRadiusMeters,
            enableGpsValidation: hw.enableGpsValidation,
            enableCameraPhoto: hw.enableCameraPhoto,
            googleMapsUrl: hw.googleMapsUrl
        };
    }

    /**
     * Resolve Koordinat Latitude & Longitude dari Link Google Maps (termasuk maps.app.goo.gl)
     */
    static async resolveGoogleMapsUrl(url: string) {
        if (!url || !url.trim()) {
            throw new AppError('Tautan Google Maps wajib diisi', 400);
        }

        let targetUrl = url.trim();
        try {
            // Ikuti redirect jika menggunakan shortlink maps.app.goo.gl / goo.gl
            if (targetUrl.includes('goo.gl') || targetUrl.includes('bit.ly')) {
                const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
                if (response.url) {
                    targetUrl = response.url;
                }
            }
        } catch (e) {
            console.warn('Redirect resolution warning:', e);
        }

        // Pattern 1: @lat,lng (e.g. @-3.4028794,119.213115)
        const atMatch = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]), resolvedUrl: targetUrl };
        }

        // Pattern 2: !3dlat!4dlng
        const bangMatch = targetUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (bangMatch) {
            return { latitude: parseFloat(bangMatch[1]), longitude: parseFloat(bangMatch[2]), resolvedUrl: targetUrl };
        }

        // Pattern 3: ?q=lat,lng atau query=lat,lng
        const queryMatch = targetUrl.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
        if (queryMatch) {
            return { latitude: parseFloat(queryMatch[1]), longitude: parseFloat(queryMatch[2]), resolvedUrl: targetUrl };
        }

        throw new AppError('Tidak dapat menemukan titik koordinat dari tautan tersebut. Pastikan tautan berasal dari Google Maps.', 400);
    }

    /**
     * Get Venue info for GPS Geofencing & Hardware Toggles
     */
    static async getVenueLocation() {
        const venue = await prisma.venue.findFirst({
            where: { deletedAt: null }
        });
        const hw = this.getBonusConfig().attendanceHardware;

        return {
            name: venue?.name || 'Vamos Arena',
            latitude: venue?.latitude || -8.6500,
            longitude: venue?.longitude || 115.2166,
            radiusMeters: venue?.attendanceRadiusMeters || 100,
            enableGpsValidation: hw?.enableGpsValidation ?? true,
            enableCameraPhoto: hw?.enableCameraPhoto ?? true,
            googleMapsUrl: hw?.googleMapsUrl || ''
        };
    }

    /**
     * Hitung jarak dua titik GPS (Haversine formula dalam meter)
     */
    static calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c);
    }

    /**
     * Check-in Attendance dengan Foto Selfie WebP, Validasi GPS, Pilihan Shift & Atomic Transaction (Standar POOOS)
     */
    static async checkIn(data: {
        employeeId: string;
        shiftId?: string;
        photoBase64?: string;
        lat?: number;
        lng?: number;
        notes?: string;
        channel?: string;
    }) {
        const employee = await prisma.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null },
            include: { shift: true }
        });

        if (!employee) throw new AppError('Karyawan tidak ditemukan', 404);

        const venue = await this.getVenueLocation();
        const isPosTerminal = data.channel === 'POS_TERMINAL';
        const enableGps = venue.enableGpsValidation ?? true;
        const enableCamera = venue.enableCameraPhoto ?? true;

        // Validasi Kamera (Bypass untuk Terminal Kasir fisik seperti di POOOS)
        if (enableCamera && !data.photoBase64 && !isPosTerminal) {
            throw new AppError('Wajib menyertakan foto selfie bukti kehadiran.', 400);
        }

        // Verifikasi GPS Radius jika venue memiliki konfigurasi lokasi
        let distanceIn: number | null = null;
        let isWithinRadius = true;

        if (venue.latitude && venue.longitude) {
            if (data.lat !== undefined && data.lng !== undefined && data.lat !== null && data.lng !== null) {
                distanceIn = this.calculateDistanceMeters(Number(data.lat), Number(data.lng), venue.latitude, venue.longitude);
                isWithinRadius = distanceIn <= venue.radiusMeters;
            } else if (enableGps && !isPosTerminal) {
                throw new AppError('Koordinat GPS wajib dikirim untuk verifikasi lokasi absensi.', 400);
            }

            if (enableGps && !isWithinRadius && !isPosTerminal) {
                throw new AppError(
                    `Anda berada ${distanceIn}m dari venue. Absen hanya diizinkan dalam radius ${venue.radiusMeters}m.`,
                    403
                );
            }
        }

        // Resolusi Shift (Mendukung pemilihan shift saat Clock-In atau fallback ke shift profil karyawan)
        let activeShift = employee.shift;
        if (data.shiftId && data.shiftId !== employee.shiftId) {
            const customShift = await prisma.workShift.findUnique({ where: { id: data.shiftId } });
            if (customShift) activeShift = customShift;
        }

        // Kalkulasi Keterlambatan berbasis Zona Waktu Lokal Outlet (Asia/Jakarta / WIB)
        let status = 'PRESENT';
        let lateMinutes = 0;

        if (activeShift) {
            const venueTz = 'Asia/Jakarta';
            const localTimeStr = new Intl.DateTimeFormat('en-US', {
                timeZone: venueTz,
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }).format(new Date());

            const [currentHour, currentMinute] = localTimeStr.split(':').map(Number);
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            const [shiftHour, shiftMinute] = activeShift.startTime.split(':').map(Number);
            const shiftTotalMinutes = shiftHour * 60 + shiftMinute;

            let diffMinutes = currentTotalMinutes - shiftTotalMinutes;

            // Penanganan Shift Malam (Lintas Tengah Malam)
            if (diffMinutes < -720) {
                diffMinutes += 1440;
            } else if (diffMinutes > 720) {
                diffMinutes -= 1440;
            }

            if (diffMinutes > activeShift.graceLateMinutes) {
                status = 'LATE';
                lateMinutes = diffMinutes;
            } else {
                status = 'PRESENT';
                lateMinutes = 0;
            }
        }

        // Catatan tambahan jarak GPS atau Terminal POS (seperti di POOOS)
        const noteParts: string[] = [];
        if (data.notes) noteParts.push(data.notes);
        if (isPosTerminal) noteParts.push('[Terminal POS]');
        if (distanceIn !== null) {
            noteParts.push(`[GPS: ${distanceIn}m${!isWithinRadius ? ' - Luar Radius' : ''}]`);
        }
        const finalNotes = noteParts.length > 0 ? noteParts.join(' ') : null;

        // Atomic Clock-In dengan prisma.$transaction untuk mencegah race condition double-insert (Standar POOOS)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const created = await prisma.$transaction(async (tx) => {
            const activeAttendance = await tx.attendance.findFirst({
                where: {
                    employeeId: data.employeeId,
                    checkIn: { gte: twentyFourHoursAgo },
                    checkOut: null
                },
                orderBy: { checkIn: 'desc' }
            });

            if (activeAttendance) {
                throw new AppError('Anda masih memiliki sesi absensi aktif yang belum checkout. Silakan lakukan absen pulang (Clock-Out) terlebih dahulu.', 400);
            }

            const existingToday = await tx.attendance.findFirst({
                where: {
                    employeeId: data.employeeId,
                    date: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                },
                orderBy: { checkIn: 'desc' }
            });

            if (existingToday && existingToday.checkOut) {
                throw new AppError('Anda sudah menyelesaikan absensi shift hari ini', 400);
            }

            return tx.attendance.create({
                data: {
                    employeeId: data.employeeId,
                    shiftId: activeShift?.id || employee.shiftId,
                    date: new Date(),
                    checkIn: new Date(),
                    checkInPhoto: data.photoBase64 || null,
                    checkInLat: data.lat || null,
                    checkInLng: data.lng || null,
                    status,
                    lateMinutes,
                    notes: finalNotes
                },
                include: {
                    employee: { select: { id: true, name: true, position: true } },
                    shift: true
                }
            });
        });

        return {
            ...created,
            distanceIn,
            isWithinRadius
        };
    }

    /**
     * Check-out Attendance (dengan Atomic Lookup Lintas Tengah Malam 24 Jam)
     */
    static async checkOut(data: {
        attendanceId?: string;
        employeeId?: string;
        photoBase64?: string;
        notes?: string;
    }) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        return prisma.$transaction(async (tx) => {
            let attendanceId = data.attendanceId;
            if (!attendanceId && data.employeeId) {
                const active = await tx.attendance.findFirst({
                    where: {
                        employeeId: data.employeeId,
                        checkOut: null,
                        checkIn: { gte: twentyFourHoursAgo }
                    },
                    orderBy: { checkIn: 'desc' }
                });
                if (active) attendanceId = active.id;
            }

            if (!attendanceId) throw new AppError('Anda belum melakukan Clock-In atau sesi absensi tidak ditemukan', 400);

            const existing = await tx.attendance.findUnique({ where: { id: attendanceId } });
            if (!existing) throw new AppError('Data absensi tidak ditemukan', 404);
            if (existing.checkOut) throw new AppError('Anda sudah check-out hari ini', 400);

            return tx.attendance.update({
                where: { id: attendanceId },
                data: {
                    checkOut: new Date(),
                    checkOutPhoto: data.photoBase64 || null,
                    notes: data.notes ? `${existing.notes ? existing.notes + ' | ' : ''}Out: ${data.notes}` : existing.notes
                },
                include: {
                    employee: { select: { id: true, name: true, position: true } },
                    shift: true
                }
            });
        });
    }

    /**
     * Terminal Absensi Kasir via PIN (Standar POOOS ClockInModal - Bypass GPS & Kamera HP)
     */
    static async clockWithPin(data: {
        pinCode: string;
        type: 'IN' | 'OUT';
        shiftId?: string;
        notes?: string;
    }) {
        if (!data.pinCode || data.pinCode.trim().length < 4) {
            throw new AppError('PIN absensi minimal 4 digit', 400);
        }
        if (!['IN', 'OUT'].includes(data.type)) {
            throw new AppError('Tipe absensi tidak valid (harus IN atau OUT)', 400);
        }

        const matchingEmployees = await prisma.employee.findMany({
            where: {
                deletedAt: null,
                status: 'ACTIVE',
                pinCode: data.pinCode.trim()
            },
            include: { shift: true }
        });

        if (matchingEmployees.length === 0) {
            throw new AppError('PIN salah atau karyawan tidak ditemukan/aktif', 401);
        }

        if (matchingEmployees.length > 1) {
            throw new AppError(
                `PIN digunakan oleh lebih dari 1 karyawan (${matchingEmployees.map(e => e.name).join(', ')}). Harap atur PIN unik di menu Daftar Staf.`,
                409
            );
        }

        const emp = matchingEmployees[0];

        if (data.type === 'IN') {
            const attendance = await this.checkIn({
                employeeId: emp.id,
                shiftId: data.shiftId,
                notes: data.notes,
                channel: 'POS_TERMINAL'
            });
            return {
                type: 'IN',
                message: `Clock In Berhasil: ${emp.name} (${attendance.status === 'LATE' ? `Terlambat ${attendance.lateMinutes}m` : 'Tepat Waktu'})`,
                attendance,
                employee: emp
            };
        } else {
            const attendance = await this.checkOut({
                employeeId: emp.id,
                notes: data.notes || '[Terminal POS]'
            });
            return {
                type: 'OUT',
                message: `Clock Out Berhasil: ${emp.name}`,
                attendance,
                employee: emp
            };
        }
    }

    /**
     * Koreksi Presensi Staf oleh Admin / Owner (Standar POOOS PUT /:id/adjust)
     */
    static async adjustAttendance(
        id: string,
        data: {
            checkIn?: string;
            checkOut?: string | null;
            status?: string;
            lateMinutes?: number;
            notes?: string;
        }
    ) {
        const existing = await prisma.attendance.findUnique({ where: { id } });
        if (!existing) throw new AppError('Data absensi tidak ditemukan', 404);

        const updateData: any = {};
        if (data.checkIn) updateData.checkIn = new Date(data.checkIn);
        if (data.checkOut !== undefined) {
            updateData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
        }
        if (data.status) updateData.status = data.status;
        if (data.lateMinutes !== undefined) updateData.lateMinutes = Number(data.lateMinutes) || 0;
        if (data.notes !== undefined) updateData.notes = data.notes;

        return prisma.attendance.update({
            where: { id },
            data: updateData,
            include: {
                employee: { select: { id: true, name: true, position: true } },
                shift: true
            }
        });
    }

    /**
     * Auto Cut-Off EOD: Menutup Otomatis Presensi Kemarin yang Lupa Clock-Out (Standar POOOS)
     */
    static async runAttendanceAutoCutoff() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const unclosed = await prisma.attendance.findMany({
            where: {
                checkOut: null,
                checkIn: { lt: todayStart }
            }
        });

        if (unclosed.length === 0) {
            return { count: 0, message: 'Tidak ada presensi menggantung dari hari sebelumnya.' };
        }

        for (const att of unclosed) {
            const clockInDate = att.checkIn ? new Date(att.checkIn) : new Date(att.date);
            const autoClockOut = new Date(clockInDate);
            autoClockOut.setHours(22, 0, 0, 0);

            if (autoClockOut <= clockInDate) {
                autoClockOut.setTime(clockInDate.getTime() + 8 * 60 * 60 * 1000);
            }

            const autoNote = att.notes
                ? `${att.notes} | [Auto Clock-Out: Lupa Absen Pulang]`
                : '[Auto Clock-Out: Lupa Absen Pulang]';

            await prisma.attendance.update({
                where: { id: att.id },
                data: {
                    checkOut: autoClockOut,
                    notes: autoNote
                }
            });
        }

        return {
            count: unclosed.length,
            message: `Auto Cut-off selesai. ${unclosed.length} presensi tertutup otomatis.`
        };
    }

    /**
     * Riwayat Absensi Staf (Rolling 45 hari untuk menjaga streak disiplin lintas bulan)
     */
    static async getAttendanceHistory(employeeId: string, monthStr?: string) {
        let gteDate: Date;
        let lteDate: Date;

        if (monthStr) {
            const now = new Date(monthStr + '-01');
            gteDate = new Date(now.getFullYear(), now.getMonth(), 1);
            lteDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else {
            // Ambil 45 hari terakhir mundur agar streak 30 hari lintas bulan tidak hilang saat tanggal 1
            gteDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
            lteDate = new Date();
        }

        return prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: gteDate,
                    lte: lteDate
                }
            },
            include: {
                shift: true
            },
            orderBy: { date: 'desc' }
        });
    }

    /**
     * Target Pendapatan Harian & Milestone Bonus Staf Shift
     * Menggunakan ReportService.getCurrentOperationalDayRevenue() agar 100% sinkron dan sama persis dengan Laporan POS
     */
    static async getDailyOmzetMilestone(venueId?: string) {
        // Ambil omzet resmi hari operasional berjalan (sinkron 100% dengan Laporan POS)
        let currentOmzet = 0;
        try {
            const reportRevenue = await ReportService.getCurrentOperationalDayRevenue();
            currentOmzet = Math.round(reportRevenue.revenue || 0);
        } catch (e) {
            console.error('Error fetching operational revenue from ReportService', e);
        }

        // Ambil rentang hari operasional resmi venue (sinkron 100% dengan Laporan POS & lintas tengah malam)
        const bounds = await ReportService.getOperationalDayBounds(0);

        // Ambil seluruh karyawan yang HADIR (Clock-In) pada hari operasional ini
        // (Mencakup Shift Siang yang sudah clock-out maupun Shift Malam yang sedang/selesai dinas)
        const attendancesToday = await prisma.attendance.findMany({
            where: {
                OR: [
                    { date: { gte: bounds.start, lte: bounds.end } },
                    { checkIn: { gte: bounds.start, lte: bounds.end } }
                ],
                checkIn: { not: null }
            },
            include: {
                employee: { select: { id: true, name: true, position: true } }
            },
            orderBy: { checkIn: 'asc' }
        });

        // Deduplikasi per karyawan agar jika ada staf yang absen lebih dari sekali tetap dihitung 1 staf
        const eligibleStaffMap = new Map<string, { id: string; name: string; position: string; isCheckedOut: boolean }>();
        for (const att of attendancesToday) {
            if (att.employee && !eligibleStaffMap.has(att.employee.id)) {
                eligibleStaffMap.set(att.employee.id, {
                    id: att.employee.id,
                    name: att.employee.name,
                    position: att.employee.position,
                    isCheckedOut: Boolean(att.checkOut)
                });
            }
        }

        const eligibleStaffList = Array.from(eligibleStaffMap.values());
        const staffCount = eligibleStaffList.length;

        // Konfigurasi Jenjang Target Omzet Harian (Dinamis dari Pengaturan)
        const bonusConfig = this.getBonusConfig();
        const tiers = bonusConfig.dailyOmzetTiers || [
            { level: 1, name: 'Tier 1 (Target Minimum)', target: 2000000, bonusPerStaff: 10000, label: 'Bronze Target' },
            { level: 2, name: 'Tier 2 (Target Reguler)', target: 3500000, bonusPerStaff: 20000, label: 'Silver Target' },
            { level: 3, name: 'Tier 3 (Target Super)', target: 5000000, bonusPerStaff: 35000, label: 'Gold Crown Target' }
        ];

        let unlockedTier = 0;
        let earnedBonusPerStaff = 0;
        for (const t of tiers) {
            if (currentOmzet >= t.target) {
                unlockedTier = t.level;
                earnedBonusPerStaff = t.bonusPerStaff;
            }
        }

        const nextTier = tiers.find((t: any) => t.level === unlockedTier + 1) || null;
        const gapToNext = nextTier ? Math.max(0, nextTier.target - currentOmzet) : 0;
        const progressToNext = nextTier 
            ? Math.min(100, Math.round((currentOmzet / nextTier.target) * 100))
            : 100;

        const totalBonusPool = earnedBonusPerStaff * staffCount;

        return {
            currentOmzet,
            operationalDay: bounds.label,
            onDutyStaffCount: staffCount,
            onDutyStaffList: eligibleStaffList.map(s => s.name),
            eligibleStaffDetails: eligibleStaffList,
            unlockedTier,
            earnedBonusPerStaff,
            totalBonusPool,
            nextTier,
            gapToNext,
            progressToNext,
            tiers,
            disciplineBonus: bonusConfig.disciplineBonus
        };
    }

    /**
     * Dashboard Leaderboard Karyawan Teladan & KPI
     */
    static async getLeaderboard(periodMonth?: string) {
        const targetMonth = periodMonth || new Date().toISOString().substring(0, 7); // e.g. "2026-09"
        const bonusConfig = this.getBonusConfig();
        const ALLOWED_ABSENCE_QUOTA = bonusConfig.disciplineBonus?.allowedAbsenceQuota ?? 2;
        const DISCIPLINE_BONUS_AMOUNT = bonusConfig.disciplineBonus?.bonusAmount ?? 150000;

        const employees = await prisma.employee.findMany({
            where: { deletedAt: null, status: 'ACTIVE' },
            include: {
                bonuses: {
                    where: { periodMonth: targetMonth }
                },
                attendances: {
                    where: {
                        date: {
                            gte: new Date(targetMonth + '-01'),
                            lte: new Date(new Date(targetMonth + '-01').getFullYear(), new Date(targetMonth + '-01').getMonth() + 1, 0, 23, 59, 59)
                        }
                    }
                }
            }
        });

        const leaderboard = employees.map(emp => {
            const totalDaysPresent = emp.attendances.length;
            const onTimeDays = emp.attendances.filter(a => a.status === 'PRESENT').length;
            const lateDays = emp.attendances.filter(a => a.status === 'LATE').length;
            
            // Hitung hari kerja yang telah berjalan di bulan target (maksimal 26 hari kerja)
            const today = new Date();
            const isCurrentMonth = today.toISOString().startsWith(targetMonth);
            const daysInMonthSoFar = isCurrentMonth ? Math.min(today.getDate(), 26) : 26;
            
            const expectedWorkingDays = Math.max(1, daysInMonthSoFar);
            const absentDays = Math.max(0, expectedWorkingDays - totalDaysPresent);
            
            // Kuota toleransi ketidakhadiran (Maks 2x per bulan tidak dipotong penalti)
            const toleratedAbsenceDays = Math.min(absentDays, ALLOWED_ABSENCE_QUOTA);
            const unexcusedAbsenceDays = Math.max(0, absentDays - ALLOWED_ABSENCE_QUOTA);
            
            // Penalti: Terlambat (-3% per kali), Absen melebihi toleransi 2x (-10% per hari)
            const latePenalty = lateDays * 3;
            const absencePenalty = unexcusedAbsenceDays * 10;
            const attendanceScore = Math.max(0, Math.min(100, 100 - latePenalty - absencePenalty));
            
            const bonusRecord = emp.bonuses[0];
            const ratingScore = bonusRecord?.customerRatingScore || 5.0;
            
            // Bonus kedisiplinan jika zero late dan absen tidak melebihi batas toleransi
            const totalBonus = bonusRecord?.totalBonus || (lateDays === 0 && unexcusedAbsenceDays === 0 ? DISCIPLINE_BONUS_AMOUNT : 0);

            // Total Skor Prestasi Murni Kedisiplinan Kehadiran (70%) + Rating Pelanggan (30%)
            const overallScore = Math.round((attendanceScore * 0.7) + (ratingScore * 10 * 0.3));

            return {
                employeeId: emp.id,
                name: emp.name,
                position: emp.position,
                avatarUrl: emp.avatarUrl,
                attendanceScore,
                onTimeDays,
                lateDays,
                totalDays: totalDaysPresent,
                absentDays,
                toleratedAbsenceDays,
                unexcusedAbsenceDays,
                allowedQuota: ALLOWED_ABSENCE_QUOTA,
                toleranceStatus: `${toleratedAbsenceDays}/${ALLOWED_ABSENCE_QUOTA} Terpakai`,
                salesScore: 0,
                ratingScore,
                overallScore,
                totalBonus,
                badge: overallScore >= 95 ? 'STAFF_OF_THE_MONTH' : (attendanceScore === 100 && unexcusedAbsenceDays === 0) ? 'PERFECT_ATTENDANCE' : null
            };
        });

        // Urutkan dari skor tertinggi
        leaderboard.sort((a, b) => b.overallScore - a.overallScore);

        return {
            periodMonth: targetMonth,
            rankings: leaderboard
        };
    }

    /**
     * Search Members for Waiter Order Taking
     */
    static async searchMembers(query: string) {
        if (!query || query.trim().length === 0) return [];
        const q = query.trim();
        return prisma.member.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q } }
                ]
            },
            select: {
                id: true,
                name: true,
                phone: true,
                tier: true,
                loyaltyPoints: true
            },
            take: 10
        });
    }

    /**
     * Get Active Cafe Sessions (Pending Bills in Cafe/Lounge)
     */
    static async getActiveCafeSessions() {
        return prisma.session.findMany({
            where: {
                OR: [
                    {
                        tableId: null,
                        billingType: 'FNB_ONLY',
                        status: 'PENDING'
                    },
                    {
                        table: { type: 'CAFE' },
                        status: { in: ['ACTIVE', 'PENDING'] }
                    },
                    {
                        billingType: 'FNB_ONLY',
                        status: { in: ['ACTIVE', 'PENDING'] }
                    }
                ]
            },
            select: {
                id: true,
                customerName: true,
                tableId: true,
                status: true,
                billingType: true,
                table: { select: { id: true, name: true, type: true } },
                memberId: true,
                fnbAmount: true,
                totalAmount: true,
                createdAt: true,
                member: {
                    select: { id: true, name: true, phone: true, tier: true, loyaltyPoints: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get Tables for Waiter Order Taking
     */
    static async getWaiterTables() {
        return prisma.table.findMany({
            where: { deletedAt: null },
            orderBy: { relayChannel: 'asc' }
        });
    }

    /**
     * Get Products / Menu for Waiter Order Taking
     * Automatically filters out operational / internal staff items (Op.)
     */
    static async getWaiterProducts(includeOp = false) {
        const products = await prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        });

        if (includeOp) return products;

        return products.filter(p => {
            const name = (p.name || '').trim().toLowerCase();
            return (
                !name.startsWith('op.') &&
                !name.startsWith('op ') &&
                !name.startsWith('op-') &&
                !name.startsWith('(op)') &&
                !name.startsWith('operasional')
            );
        });
    }

    /**
     * Work Shifts Management for POS Frontend
     */
    static async getWorkShifts() {
        return prisma.workShift.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });
    }

    static async createWorkShift(data: { name: string; startTime: string; endTime: string; graceLateMinutes?: number }) {
        if (!data.name || !data.startTime || !data.endTime) {
            throw new AppError('Nama shift, jam mulai, dan jam selesai wajib diisi', 400);
        }
        return prisma.workShift.create({
            data: {
                name: data.name.trim(),
                startTime: data.startTime.trim(),
                endTime: data.endTime.trim(),
                graceLateMinutes: Number(data.graceLateMinutes) || 15
            }
        });
    }

    static async updateWorkShift(id: string, data: { name?: string; startTime?: string; endTime?: string; graceLateMinutes?: number }) {
        const found = await prisma.workShift.findUnique({ where: { id } });
        if (!found) throw new AppError('Shift kerja tidak ditemukan', 404);

        return prisma.workShift.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name.trim() : undefined,
                startTime: data.startTime !== undefined ? data.startTime.trim() : undefined,
                endTime: data.endTime !== undefined ? data.endTime.trim() : undefined,
                graceLateMinutes: data.graceLateMinutes !== undefined ? Number(data.graceLateMinutes) : undefined
            }
        });
    }

    static async deleteWorkShift(id: string) {
        const found = await prisma.workShift.findUnique({ where: { id } });
        if (!found) throw new AppError('Shift kerja tidak ditemukan', 404);

        // Unlink any employees assigned to this shift first
        await prisma.employee.updateMany({
            where: { shiftId: id },
            data: { shiftId: null }
        });

        return prisma.workShift.delete({
            where: { id }
        });
    }
}
