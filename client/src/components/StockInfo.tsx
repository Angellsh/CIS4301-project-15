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
  const {timeRange} = useParams();
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

        const response2 = await fetch('http://localhost:3000/lookup-stock-performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId, timeRange }),
          credentials: 'include'
        });

        const data = await response.json();
        
        const PriceHistory = await response2.json(); 

        setStockData({
          ...data,
          priceHistory: PriceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
            <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()} 
            interval="preserveStartEnd" 
            /> 
            <YAxis domain={[dataMin => dataMin - 0.5, dataMax => dataMax + .5]} />
            <Tooltip
              formatter={(value, name, props) => {
                const { payload } = props; 
                return [
                  `Date: ${new Date(payload.date).toLocaleDateString()}`,
                  `$${value.toFixed(2)}`,
                  
                ];
              }}
            />
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