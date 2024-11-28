import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/StockInfo.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StockData {
  STOCKID: string;
  NAME: string;
  CATEGORY: string;
  priceHistory: {
    date: string;
    price: number;
  }[];
}

const StockInfo = () => {
  const { stockId } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch('http://localhost:3000/lookup-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Stock not found');
        }

        const data = await response.json();
        
        const mockPriceHistory = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: Math.random() * 100 + 50
        }));

        setStockData({
          ...data,
          priceHistory: mockPriceHistory
        });
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (stockId) {
      fetchStockData();
    }
  }, [stockId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stockData) return <div>No data found</div>;

  return (
    <div className="stock-info">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
      
      <header className="stock-header">
        <h1>{stockData.NAME} ({stockData.STOCKID})</h1>
        <p className="category">{stockData.CATEGORY}</p>
      </header>

      <div className="chart-container">
        <h2>Price History</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stockData.priceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="stock-stats">
        <div className="stat-card">
          <h3>Today's High</h3>
          <p>${Math.max(...stockData.priceHistory.map(d => d.price)).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Low</h3>
          <p>${Math.min(...stockData.priceHistory.map(d => d.price)).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Volume</h3>
          <p>1.2M</p>
        </div>
      </div>
    </div>
  );
};

export default StockInfo;