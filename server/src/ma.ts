import { Request, Response } from "express";
import { sendQuery } from './model/oracledb';

interface MovingAverageData {
  date: string;
  movingAverage: number; // Moving average based on user-specified time range
}

interface QueryParams {
  stockId: string;
  latestDate: string;
  startDate?: string;
  endDate?: string;
}

export const getMA = async (req: Request, res: Response): Promise<void> => {
  const { stockId, timeRange, startDate, endDate } = req.body;

  if (!stockId) {
    res.status(400).json({ error: 'Stock ID is required' });
    return;
  }

  if (!timeRange) {
    res.status(400).json({ error: 'Time range is required' });
    return;
  }

  // Fetch the latest date for the specified stock
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

    // Map the user-specified time range to SQL intervals and window sizes
    const timeRangeMap: { [key: string]: { dateCondition: string; windowSize: number } } = {
      '1d': { dateCondition: `recorddate >= :latestDate - INTERVAL '1' DAY`, windowSize: 1 },
      '1w': { dateCondition: `recorddate >= :latestDate - INTERVAL '7' DAY`, windowSize: 5 },
      '1m': { dateCondition: `recorddate >= :latestDate - INTERVAL '30' DAY`, windowSize: 22 },
      //'3m': { dateCondition: `recorddate >= :latestDate - INTERVAL '90' DAY`, windowSize: 66 },
      //'6m': { dateCondition: `recorddate >= :latestDate - INTERVAL '180' DAY`, windowSize: 132 },
      '1y': { dateCondition: `recorddate >= ADD_MONTHS(:latestDate, -12)`, windowSize: 252 }
    };

    let queryParams: QueryParams = { stockId, latestDate };
    let dateCondition: string;
    let windowSize: number = 22; // default to monthly window size

    if (timeRange.startsWith('custom_')) {
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required for custom range' });
        return;
      }

      dateCondition = `recorddate >= TO_DATE(:startDate, 'YYYY-MM-DD') AND recorddate <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      queryParams = { ...queryParams, startDate, endDate };
    } else {
      const timeRangeData = timeRangeMap[timeRange];
      if (!timeRangeData) {
        res.status(400).json({ error: 'Invalid time range' });
        return;
      }
      dateCondition = timeRangeData.dateCondition;
      windowSize = timeRangeData.windowSize;
    }

    const movingAverageQuery = `
      WITH price_data AS (
        SELECT 
          recorddate, 
          close AS price
        FROM 
          ALIASHYNSKA.STOCKPERFORMANCE
        WHERE 
          stockid = :stockId
          AND ${dateCondition}
          AND recorddate <= :latestDate
        ORDER BY 
          recorddate ASC
      )
      SELECT 
        recorddate,
        AVG(price) OVER (
          ORDER BY recorddate 
          ROWS BETWEEN ${windowSize - 1} PRECEDING AND CURRENT ROW
        ) AS moving_average
      FROM price_data
      ORDER BY recorddate DESC
    `;

    const result = await sendQuery(movingAverageQuery, queryParams);

    if (!result || !result.rows || result.rows.length === 0) {
      res.status(404).json({ error: 'No moving average data found for the stock' });
      return;
    }

    const movingAverages: MovingAverageData[] = result.rows.map((row: any) => ({
      date: new Date(row.RECORDDATE).toISOString(),
      movingAverage: row.MOVING_AVERAGE
    }));

    res.status(200).json(movingAverages);
  } catch (error) {
    console.error('Error fetching moving average:', error);
    res.status(500).json({ error: 'Failed to fetch moving average' });
  }
};

export default { getMA };
