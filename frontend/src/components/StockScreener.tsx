import React, { useState } from 'react';
import { TopStock, ScreeningResponse } from '../types';

const StockScreener: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreeningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindStocks = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:5001/api/screen/nasdaq100');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data: ScreeningResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationClass = (rec: string) => {
    return rec.replace(/\s+/g, ' ');
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  return (
    <div className="stock-screener">
      <div className="screener-header">
        <h1>NASDAQ-100 Stock Screener</h1>
        <p>Find the most attractive stocks from the NASDAQ-100 index based on technical and sentiment analysis</p>
      </div>

      <div className="screener-controls">
        <button 
          className="find-stocks-button"
          onClick={handleFindStocks}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="button-spinner" />
              Analyzing NASDAQ-100 Stocks...
            </>
          ) : (
            'Find Top Stocks'
          )}
        </button>
        {loading && (
          <p className="loading-note">
            This may take 2-3 minutes as we analyze all 100 stocks...
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {results && (
        <div className="screening-results">
          <div className="results-summary">
            <h2>Top 10 Most Attractive NASDAQ-100 Stocks</h2>
            <p>Successfully analyzed {results.totalAnalyzed} stocks</p>
          </div>

          <div className="stocks-grid">
            {results.topStocks.map((stock, index) => (
              <div key={stock.symbol} className="stock-card">
                <div className="stock-rank">#{index + 1}</div>
                
                <div className="stock-header">
                  <h3>{stock.symbol}</h3>
                  <span className={`recommendation-badge ${getRecommendationClass(stock.recommendation)}`}>
                    {stock.recommendation}
                  </span>
                </div>

                <div className="stock-info">
                  <p className="company-name">{stock.name}</p>
                  <p className="sector">{stock.sector}</p>
                </div>

                <div className="stock-metrics">
                  <div className="metric">
                    <span className="metric-label">Price</span>
                    <span className="metric-value">${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Market Cap</span>
                    <span className="metric-value">{formatMarketCap(stock.marketCap)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">P/E Ratio</span>
                    <span className="metric-value">{stock.peRatio > 0 ? stock.peRatio.toFixed(2) : 'N/A'}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">20D Momentum</span>
                    <span className="metric-value" style={{
                      color: stock.momentum20d > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {stock.momentum20d > 0 ? '+' : ''}{stock.momentum20d.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="stock-scores">
                  <div className="score-item">
                    <span className="score-label">Attractiveness</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill attractiveness"
                        style={{ width: `${Math.min(Math.max(stock.attractivenessScore, 0), 100)}%` }}
                      />
                    </div>
                    <span className="score-value">{stock.attractivenessScore.toFixed(1)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Technical</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill technical"
                        style={{ width: `${Math.min(Math.max(stock.technicalScore + 50, 0), 100)}%` }}
                      />
                    </div>
                    <span className="score-value">{stock.technicalScore.toFixed(1)}</span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Sentiment</span>
                    <div className="score-bar">
                      <div 
                        className="score-fill sentiment"
                        style={{ width: `${Math.min(Math.max(stock.sentimentScore + 50, 0), 100)}%` }}
                      />
                    </div>
                    <span className="score-value">{stock.sentimentScore.toFixed(1)}</span>
                  </div>
                </div>

                <div className="stock-description">
                  <p>{stock.description}</p>
                </div>

                <button 
                  className="analyze-button-card"
                  onClick={() => window.location.href = `/?ticker=${stock.symbol}`}
                >
                  Detailed Analysis →
                </button>
              </div>
            ))}
          </div>

          {results.failedSymbols.length > 0 && (
            <div className="failed-symbols">
              <p>Failed to analyze: {results.failedSymbols.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockScreener; 