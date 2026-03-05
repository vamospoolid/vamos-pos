import { Router } from 'express';
import { MemberController } from './member.controller';

const router = Router();

router.post('/', MemberController.createMember);
router.get('/', MemberController.getMembers);
router.get('/phone/:phone', MemberController.getMemberByPhone); // Find by phone (useful for cashier checking)
router.get('/:id', MemberController.getMemberById);
router.put('/:id', MemberController.updateMember);
router.patch('/:id/points', MemberController.addLoyaltyPoints); // Manual or system points adjustment
router.patch('/:id/verify/wa', MemberController.verifyWa); // Confirm WhatsApp verification
router.patch('/:id/verify/status', MemberController.updateVerificationStatus); // Admin verification status
router.delete('/:id', MemberController.deleteMember);

export default router;
