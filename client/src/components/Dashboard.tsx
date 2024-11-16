import { useState } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1d');

  return (
    <div className="dashboard">
      {/* Section 1: User Info and Stock Overview */}
      <section className="section user-stock-overview">
        <div className="user-info">
          <h2>Welcome, {localStorage.getItem('userName')}</h2>
        </div>
        <div className="stock-list">
          {/* Stock cards will go here */}
        </div>
      </section>

      {/* Section 2: Stock Queries */}
      <section className="section stock-queries">
        <h2>Stock Queries</h2>
        <div className="query-controls">
          <input type="text" placeholder="Enter stock symbol" />
          <select value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
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