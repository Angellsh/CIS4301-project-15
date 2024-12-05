import { Request, Response } from "express"
import { sendQuery } from "./model/oracledb";
import { start } from "repl";
const queries = [{
    id:5, 
    body: `SELECT stockid,
            AVG(volume) AS avg_volume
            FROM ALIASHYNSKA.stockperformance
            WHERE recorddate BETWEEN TO_DATE(:start_date, 'YYYY-MM-DD') AND TO_DATE(:end_date, 'YYYY-MM-DD')
            GROUP BY stockid
            ORDER BY avg_volume DESC
            FETCH FIRST :numInt ROWS ONLY`
    },
    {
        id:6, 
        name: "average daily",
        body:`SELECT stockid, recorddate,
                AVG(volume) AS avg_volume
                FROM ALIASHYNSKA.stockperformance
                WHERE recorddate BETWEEN TO_DATE(:start_date, 'YYYY-MM-DD') AND TO_DATE(:end_date, 'YYYY-MM-DD')
                GROUP BY stockid, recorddate
                ORDER BY avg_volume DESC
                FETCH FIRST :numInt ROWS ONLY
            `
    },
    {id:8, 
    name: "highest percentage", 
    body:`SELECT stockid as ticker,
                MIN(close) as min_price, 
                MAX(close) as max_price, 
                ROUND(((MAX(close)- MIN(close))/ MIN(close)*100), 2) as price_change_percent
            FROM ALIASHYNSKA.STOCKPERFORMANCE
                WHERE recorddate BETWEEN TO_DATE(:start_date, 'YYYY-MM-DD') 
            AND TO_DATE(:end_date, 'YYYY-MM-DD')
            GROUP BY stockid
            ORDER BY price_change_percent
            FETCH FIRST :NUMINT ROWS ONLY `},
    {
        id: 9,
        name: 'movement',
        body: `
      SELECT 
        MIN(close) as min_price,
        MAX(close) as max_price,
        ROUND(((MAX(close) - MIN(close)) / MIN(close) * 100), 2) as price_change_percent
      FROM ALIASHYNSKA.STOCKPERFORMANCE
      WHERE stockid = :stockid
      AND recorddate BETWEEN TO_DATE(:start_date, 'YYYY-MM-DD') 
      AND TO_DATE(:end_date, 'YYYY-MM-DD')
    `
    },
    {
        id: 10, 
        name: 'average daily',
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
        console.log(req)
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
        const formatted_start = new Date(startDate).toISOString().split('T')[0]
        console.log(formatted_start)
        const formatted_end=new Date(endDate).toISOString().split('T')[0]

        const dbres = await sendQuery(query.body, {
            start_date: formatted_start,
            end_date :formatted_end,
            numInt
        });
        console.log(dbres?.rows)
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