import { Request, Response } from "express";
import { sendQuery } from './model/oracledb';

interface PriceHistory {
  date: string;
  price: number; // This will be OHLC4
}

export const getStockPerf = async (req: Request, res: Response): Promise<void> => {
  const stockId = req.body.stockId;
  const timeRange = req.body.timeRange; 

  if (!stockId) {
    res.status(400).json({ error: 'Stock ID is required' });
    return;
  }

  let query: string;
  let queryParams: any = { stockId };

  if (timeRange === '1d') {
    query = `
      SELECT recorddate, open, high, low, close 
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockId
      ORDER BY recorddate DESC
      FETCH FIRST 30 ROWS ONLY
    `;
  } else if (timeRange === '1w') {
    query = `
      SELECT recorddate, open, high, low, close 
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockId
      ORDER BY recorddate DESC
      FETCH FIRST 200 ROWS ONLY
    `;
  } else if (timeRange === '1m') {
    query = `
      SELECT recorddate, open, high, low, close 
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockId
      ORDER BY recorddate DESC
      FETCH FIRST 900 ROWS ONLY
    `;
  } else if (timeRange === '1y') {
    query = `
      SELECT recorddate, open, high, low, close 
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockId
      ORDER BY recorddate DESC
    `;
  } else {
    res.status(400).json({ error: 'Invalid time range' });
    return;
  }

  try {
    const result = await sendQuery(query, queryParams);

    if (!result || !result.rows || result.rows.length === 0) {
      res.status(404).json({ error: 'No performance data found for the stock' });
      return;
    }

    const performanceData: PriceHistory[] = result.rows.map((row: any) => ({
      date: new Date(row.RECORDDATE).toISOString(), 
      price: (row.OPEN + row.HIGH + row.LOW + row.CLOSE) / 4, // Calculate OHLC4
    }));

    res.status(200).json(performanceData);
  } catch (error) {
    console.error('Error fetching stock performance:', error);
    res.status(500).json({ error: 'Failed to fetch stock performance' });
  }
};

export default { getStockPerf };
