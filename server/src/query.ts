
import { Request, Response } from "express"
import { sendQuery } from "./model/oracledb";
import { start } from "repl";
const queries = [{
    id:5, 
    body: `SELECT stockid,
            AVG(volume) AS avg_volume
            FROM stockperformance
            WHERE recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
            GROUP BY stockid
            ORDER BY avg_volume DESC
            FETCH FIRST :numInt ROWS ONLY`
    },
    {id:1, 
        body:`
with percChange AS (SELECT 
        (SELECT close 
         FROM stockperformance 
         WHERE stockid = :stockid
         AND recorddate = TO_DATE(:startDate, 'YYYY-MM-DD') 
         FETCH FIRST 1 ROWS ONLY) AS start_price,
        
        (SELECT close 
         FROM stockperformance 
         WHERE stockid = :stockid
         AND recorddate =  TO_DATE(:endDate, 'YYYY-MM-DD') 
         FETCH FIRST 1 ROWS ONLY) AS end_price
         FROM stockperformance)
,
max_min AS (
    SELECT 
        MAX(high) AS max_price, 
        MIN(low) AS min_price
    FROM stockperformance
    WHERE stockid = :stockid 
    AND recorddate BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD')
    AND TO_DATE(:endDate, 'YYYY-MM-DD')
),
volData AS (
    SELECT 
        STDDEV(close) AS volatility
    FROM stockperformance
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
            `}

]

export const processQuery = async (req:Request, res: Response) =>{
    try{
        console.log(" in process query", req.body)
        if(!req.body){
            res.sendStatus(500);
            return;
        }
        //queryId, startDate, endDate, stockSymbol, number
        let {queryId, startDate, endDate, stockSymbol, num} = req.body;
        console.log("queryid", queryId)
        console.log("startDate", startDate)
        console.log("endDate", endDate)
        console.log("num", num)
        startDate =new Date('2014-06-11')
    endDate = new Date('2024-12-10')


        const query = queries.find(q => q.id.toString()===queryId) as any;
        if (!query) {
            res.status(404).send("Query not found");
            return;
          }
        const numInt = parseInt(num)
        const formattedStart = new Date(startDate).toISOString().split('T')[0]
        const formattedEnd = new Date(endDate).toISOString().split('T')[0]
        let dbres;
        if(query.id ===5){
            dbres = await sendQuery(query.body, { startDate:formattedStart, endDate:formattedEnd, numInt})
           // binds = { startDate:formattedStart, endDate:formattedEnd, numInt}
        }
        else if(query.id===1){
            console.log("executing query 1")
            dbres = await sendQuery(query.body, { startDate:formattedStart, endDate:formattedEnd, stockid: stockSymbol})
            console.log("got here")
            //binds = { startDate:formattedStart, endDate:formattedEnd, stockid: stockSymbol}

        }
       
        // dbres = await sendQuery(query.body, binds)
        if(dbres?.rows){
            console.log(dbres.rows)

           res.status(200).json({rows:dbres.rows})
           
        }
        else{
            console.log("no result")
            res.sendStatus(404);
        }

    }catch(err){
        console.log(err)
        res.sendStatus(500);

    }
   
}
export default processQuery