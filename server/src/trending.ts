import { Request, Response } from "express";
import { sendQuery } from "./model/oracledb";


interface TrendingStock {
    STOCKID: string;
    PERCENT: number;
  }

  export const getTrendingStocks = async (req: Request, res: Response): Promise<void> => {
    const query = `
  WITH recent_prices AS (
      SELECT 
          stockid, 
          close AS close_price, 
          recorddate,
          ROW_NUMBER() OVER (PARTITION BY stockid ORDER BY recorddate DESC) AS row_num
      FROM 
          ALIASHYNSKA.STOCKPERFORMANCE
  ),
  price_changes AS (
      SELECT 
          p1.stockid, 
          p1.close_price AS latest_close,
          p5.close_price AS close_5_days_ago,
          ((p1.close_price - p5.close_price) / p5.close_price) * 100 AS percentage_change
      FROM 
          recent_prices p1
      JOIN 
          recent_prices p5
      ON 
          p1.stockid = p5.stockid
      WHERE 
          p1.row_num = 1 AND p5.row_num = 5
  )
  SELECT 
      stockid, 
      percentage_change
  FROM 
      price_changes
  ORDER BY 
      percentage_change DESC
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
        PERCENT: row.PERCENTAGE_CHANGE,
      }));
  
      console.log("Trending stocks:", trendingStocks);
      res.status(200).json(trendingStocks);
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
      res.status(500).json({ error: "Failed to fetch trending stocks." });
    }
  };
  

export default { getTrendingStocks };