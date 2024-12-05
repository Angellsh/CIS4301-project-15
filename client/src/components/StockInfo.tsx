import { useState, useEffect, useCallback } from 'react';
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

interface AnalysisOption {
  id: string;
  text: string;
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Modify NoDataMessage to handle chart-specific no data
const NoDataMessage = () => (
  <div className="no-data-message">
    <p>No data available for this chart.</p>
  </div>
);

const StockInfo = () => {
  const { stockId, timeRange: initialTimeRange } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(initialTimeRange || '1m');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [previousData, setPreviousData] = useState<StockData | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const analysisOptions: AnalysisOption[] = [
    {
      id: 'movement',
      text: `How ${stockData?.STOCKID} has moved over the selected period`
    },
    {
      id: 'average',
      text: `Get the average performance of ${stockData?.STOCKID} over the selected period`
    }
  ];

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeRange = e.target.value;
    if (newTimeRange === 'custom') {
      setIsCustomRange(true);
      setTempEndDate(formatDate(new Date())); // Set end date to today
    } else {
      setIsCustomRange(false);
      setTimeRange(newTimeRange);
      navigate(`/stock/${stockId}/${newTimeRange}`, { replace: true });
    }
  };

  const handleDateRangeSubmit = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        setError('Start date cannot be after end date');
        return;
      }
      
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
      const range = `custom_${tempStartDate}_${tempEndDate}`;
      setTimeRange(range);
    }
  };

  const cancelPreviousRequest = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleAnalysisSelect = useCallback(async (optionId: string) => {
    // Cancel any previous request
    cancelPreviousRequest();

    // Create new abort controller
    const controller = new AbortController();
    setAbortController(controller);
    
    setIsAnalysisLoading(optionId);
    setSelectedAnalysis(optionId);
    setAnalysisResult('Loading...');

    try {
      //console.log(stockData?.priceHistory[0]?.date);
      const response = await fetch('http://localhost:3000/process-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: optionId,
          stockid: stockData?.STOCKID,
          startDate: customStartDate || (stockData?.priceHistory[0]?.date.split('T')[0] || '2014-01-01'), 
          endDate: customEndDate || formatDate(new Date()) 
        }),
        credentials: 'include',
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      if (!result.rows?.[0]) {
        setAnalysisResult('No data available for analysis');
        return;
      }

      // Format result (existing switch case code)
      let message = '';
      const data = result.rows[0];
      
      switch (optionId) {
        case 'movement':
          message = data.MIN_PRICE === 0 ? 
            `No movement data available for ${stockData?.STOCKID} in the selected period` :
            `${stockData?.STOCKID} has moved ${data.PRICE_CHANGE_PERCENT > 0 ? 'up' : 'down'} by ${Math.abs(data.PRICE_CHANGE_PERCENT.toFixed(2))}% from $${data.EARLIEST_PRICE.toFixed(2)} to $${data.LATEST_PRICE.toFixed(2)}`;
          break;
        case 'average':
          const avgPrice = Number(data.AVG_PRICE) || 0;
          const avgVolatility = Number(data.AVG_DAILY_VOLATILITY) || 0;
          let volatilityText = 'This indicates low volatility.';
          if (avgVolatility > 5) volatilityText = 'This indicates high volatility.';
          else if (avgVolatility > 2) volatilityText = 'This indicates moderate volatility.';
          
          message = avgPrice === 0 ?
            `No average data available for ${stockData?.STOCKID} in the selected period` :
            `During this period, ${stockData?.STOCKID} maintained an average price of $${avgPrice.toFixed(2)} with an average daily price movement of ${avgVolatility.toFixed(2)}%. ${volatilityText}`;
          break;

      }
      
      setAnalysisResult(message);
    } catch (err) {
      if (err.name === 'AbortError') {
        setAnalysisResult('');
      } else {
        setAnalysisResult('Failed to perform analysis. Please try again.');
      }
    } finally {
      setIsAnalysisLoading(null);
    }
  }, [stockData?.STOCKID, customStartDate, customEndDate, cancelPreviousRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPreviousRequest();
    };
  }, [cancelPreviousRequest]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchStockData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch data in parallel with Promise.all
        const [baseData, ...otherData] = await Promise.all([
          // First fetch basic stock info
          fetch('http://localhost:3000/lookup-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockId }),
            credentials: 'include',
            signal: controller.signal
          }).then(res => res.json()),

          // Then fetch all other data concurrently
          fetch('http://localhost:3000/lookup-stock-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              stockId, 
              timeRange,
              ...(timeRange.startsWith('custom_') && {
                startDate: customStartDate,
                endDate: customEndDate
              })
            }),
            credentials: 'include',
            signal: controller.signal
          }).then(res => res.json()).catch(() => []),

          fetch('http://localhost:3000/stockvol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              stockId, 
              timeRange,
              ...(timeRange.startsWith('custom_') && {
                startDate: customStartDate,
                endDate: customEndDate
              })
            }),
            credentials: 'include',
            signal: controller.signal
          }).then(res => res.json()).catch(() => []),

          fetch('http://localhost:3000/ma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              stockId, 
              timeRange,
              ...(timeRange.startsWith('custom_') && {
                startDate: customStartDate,
                endDate: customEndDate
              })
            }),
            credentials: 'include',
            signal: controller.signal
          }).then(res => res.json()).catch(() => [])
        ]);

        if (mounted) {
          const newData = {
            ...baseData,
            priceHistory: otherData[0]?.sort?.((a: { date: string }, b: { date: string }) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            ) || previousData?.priceHistory || [],
            volitility: otherData[1] || previousData?.volitility || [],
            ma: otherData[2]?.sort?.((a: { date: string }, b: { date: string }) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            ) || previousData?.ma || []
          };

          setStockData(newData);
          setPreviousData(newData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          if (previousData) {
            setStockData(previousData);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (stockId) {
      fetchStockData();
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [stockId, timeRange, customStartDate, customEndDate]);

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
        <div className="time-range-controls">
          <select 
            value={isCustomRange ? 'custom' : timeRange} 
            onChange={handleTimeRangeChange}
            className="time-range-select"
          >
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="1y">1 Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {isCustomRange && (
            <>
              <div className="date-range-picker">
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="date-input"
                />
                <span>to</span>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="date-input"
                />
                <button 
                  onClick={handleDateRangeSubmit} 
                  className="apply-date-range"
                  disabled={!tempStartDate || !tempEndDate}
                >
                  Apply
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="chart-container">
        <h2>Price History</h2>
        {stockData.priceHistory.length > 0 ? (
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
        ) : (
          <NoDataMessage />
        )}
      </div>

      <div className="chart-container">
        <h2>Moving Average</h2>
        {stockData.ma.length > 0 ? (
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
        ) : (
          <NoDataMessage />
        )}
      </div>

      <div className="chart-container">
        <h2>Volatility</h2>
        {stockData.volitility.length > 0 ? (
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
        ) : (
          <NoDataMessage />
        )}
      </div>

      <div className="analysis-card">
        <h2>Analysis</h2>
        <div className="analysis-options">
          {analysisOptions.map(option => (
            <div
              key={option.id}
              className={`analysis-option ${selectedAnalysis === option.id ? 'selected' : ''} ${
                isAnalysisLoading === option.id ? 'loading' : ''
              }`}
              onClick={() => {
                if (!isAnalysisLoading) {
                  handleAnalysisSelect(option.id);
                }
              }}
            >
              {option.text}
              {isAnalysisLoading === option.id && (
                <span className="loading-spinner"></span>
              )}
            </div>
          ))}
        </div>
        {selectedAnalysis && analysisResult && (
          <div className={`analysis-result ${isAnalysisLoading ? 'analysis-loading' : ''}`}>
            {analysisResult}
          </div>
        )}
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