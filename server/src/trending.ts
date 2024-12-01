import { Request, Response } from "express";
import { sendQuery } from "./model/oracledb";


interface TrendingStock {
    STOCKID: string;
    PERCENT: number;
  }

  export const getTrendingStocks = async (req: Request, res: Response): Promise<void> => {
    const query = `
    SELECT stockid, AVG((high + low + close) / 3) AS average_price
    FROM ALIASHYNSKA.STOCKPERFORMANCE
    GROUP BY stockid
    ORDER BY average_price DESC
    FETCH FIRST 5 ROWS ONLY
    `;
  
    try {
      console.log("Executing query:", query);
  
      const result = await sendQuery(query, {});
      console.log("Query result:", result);
  
      if (!result || !result.rows || result.rows.length === 0) {
        console.warn("No trending stocks found.");
        res.status(404).json({ error: "No trending stocks found." });
        return;
      }
  
      const trendingStocks = result.rows.map((row: any) => ({
        STOCKID: row.STOCKID,
        LATEST_PRICE: row.LATEST_PRICE,
        PRICE_5_DAYS_AGO: row.PRICE_5_DAYS_AGO,
        ABSOLUTE_GAIN: row.ABSOLUTE_GAIN,
        PERCENTAGE_GAIN: row.PERCENTAGE_GAIN,
      }));
  
      console.log("Trending stocks:", trendingStocks);
      res.status(200).json(trendingStocks);
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
      res.status(500).json({ error: "Failed to fetch trending stocks." });
    }
  };
  

export default { getTrendingStocks };
