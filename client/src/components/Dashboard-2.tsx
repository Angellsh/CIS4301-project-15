import { useState } from 'react';
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import DatePicker from 'react-datepicker';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard2.css';
import api from "../../axios"
import select from './select';
import { Button, Form } from 'react-bootstrap';


interface TrendingStock {
  STOCKID: string;
  PERCENT: number;
}
interface Stock {
  STOCKID: string,
  NAME: string,
  CATEGORY: string
}



const Dashboard = () => {
  const [queryResponse, setQueryResponse] =useState([])
  const [queryFlag, setQueryFlag]  = useState(false)
  const [startDate, setStartDate] = useState("X");
  const [endDate, setEndDate] = useState("Y");
  const [queryId, setQueryId] = useState("")
  const [selectedTimeRange, setSelectedTimeRange] = useState('1m');
  const [stockSymbol, setStockSymbol] = useState('S');
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<Stock | null>(null);
  const [tstockData, setTstockData] = useState<TrendingStock | null>(null);
  const navigate = useNavigate();
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [trendingError, setTrendingError] = useState('');
  const [trendingLoading, setTrendingLoading] = useState(true);
  const data = {
      queries : {
        "1":"How the :stockSymbol price has moved over :startDate and :endDate",
        "2": "Get the average performance of :stockSymbol over :startDate and :endDate",
        "3": "How the :stockSymbol has performed compared to a market index during :startDate and :endDate",
        "4" : "Highest and Lowest Price of :stockSymbol in :startDate and :endDate",
        "5": "Get the top :number stocks with the highest average trading volume in the :startDate and :endDate",
        "6":" The :number stocks with the highest average daily trading volume over the :startDate and :endDate",
        "7": "The :number most volatile stocks in the past :selectedTimeRange days",
        "8":"The :number stocks with the highest percentage increase in closing price over the :startDate and :endDate"


      },
      headers:{
        "1": ["Stock ID", "Average Volume"]
      }


  }

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        const response = await fetch('http://localhost:3000/trending-stocks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trending stocks');
        }

        const data = await response.json();
        setTrendingStocks(
          data
        );

      } catch (err) {
        setTrendingError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  const sendQuery = async (queryId: string) =>{

    try{
      console.log("query id", queryId)
      const response = await api.post("/process-query", {queryId, startDate, endDate, stockSymbol, num : number});
      if(response.status===200){
        console.log(response.data)
        setQueryResponse(response.data.rows);
        setQueryFlag(true)
        
      }
      if(response.status===404){
        setQueryResponse("no records")
      }

    }
    catch(err){

      console.log(err);

    }

  }

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:3000/lookup-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId: stockSymbol.toUpperCase() }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Stock performance not found');
        }

        const data = await response.json();
        setStockData(data);

        navigate(`/stock/${data.STOCKID}/${selectedTimeRange}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };


  const handleKeyPress1 = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:3000/lookup-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId: stockSymbol.toUpperCase(), timeRange: selectedTimeRange }),
          credentials: 'include',
        });
  
        if (!response.ok) {
          throw new Error('Stock performance not found');
        }
  
        const data = await response.json();
        setStockData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };
  const handleQuerySelection = (key:  string) =>{
    console.log("key", key)
    setQueryId(key);
  }


  
  return (
    <div className="dashboard">
      {/* Section 1: User Info and Stock Overview */}
      <section className="section user-stock-overview">
        <div className="user-info">
          <h2>
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return 'Good morning';
              if (hour < 18) return 'Good afternoon';
              return 'Good evening';
            })()}, welcome to your dashboard.
          </h2>
        </div>
        <div className="stock-list">
          {/* Stock cards will go here */}
        </div>
      </section>

      {/* Section 2: Stock Queries */}
      { !queryFlag ? <section className={`section stock-queries has-stock`}>
        <h2>Stock Queries</h2>
        <h5>Analyze individual stocks</h5>
        <div className="query-controls">
          <input 
            type="text"
            placeholder="Enter stock symbol"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value)}
            onKeyDown={handleKeyPress1} //shows stock-data 
          />{/*
          <select value={selectedTimeRange} onChange={handleTimeRangeChange}>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="1y">1 Year</option>
          </select>*/}
          <div className='row date-picker'><div className="col-6 s">Start<input  className= "form-control form-control small" 
          type="date" id="start-date" onChange={(e) => setStartDate(e.target.value)}></input></div>
          <div className="col-6">End<input className= "form-control form-control small" 
           type="date" id="end-date"onChange={(e) => setEndDate(e.target.value)}></input></div></div>
          
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {stockData && (
          <div
            className="stock-data"
            onClick={() => navigate(`/stock/${stockData.STOCKID}/${selectedTimeRange}`)}
          >
            <h3>{stockData.STOCKID}</h3>
            <p>Name: {stockData.NAME}</p>
            <p>Category: {stockData.CATEGORY}</p>
          </div>
        )}
        
      <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("1")}>
            {data.queries["1"].replace(":stockSymbol",
             stockSymbol).replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
      <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("2")}>
            {data.queries["2"].replace(":stockSymbol",
             stockSymbol).replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
     <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("3")}>
            {data.queries["3"].replace(":stockSymbol",
             stockSymbol).replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
      <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("4")}>
            {data.queries["4"].replace(":stockSymbol",
             stockSymbol).replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
        
        <h5>Get market insights</h5>
        <div className="query-controls">
          <input 
            type="text"
            placeholder="Enter number of stocks"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
             /*shows stock-data */
          />

  
        </div>
        <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("5")}>
            {data.queries["5"].replace(":stockSymbol", stockSymbol).replace(":number", number )
            .replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
         <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("6")}>
            {data.queries["6"].replace(":stockSymbol", stockSymbol).replace(":number", number )
            .replace(":startDate", startDate).replace(":endDate", endDate).replace(":number", number )}</Button>
          <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("6")}>
            {data.queries["6"].replace(":stockSymbol", stockSymbol)
          .replace(":startDate", startDate).replace(":endDate", endDate)}</Button>
          <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("7")}>
            {data.queries["7"].replace(":stockSymbol".replace(":number", number ),
             stockSymbol).replace(":startDate", startDate).replace(":endDate", endDate).replace(":number", number )}</Button>
          <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() =>sendQuery("8")}>
            {data.queries["8"].replace(":stockSymbol",stockSymbol).
            replace(":startDate", startDate).replace(":endDate", endDate)
            .replace(":number", number )}</Button>
          
        </section>
        : <div>
         
          <table className="table-container" >
            <thead>
              <tr>
                <th className="table-header">Stock ID</th>
                <th className="table-header">Average Volume</th >
              </tr>
              </thead>
              <tbody>
          {queryResponse.map((row: any, index)=>(<tr key={index}>
            <td className="table-cell">{row.STOCKID}</td>
            <td className="table-cell">{row.AVG_VOLUME}</td></tr>))}
            </tbody>
            </table>
          <Button onClick={()=>{setQueryFlag(false)}}>Exit</Button></div>
          }
          {queryId=="2" && <div></div>}

      {/* Section 3: Trending Stocks */}
      <section className="section trending-section">
        <div className="trending-stocks">
          <h2>Trending Stocks</h2>
          {trendingLoading && <p>Loading trending stocks...</p>}
          {trendingError && <p className="error">{trendingError}</p>}
          {!trendingLoading && !trendingError && trendingStocks.length > 0 && (
            <ul>
              {trendingStocks.map((tstock: any) => (
                <li
                  key={tstock.STOCKID}
                  className="trending-stock"
                  onClick={() => navigate(`/stock/${tstock.STOCKID}/${selectedTimeRange}`)}
                >
                  <h4>
                    {tstock.STOCKID} 
                    <span className="stock-price">{tstock.PERCENT.toFixed(2)}%</span>
                  </h4>
                </li>
              ))}
            </ul>
          )}
          {!trendingLoading && !trendingError && trendingStocks.length === 0 && (
            <p>No trending stocks available at the moment.</p>
          )}
        </div>
      </section>

      {/* Section 4: Market News */}
      <section className="section news-section">
        <h2>Market News</h2>
        <div className="news-list">
          {/* News articles will go here */}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
