import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';


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
  const [selectedTimeRange, setSelectedTimeRange] = useState('1d');
  const [stockSymbol, setStockSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<Stock | null>(null);
  const [tstockData, setTstockData] = useState<TrendingStock | null>(null);
  const navigate = useNavigate();
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [trendingError, setTrendingError] = useState('');
  const [trendingLoading, setTrendingLoading] = useState(true);



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
          body: JSON.stringify({ stockId: stockSymbol }),
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
          body: JSON.stringify({ stockId: stockSymbol, timeRange: selectedTimeRange }),
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


  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeRange(e.target.value);
  };

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
