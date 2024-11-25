import { Request, Response } from "express";
import { sendQuery } from './model/oracledb';

interface Stock {
    STOCKID: string,
    NAME: string,
    CATEGORY: string
}

export const getStockById = async (req: Request, res: Response): Promise<void> => {
    const stockId = req.body.stockId;

    if (!stockId) {
        res.status(400).json({ error: 'Stock ID is required' });
        return;
    }

    const query = `
        SELECT stockid, name, category 
        FROM ALIASHYNSKA.STOCK 
        WHERE stockid = :stockId
    `;

    try {
        const result = await sendQuery(query, { stockId });
        
        if (!result || !result.rows || result.rows.length === 0) {
            res.status(404).json({ error: 'Stock not found' });
            return;
        }

        const stock = result.rows[0] as Stock;
        res.status(200).json(stock);
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock information' });
    }
};

export default { getStockById };