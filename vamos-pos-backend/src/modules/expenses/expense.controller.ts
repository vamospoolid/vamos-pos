import { Request, Response } from 'express';
import { prisma } from '../../database/db';
import { catchAsync } from '../../utils/catchAsync';

export const getExpenses = catchAsync(async (req: Request, res: Response) => {
    const expenses = await prisma.expense.findMany({
        where: { deletedAt: null },
        orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: expenses });
});

export const createExpense = catchAsync(async (req: Request, res: Response) => {
    const { category, amount, description, date } = req.body;
    const expense = await prisma.expense.create({
        data: {
            category,
            amount: Number(amount),
            description,
            date: date ? new Date(date) : new Date()
        }
    });
    res.status(201).json({ success: true, data: expense });
});

export const deleteExpense = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.expense.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
    res.json({ success: true, message: 'Expense deleted successfully' });
});
