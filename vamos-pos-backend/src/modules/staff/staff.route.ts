import { Router } from 'express';
import { StaffController } from './staff.controller';

const router = Router();

// Staff authentication
router.post('/login', StaffController.login);

// Venue GPS & Geofencing config
router.get('/venue', StaffController.getVenueLocation);
router.put('/venue', StaffController.updateVenueLocation);
router.post('/venue/resolve-maps', StaffController.resolveGoogleMapsUrl);

// Employee Approval & Jobdesk update
router.put('/employee/:employeeId/approval', StaffController.updateApprovalStatus);

// Attendance operations (Selfie + GPS + PIN Terminal + Admin Adjust + Auto Cutoff)
router.post('/attendance/checkin', StaffController.checkIn);
router.post('/attendance/checkout', StaffController.checkOut);
router.post('/attendance/clock-pin', StaffController.clockWithPin);
router.put('/attendance/:id/adjust', StaffController.adjustAttendance);
router.post('/attendance/auto-cutoff', StaffController.runAutoCutoff);
router.get('/attendance/history/:employeeId', StaffController.getAttendanceHistory);

// KPI, Leaderboard, Target Omzet Harian & Pengaturan Bonus
router.get('/leaderboard', StaffController.getLeaderboard);
router.get('/daily-omzet-milestone', StaffController.getDailyOmzetMilestone);
router.get('/bonus-config', StaffController.getBonusConfig);
router.put('/bonus-config', StaffController.updateBonusConfig);
router.put('/employee/:employeeId/jobdesk', StaffController.updateJobdesk);

// Waiter Order Taking Helpers (Tables, Products, Members & Active Cafe Sessions)
router.get('/tables', StaffController.getTables);
router.get('/products', StaffController.getProducts);
router.get('/members', StaffController.searchMembers);
router.get('/active-cafe-sessions', StaffController.getActiveCafeSessions);

// Mobile KDS for Kitchen & Barista
router.get('/kds', StaffController.getKDSOrders);
router.patch('/kds/:id/status', StaffController.updateKDSStatus);

// Work Shifts Management
router.get('/work-shifts', StaffController.getWorkShifts);
router.post('/work-shifts', StaffController.createWorkShift);
router.put('/work-shifts/:id', StaffController.updateWorkShift);
router.delete('/work-shifts/:id', StaffController.deleteWorkShift);

export default router;
