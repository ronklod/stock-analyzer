import React, { useState, useEffect } from 'react';
import { TopStock, ScreeningResponse } from '../types';
import WatchlistButton from './WatchlistButton';
import { useApi } from '../utils/apiClient';

interface Props {
  type: 'nasdaq100' | 'sp500' | 'mag7';
}

const StockScreener: React.FC<Props> = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreeningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const api = useApi();

  // Clear results when type changes
  useEffect(() => {
    setResults(null);
    setError(null);
    setExpandedSections({});
  }, [type]);

  const handleFindStocks = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await api.getScreeningResults(type);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSection = (stockSymbol: string, section: string) => {
    const key = `${stockSymbol}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const isSectionExpanded = (stockSymbol: string, section: string) => {
    const key = `${stockSymbol}-${section}`;
    return expandedSections[key] || false;
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

  const getIndexName = () => {
    return type === 'nasdaq100' ? 'NASDAQ-100' : type === 'sp500' ? 'S&P 500' : 'MAG-7';
  };

  return (
    <div className="stock-screener">
      <div className="screener-header">
        <h1>{getIndexName()} Stock Screener</h1>
        <p>Find the most attractive stocks from the {getIndexName()} index based on technical and sentiment analysis</p>
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
              Analyzing {getIndexName()} Stocks...
            </>
          ) : (
            'Find Top Stocks'
          )}
        </button>
        {loading && (
          <p className="loading-note">
            This may take {type === 'nasdaq100' ? '2-3' : type === 'sp500' ? '4-5' : '1'} {type === 'mag7' ? 'minute' : 'minutes'} as we analyze all {type === 'nasdaq100' ? '100' : type === 'sp500' ? '500' : '7'} stocks...
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
            <h2>Top 10 Most Attractive {getIndexName()} Stocks</h2>
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

                {/* Primary metrics always visible */}
                <div className="stock-primary-metrics">
                  <div className="metric">
                    <span className="metric-label">Price</span>
                    <span className="metric-value">${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Momentum</span>
                    <span className="metric-value" style={{
                      color: stock.momentum20d > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {stock.momentum20d > 0 ? '+' : ''}{stock.momentum20d.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                {/* Collapsible Financial Metrics */}
                <div className="collapsible-section mobile-collapsible">
                  <div 
                    className="collapsible-header"
                    onClick={() => toggleSection(stock.symbol, 'metrics')}
                  >
                    <span className="collapsible-title">Financial Metrics</span>
                    <span className={`collapsible-icon ${isSectionExpanded(stock.symbol, 'metrics') ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                  <div className={`collapsible-content ${isSectionExpanded(stock.symbol, 'metrics') ? 'expanded' : ''}`}>
                    <div className="stock-metrics">
                      <div className="metric">
                        <span className="metric-label">Market Cap</span>
                        <span className="metric-value">{formatMarketCap(stock.marketCap)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">P/E Ratio</span>
                        <span className="metric-value">{stock.peRatio > 0 ? stock.peRatio.toFixed(2) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Score Analysis */}
                <div className="collapsible-section mobile-collapsible">
                  <div 
                    className="collapsible-header"
                    onClick={() => toggleSection(stock.symbol, 'scores')}
                  >
                    <span className="collapsible-title">Score Analysis</span>
                    <span className={`collapsible-icon ${isSectionExpanded(stock.symbol, 'scores') ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                  <div className={`collapsible-content ${isSectionExpanded(stock.symbol, 'scores') ? 'expanded' : ''}`}>
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
                  </div>
                </div>

                {/* Collapsible Description */}
                <div className="collapsible-section mobile-collapsible">
                  <div 
                    className="collapsible-header"
                    onClick={() => toggleSection(stock.symbol, 'description')}
                  >
                    <span className="collapsible-title">Company Description</span>
                    <span className={`collapsible-icon ${isSectionExpanded(stock.symbol, 'description') ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                  <div className={`collapsible-content ${isSectionExpanded(stock.symbol, 'description') ? 'expanded' : ''}`}>
                    <div className="stock-description">
                      <p>{stock.description}</p>
                    </div>
                  </div>
                </div>

                <div className="stock-actions">
                  <WatchlistButton symbol={stock.symbol} companyName={stock.name} />
                  <button 
                    className="analyze-button-card"
                    onClick={() => window.location.href = `/?ticker=${stock.symbol}`}
                  >
                    Detailed Analysis →
                  </button>
                </div>
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