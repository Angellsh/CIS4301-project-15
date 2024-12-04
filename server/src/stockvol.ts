import { Request, Response } from "express";
import { sendQuery } from './model/oracledb';

interface VolatilityData {
  date: string;
  dailyReturn: number; // Daily return percentage
}

export const getStockVolatility = async (req: Request, res: Response): Promise<void> => {
  const stockId = req.body.stockId;
  const timeRange = req.body.timeRange;

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

    const timeRangeMap: { [key: string]: string } = {
      '1d': "INTERVAL '1' DAY",
      '1w': "INTERVAL '7' DAY",
      '1m': "INTERVAL '30' DAY",
      '1y': "ADD_MONTHS(:latestDate, -12)"
    };

    const timeInterval = timeRangeMap[timeRange];
    if (timeInterval) {
      query = `
      WITH price_data AS (
        SELECT recorddate, close AS price
        FROM ALIASHYNSKA.STOCKPERFORMANCE
        WHERE stockid = :stockId
        AND recorddate >= ${timeRange === '1y' ? '' : ':latestDate - '}${timeInterval}
        AND recorddate <= :latestDate
        ORDER BY recorddate
      ),
      daily_returns AS (
        SELECT 
          recorddate,
          (price - LAG(price) OVER (ORDER BY recorddate)) / LAG(price) OVER (ORDER BY recorddate) AS daily_return
        FROM price_data
      )
      SELECT recorddate, daily_return
      FROM daily_returns
      WHERE daily_return IS NOT NULL
      `;
    } else {
      res.status(400).json({ error: 'Invalid time range' });
      return;
    }

    const result = await sendQuery(query, queryParams);

    if (!result || !result.rows || result.rows.length === 0) {
      res.status(404).json({ error: 'No volatility data found for the stock' });
      return;
    }

    const dailyReturns: VolatilityData[] = result.rows.map((row: any) => ({
      date: new Date(row.RECORDDATE).toISOString(),
      dailyReturn: row.DAILY_RETURN,
      
    }));

    // Calculate volatility (standard deviation of daily returns)
    const dailyReturnValues = dailyReturns.map(item => item.dailyReturn);
    const mean = dailyReturnValues.reduce((acc, val) => acc + val, 0) / dailyReturnValues.length;
    const squaredDifferences = dailyReturnValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / squaredDifferences.length;
    const volatility = Math.sqrt(variance);

    res.status(200).json(dailyReturns);
  } catch (error) {
    console.error('Error fetching stock volatility:', error);
    res.status(500).json({ error: 'Failed to fetch stock volatility' });
  }
};

export default { getStockVolatility };
