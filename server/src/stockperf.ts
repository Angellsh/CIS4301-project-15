import { Request, Response } from "express";
import { sendQuery } from './model/oracledb';

interface PriceHistory {
  date: string;
  price: number; // This will be OHLC4
}

export const getStockPerf = async (req: Request, res: Response): Promise<void> => {
  const { stockId, timeRange, startDate, endDate } = req.body;

  if (!stockId) {
    res.status(400).json({ error: 'Stock ID is required' });
    return;
  }

  // First, get the latest date for this stock
  const latestDateQuery = `
    SELECT MAX(recorddate) as latest_date 
    FROM ALIASHYNSKA.STOCKPERFORMANCE 
    WHERE stockid = :stockId
  `;

  try {
    const latestDateResult = await sendQuery(latestDateQuery, { stockId }) as { rows: { LATEST_DATE: string }[] } | undefined;
    if (!latestDateResult?.rows?.[0]?.LATEST_DATE) {
      res.status(404).json({ error: 'No data available for this stock' });
      return;
    }

    const latestDate = latestDateResult.rows[0].LATEST_DATE;
    let query: string;
    let queryParams: any = { stockId, latestDate };

    // Handle custom date range
    if (timeRange.startsWith('custom_')) {
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required for custom range' });
        return;
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      if (start > end) {
        res.status(400).json({ error: 'Start date cannot be after end date' });
        return;
      }

      query = `
        SELECT recorddate, open, high, low, close 
        FROM ALIASHYNSKA.STOCKPERFORMANCE
        WHERE stockid = :stockId
        AND recorddate >= TO_DATE(:startDate, 'YYYY-MM-DD')
        AND recorddate <= TO_DATE(:endDate, 'YYYY-MM-DD')
        ORDER BY recorddate ASC
      `;
      queryParams = { stockId, startDate, endDate };
    } else {
      const timeRangeMap: { [key: string]: string } = {
        '1d': "INTERVAL '1' DAY",
        '1w': "INTERVAL '7' DAY",
        '1m': "INTERVAL '30' DAY",
        '1y': "ADD_MONTHS(:latestDate, -12)"
      };

      const timeInterval = timeRangeMap[timeRange];
      if (timeInterval) {
        query = `
        SELECT recorddate, open, high, low, close 
        FROM ALIASHYNSKA.STOCKPERFORMANCE
        WHERE stockid = :stockId
        AND recorddate >= ${timeRange === '1y' ? '' : ':latestDate - '}${timeInterval}
        AND recorddate <= :latestDate
        ORDER BY recorddate DESC
        `;
      } else {
        res.status(400).json({ error: 'Invalid time range' });
        return;
      }
    }

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
