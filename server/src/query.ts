import { Request, Response } from "express"
import { sendQuery } from "./model/oracledb";
import { start } from "repl";
const queries = [{
    id:5, 
    body: `SELECT stockid,
            AVG(volume) AS avg_volume
            FROM ALIASHYNSKA.stockperformance
            WHERE recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
            GROUP BY stockid
            ORDER BY avg_volume DESC
            FETCH FIRST :numInt ROWS ONLY`
    },
    {id:1, 
        body:`
with percChange AS (SELECT 
        (SELECT close 
         FROM ALIASHYNSKA.stockperformance 
         WHERE stockid = :stockid
         AND recorddate = TO_DATE(:startDate, 'YYYY-MM-DD') 
         FETCH FIRST 1 ROWS ONLY) AS start_price,
        
        (SELECT close 
         FROM ALIASHYNSKA.stockperformance 
         WHERE stockid = :stockid
         AND recorddate =  TO_DATE(:endDate, 'YYYY-MM-DD') 
         FETCH FIRST 1 ROWS ONLY) AS end_price
         FROM ALIASHYNSKA.stockperformance)
,
max_min AS (
    SELECT 
        MAX(high) AS max_price, 
        MIN(low) AS min_price
    FROM ALIASHYNSKA.stockperformance
    WHERE stockid = :stockid 
    AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD')
    AND TO_DATE(:endDate, 'YYYY-MM-DD')
),
volData AS (
    SELECT 
        STDDEV(close) AS volatility
    FROM ALIASHYNSKA.stockperformance
    WHERE stockid = :stockid
    AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD')
    AND TO_DATE(:endDate, 'YYYY-MM-DD')
)
SELECT 
    volData.volatility, 
    max_min.max_price, 
    max_min.min_price,
    ((percChange.end_price - percChange.start_price) / percChange.start_price) * 100 AS percentage_change
FROM percChange
JOIN max_min ON 1 = 1  
JOIN volData ON 1 = 1
            `},
    {
        id: 'movement',
        body: `
      SELECT 
        MIN(close) as min_price,
        MAX(close) as max_price,
        ROUND(((MAX(close) - MIN(close)) / MIN(close) * 100), 2) as price_change_percent
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockid
      AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') 
      AND TO_DATE(:endDate, 'YYYY-MM-DD')
    `
    },
    {
        id: 'average',
        body: `
      SELECT 
        ROUND(AVG(close), 2) as avg_price,
        ROUND(AVG(
          CASE 
            WHEN low = 0 THEN 0 
            ELSE ((high - low) / low) * 100 
          END
        ), 2) as avg_daily_volatility
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockid
      AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD')
      AND TO_DATE(:endDate, 'YYYY-MM-DD')
    `
    }
]

export const processQuery = async (req: Request, res: Response) => {
    try {
        const { queryId, stockid, startDate, endDate } = req.body;

        if (!queryId || !stockid || !startDate || !endDate) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        const query = queries.find(q => q.id === queryId);
        if (!query) {
            res.status(404).json({ error: 'Query not found' });
            return;
        }

        const dbres = await sendQuery(query.body, {
            stockid,
            startDate,
            endDate
        });

        if (dbres?.rows) {
            res.status(200).json({ rows: dbres.rows });
        } else {
            res.status(404).json({ error: 'No data found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const processGeneralQuery = async (req: Request, res: Response) => {
    try {
        const { queryId, startDate, endDate, numInt } = req.body;
        if (!queryId || !startDate || !endDate || !numInt) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }
        // Convert queryId to number for comparison if it's a string
        const queryIdNum = typeof queryId === 'string' ? parseInt(queryId) : queryId;
        const query = queries.find(q => q.id === queryIdNum);
        if (!query) {
            res.status(404).json({ error: 'Query not found' });
            return;
        }
        const dbres = await sendQuery(query.body, {
            startDate,
            endDate,
            numInt
        });
        if (dbres?.rows) {
            res.status(200).json({ rows: dbres.rows });
        } else {
            res.status(404).json({ error: 'No data found' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}