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
  volitility: {
    date: string;
    dailyReturn: number;
  }[];
  priceHistory: {
    date: string;
    price: number;
  }[];
  ma: {
    date: string;
    movingAverage: number;
  }[];
}

const StockInfo = () => {
  const { stockId, timeRange: initialTimeRange } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(initialTimeRange || '1m');

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeRange = e.target.value;
    setTimeRange(newTimeRange);
    navigate(`/stock/${stockId}/${newTimeRange}`, { replace: true });
  };

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      try {
        const [stockResponse, perfResponse, volResponse, maResponse] = await Promise.all([
          fetch('http://localhost:3000/lookup-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockId }),
            credentials: 'include'
          }),
          fetch('http://localhost:3000/lookup-stock-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockId, timeRange }),
            credentials: 'include'
          }),
          fetch('http://localhost:3000/stockvol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockId, timeRange }),
            credentials: 'include'
          }),
          fetch('http://localhost:3000/ma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockId, timeRange }),
            credentials: 'include'
          })
        ]);


        if (!stockResponse.ok || !perfResponse.ok) {
          throw new Error('Failed to fetch stock data');
        }

        const stockData = await stockResponse.json();
        const priceHistory = await perfResponse.json();
        const volitility = await volResponse.json();
        const ma = await maResponse.json();

        console.log('Volatility Data:', volitility);
        //console.log('', ma);
        setStockData({
          ...stockData,
          volitility: volitility,
          priceHistory: priceHistory.sort((a: { date: string }, b: { date: string }) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
          ma: ma.sort((a: { date: string }, b: { date: string }) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (stockId) {
      fetchStockData();
    }
  }, [stockId, timeRange]); // Added timeRange as dependency

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stockData) return <div>No data found</div>;

  return (
    <div className="stock-info">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
      
      <header className="stock-header">
        <div className="stock-header-info">
          <h1>{stockData?.NAME} ({stockData?.STOCKID})</h1>
          <p className="category">{stockData?.CATEGORY}</p>
        </div>
        <select 
          value={timeRange} 
          onChange={handleTimeRangeChange}
          className="time-range-select"
        >
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
          <option value="1y">1 Year</option>
        </select>
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
            <YAxis 
              domain={[(dataMin: number) => dataMin - 0.5, (dataMax: number) => dataMax + 0.5]} 
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value, _name, props) => {
              const { payload } = props; 
              return [
                `Date: ${new Date(payload.date).toLocaleDateString()}`,
                `$${typeof value === 'number' ? value.toFixed(2) : value}`,
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

      <div className="chart-container">
        <h2>Moving Average</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stockData.ma}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[(dataMin: number) => dataMin - 0.5, (dataMax: number) => dataMax + 0.5]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value, _name, props) => {
                const { payload } = props;
                return [
                  `Date: ${new Date(payload.date).toLocaleDateString()}`,
                  `$${typeof value === 'number' ? value.toFixed(2) : value}`,
                ];
              }}
            />
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="#82ca9d"
              dot={false}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="50-Day MA"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h2>Volitility</h2>
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stockData.volitility}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()} 
              interval="preserveStartEnd" 
            /> 
            <YAxis
              domain={[(dataMin: number) => dataMin * 1.5, (dataMax: number) => dataMax * 1.5]}
              tickFormatter={(value) => `${(value * 100).toFixed(2)}%`} 
            />
            <Tooltip
              formatter={(value, _name, props) => {
                const { payload } = props; 
                return [
                  `Date: ${new Date(payload.date).toLocaleDateString()}`,
                  `${typeof value === 'number' ? (value * 100).toFixed(2) : value}%`,
                ];
              }}
            />
            <Line
              type="monotone"
              dataKey="dailyReturn"
              stroke="#8884d8"
              dot={false}
              strokeWidth={2}
            />
            </LineChart>
            
        </ResponsiveContainer>
      </div>


      <div className="stock-stats">
        <div className="stat-card">
          <h3>Local High</h3>
          <p>${Math.max(...stockData.priceHistory.map(d => d.price)).toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Local Low</h3>
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