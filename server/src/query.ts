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
      WITH price_data AS (
        SELECT
            stockid,
            recorddate,
            (open + high + low + close) / 4 AS ohlc_avg -- Calculate OHLC/4 for each record
        FROM 
            ALIASHYNSKA.STOCKPERFORMANCE
        WHERE 
            stockid = :stockid
            AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') 
            AND TO_DATE(:endDate, 'YYYY-MM-DD')
        ),
        ordered_prices AS (
        SELECT
            stockid,
            recorddate,
            ohlc_avg,
            FIRST_VALUE(ohlc_avg) OVER (PARTITION BY stockid ORDER BY recorddate ASC) AS earliest_price,
            LAST_VALUE(ohlc_avg) OVER (PARTITION BY stockid ORDER BY recorddate ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_price
        FROM 
            price_data
        )
        SELECT 
        DISTINCT stockid,
        earliest_price,
        latest_price,
        ROUND(((latest_price - earliest_price) / earliest_price * 100), 2) AS price_change_percent
        FROM 
        ordered_prices
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
    },
    {
        id:7,
        body:`
        WITH daily_returns AS (
            SELECT 
                stockid,
                recorddate,
                (close - LAG(close) OVER (PARTITION BY stockid ORDER BY recorddate)) / LAG(close) OVER (PARTITION BY stockid ORDER BY recorddate) AS daily_return
            FROM 
                ALIASHYNSKA.stockperformance
            WHERE 
                recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
            ),
            volatility_data AS (
            SELECT 
                stockid,
                STDDEV(daily_return) AS volatility -- Calculate standard deviation of daily returns
            FROM 
                daily_returns
            WHERE 
                daily_return IS NOT NULL -- Exclude null values (first row in each stock's series)
            GROUP BY 
                stockid
            )
            SELECT 
            stockid,
            volatility
            FROM 
            volatility_data
            ORDER BY 
            volatility DESC
            FETCH FIRST :numInt ROWS ONLY
        
        
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
        console.log(dbres);
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
            //console.log(dbres);
            res.status(404).json({ error: 'No data found' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}