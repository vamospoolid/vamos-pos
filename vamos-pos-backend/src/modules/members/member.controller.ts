import { Request, Response, NextFunction } from 'express';
import { MemberService } from './member.service';
import { getIO } from '../../socket';

export class MemberController {
    static async createMember(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await MemberService.createMember(req.body);
            console.log('[Socket] Emitting members:updated');
            getIO().emit('members:updated');
            res.status(201).json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async getMembers(req: Request, res: Response, next: NextFunction) {
        try {
            const members = await MemberService.getMembers();
            res.json({ success: true, data: members });
        } catch (error) { next(error); }
    }

    static async getMemberById(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await MemberService.getMemberById(req.params.id);
            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async getMemberByPhone(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await MemberService.getMemberByPhone(req.params.phone);
            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async updateMember(req: Request, res: Response, next: NextFunction) {
        try {
            const member = await MemberService.updateMember(req.params.id, req.body);
            getIO().emit('members:updated');
            res.json({ success: true, data: member });
        } catch (error) { next(error); }
    }

    static async addLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
        try {
            const points = parseInt(req.body.points);
            if (isNaN(points)) {
                return res.status(400).json({ success: false, message: 'Invalid points value' });
            }
            const member = await MemberService.addLoyaltyPoints(req.params.id, points);
            res.json({ success: true, message: `Added ${points} pts`, data: member });
        } catch (error) { next(error); }
    }

    static async deleteMember(req: Request, res: Response, next: NextFunction) {
        try {
            await MemberService.deleteMember(req.params.id);
            getIO().emit('members:updated');
            res.json({ success: true, message: 'Member deleted successfully' });
        } catch (error) { next(error); }
    }

    static async verifyWa(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await MemberService.verifyWa(req.params.id);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }

    static async updateVerificationStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { status } = req.body;
            const result = await MemberService.updateVerificationStatus(req.params.id, status);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }
}
