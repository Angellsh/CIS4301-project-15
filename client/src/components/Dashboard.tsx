import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1d');
  const [stockSymbol, setStockSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState(null);
  const navigate = useNavigate();

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

      {/* Section 3: Market Trends and News */}
      <section className="section market-trends">
        <div className="trends-container">
          <h2>Market Trends</h2>
          <div className="trending-stocks">
            {/* Trending stocks will go here */}
          </div>
        </div>
        <div className="news-container">
          <h2>Market News</h2>
          <div className="news-list">
            {/* News articles will go here */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
