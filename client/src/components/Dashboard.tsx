import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import api from "../../axios";  // Add this import

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
  const [selectedTimeRange, setSelectedTimeRange] = useState('1m');
  const [rows, setRows] = useState('')
  const [stockSymbol, setStockSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<Stock | null>(null);
  const navigate = useNavigate();
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [trendingError, setTrendingError] = useState('');
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [topN, setTopN] = useState('5');
  const [selectedInsight, setSelectedInsight] = useState('');
  const [insightStartDate, setInsightStartDate] = useState('');
  const [insightEndDate, setInsightEndDate] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [queryFlag, setQueryFlag] = useState(false);
  const [showTuples, setShowTuples] = useState(false);

  const insightOptions = {

    '5': 'Stocks with highest average trading volume',
    '6': 'Stocks with highest average daily trading volume',
    '7': 'Most volatile stocks',
    '8': 'Stocks with highest percentage increase', 
  };
  const indOptions = {
    '1':'Daily returns for the selected stock',
  }

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
    return value;
  };
  useEffect(()=>{
    const fetchCount = async () =>
      {
      try{
        console.log("fetching tuples count")
        const response = await fetch('http://localhost:3000/get-tuples-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok){
            throw new Error("Failed to fetch tuples count.")
        }
        const data = await response.json();
        setRows(data.TUPLESCOUNT);  

      }catch(err){
  
      }

    }
    fetchCount();
   
  }, [])
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
        console.log("here")
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
     console.log(data)

        setStockData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };


  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeRange(e.target.value);
  };

  useEffect(() => {
    if (selectedInsight && insightStartDate && insightEndDate) {
      handleInsightQuery();
    }
  }, [selectedInsight]);

  const handleInsightQuery = async () => {
    try {
      console.log("query id", selectedInsight);
      const response = await api.post("/process-general-query", {
        queryId: Number(selectedInsight),
        startDate: insightStartDate,
        endDate: insightEndDate,
        numInt: parseInt(topN)
      });

      if (response?.data) {
        console.log(response.data)
        setQueryResponse(response.data.rows);
        setQueryFlag(true);
      }
    } catch (err) {
      console.log(err);
      setQueryResponse([]);
    }
  };

  return (
    <div className="dashboard">
      {/* First Row */}
      <div className="row-container">
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
      </div>

      {/* Second Row */}
      <div className="row-container">
        <section className={`section stock-queries ${stockData ? 'has-stock' : ''}`}>
          <h2>Stock Queries</h2>
          <div className="query-controls">
            <input
              type="text"
              placeholder="Enter stock symbol"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value)}
              onKeyDown={handleKeyPress1} /*shows stock-data */
            />
            <select value={selectedTimeRange} onChange={handleTimeRangeChange}>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
              <option value="1m">1 Month</option>
              <option value="1y">1 Year</option>


            </select>
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
        </section>

        <section className={`market-insights-card ${queryResponse.length > 0 ? 'expanded' : ''}`}>
          <div className="insights-content">
            <div className="insights-header">
              <select value={topN} onChange={(e) => setTopN(e.target.value)}>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="25">Top 25</option>
              </select>
              <div className="date-range">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={insightStartDate}
                  onChange={(e) => setInsightStartDate(e.target.value)}
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={insightEndDate}
                  onChange={(e) => setInsightEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="insights-options">
              {Object.entries(insightOptions).map(([key, label]) => (
                <div
                  key={key}
                  className={`insight-option ${selectedInsight === key ? 'selected' : ''}`}
                  onClick={() => setSelectedInsight(key)}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {queryResponse.length > 0 && (
            <div className="insights-results">
              <table className="results-table">
                <thead>
                  <tr>
                    {Object.keys(queryResponse[0]).map((header) => (
                      <th key={header}>{header.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResponse.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{formatValue(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

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

      </div>

      <div className="row-container">
        <section className="section tuples-section">
          <button onClick={() => setShowTuples(!showTuples)}>
            Show Tuples Count
          </button>
          {showTuples && <div style={{ marginTop: '10px' }}>Contains {rows} tuples.</div>}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;