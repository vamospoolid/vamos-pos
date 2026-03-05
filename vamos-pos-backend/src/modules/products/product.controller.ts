import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';

export class ProductController {
    static async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await ProductService.createProduct(req.body);
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const category = req.query.category as string;
            const products = await ProductService.getProducts(category);
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await ProductService.getProductById(req.params.id);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const product = await ProductService.updateProduct(req.params.id, req.body);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async updateStock(req: Request, res: Response, next: NextFunction) {
        try {
            const stockChange = parseInt(req.body.stockChange);
            if (isNaN(stockChange)) {
                return res.status(400).json({ success: false, message: 'Invalid stock change value' });
            }
            const product = await ProductService.updateStock(req.params.id, stockChange);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            await ProductService.deleteProduct(req.params.id);
            res.json({ success: true, message: 'Product deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}
