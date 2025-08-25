import React, { useState, useEffect } from 'react';
import { TopStock, ScreeningResponse } from '../types';
import WatchlistButton from './WatchlistButton';
import { useApi } from '../utils/apiClient';
import { useTheme } from '../context/ThemeContext';

interface Props {
  type: 'nasdaq100' | 'sp500' | 'mag7';
}

const StockScreener: React.FC<Props> = ({ type }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreeningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const api = useApi();
  const { theme } = useTheme(); // Get current theme from context
  const isDarkTheme = theme === 'dark'; 

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
    if (!rec) return '';
    return rec.replace(/\s+/g, ' ');
  };

  const formatMarketCap = (marketCap: number | null | undefined) => {
    if (marketCap === null || marketCap === undefined) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  // Safe rendering function for numeric values
  const safeRenderNumber = (value: number | null | undefined, format: (val: number) => string) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    try {
      return format(value);
    } catch (error) {
      console.error("Error formatting number:", error);
      return 'Error';
    }
  };

  // Ensure color values are valid strings
  const getColor = (value: number | undefined): string => {
    if (typeof value === 'number') {
      return value > 0 ? '#10b981' : '#ef4444';
    }
    return '#666'; // Default fallback color
  };

  // Safely render a stock card
  const renderStockCard = (stock: TopStock, index: number) => {
    try {
      return (
        <div key={stock.symbol || `unknown-${index}`} className="stock-card">
          <div className="stock-rank">#{index + 1}</div>
          
          <div className="stock-header">
            <h3>{stock.symbol || 'N/A'}</h3>
            <span className={`recommendation-badge ${getRecommendationClass(stock.recommendation || '')}`}>
              {stock.recommendation || 'N/A'}
            </span>
          </div>

          <div className="stock-info">
            <p className="company-name">{stock.name || 'Unknown Company'}</p>
            <p className="sector">{stock.sector || 'Unknown Sector'}</p>
          </div>

          {/* Primary metrics always visible */}
          <div className="stock-primary-metrics">
            <div className="metric">
              <span className="metric-label">Price</span>
              <span className="metric-value">
                {safeRenderNumber(stock.currentPrice, (val) => `$${val.toFixed(2)}`)}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Momentum</span>
              <span className="metric-value" style={{
                color: getColor(stock.momentum20d),
              }}>
                {safeRenderNumber(stock.momentum20d, (val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`)}
              </span>
            </div>
          </div>
          
          {/* Collapsible Financial Metrics - Mobile Only */}
          <div className="collapsible-section mobile-collapsible">
            <div 
              className="collapsible-header"
              onClick={() => toggleSection(stock.symbol || `unknown-${index}`, 'metrics')}
            >
              <span className="collapsible-title">Financial Metrics</span>
              <span className={`collapsible-icon ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'metrics') ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`collapsible-content ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'metrics') ? 'expanded' : ''}`}>
              <div className="stock-metrics">
                <div className="metric">
                  <span className="metric-label">Market Cap</span>
                  <span className="metric-value">{formatMarketCap(stock.marketCap)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">P/E Ratio</span>
                  <span className="metric-value">
                    {safeRenderNumber(stock.peRatio, (val) => (val > 0 ? val.toFixed(2) : 'N/A'))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Score Analysis */}
          <div className="collapsible-section mobile-collapsible">
            <div 
              className="collapsible-header"
              onClick={() => toggleSection(stock.symbol || `unknown-${index}`, 'scores')}
            >
              <span className="collapsible-title">Score Analysis</span>
              <span className={`collapsible-icon ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'scores') ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`collapsible-content ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'scores') ? 'expanded' : ''}`}>
              <div className="stock-scores">
                <div className="score-item">
                  <span className="score-label">Attractiveness</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill attractiveness"
                      style={{ width: `${Math.min(Math.max(stock.attractivenessScore || 0, 0), 100)}%` }}
                    />
                  </div>
                  <span className="score-value">{safeRenderNumber(stock.attractivenessScore, val => val.toFixed(1))}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Technical</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill technical"
                      style={{ width: `${Math.min(Math.max((stock.technicalScore || 0) + 50, 0), 100)}%` }}
                    />
                  </div>
                  <span className="score-value">{safeRenderNumber(stock.technicalScore, val => val.toFixed(1))}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Sentiment</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill sentiment"
                      style={{ width: `${Math.min(Math.max((stock.sentimentScore || 0) + 50, 0), 100)}%` }}
                    />
                  </div>
                  <span className="score-value">{safeRenderNumber(stock.sentimentScore, val => val.toFixed(1))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Description */}
          <div className="collapsible-section mobile-collapsible">
            <div 
              className="collapsible-header"
              onClick={() => toggleSection(stock.symbol || `unknown-${index}`, 'description')}
            >
              <span className="collapsible-title">Company Description</span>
              <span className={`collapsible-icon ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'description') ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`collapsible-content ${isSectionExpanded(stock.symbol || `unknown-${index}`, 'description') ? 'expanded' : ''}`}>
              <div className="stock-description">
                <p>{stock.description || 'No description available.'}</p>
              </div>
            </div>
          </div>

          {/* Desktop sections - CSS classes ensure these are only visible on desktop */}
          <div className="stock-metrics desktop-only-section">
            <div className="metric">
              <span className="metric-label">Price</span>
              <span className="metric-value">
                {safeRenderNumber(stock.currentPrice, (val) => `$${val.toFixed(2)}`)}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Market Cap</span>
              <span className="metric-value">{formatMarketCap(stock.marketCap)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">P/E Ratio</span>
              <span className="metric-value">
                {safeRenderNumber(stock.peRatio, (val) => (val > 0 ? val.toFixed(2) : 'N/A'))}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">20D Momentum</span>
              <span className="metric-value" style={{
                color: getColor(stock.momentum20d),
              }}>
                {safeRenderNumber(stock.momentum20d, (val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`)}
              </span>
            </div>
          </div>
          
          <div className="stock-scores desktop-only-section">
            <div className="score-item">
              <span className="score-label">Attractiveness</span>
              <div className="score-bar">
                <div 
                  className="score-fill attractiveness"
                  style={{ width: `${Math.min(Math.max(stock.attractivenessScore || 0, 0), 100)}%` }}
                />
              </div>
              <span className="score-value">{safeRenderNumber(stock.attractivenessScore, val => val.toFixed(1))}</span>
            </div>
            <div className="score-item">
              <span className="score-label">Technical</span>
              <div className="score-bar">
                <div 
                  className="score-fill technical"
                  style={{ width: `${Math.min(Math.max((stock.technicalScore || 0) + 50, 0), 100)}%` }}
                />
              </div>
              <span className="score-value">{safeRenderNumber(stock.technicalScore, val => val.toFixed(1))}</span>
            </div>
            <div className="score-item">
              <span className="score-label">Sentiment</span>
              <div className="score-bar">
                <div 
                  className="score-fill sentiment"
                  style={{ width: `${Math.min(Math.max((stock.sentimentScore || 0) + 50, 0), 100)}%` }}
                />
              </div>
              <span className="score-value">{safeRenderNumber(stock.sentimentScore, val => val.toFixed(1))}</span>
            </div>
          </div>
          
          <div className="stock-description desktop-only-section">
            <p>{stock.description || 'No description available.'}</p>
          </div>

          <div className="stock-actions">
            <WatchlistButton symbol={stock.symbol || ''} companyName={stock.name || 'Unknown'} />
            <button 
              className="analyze-button-card"
              onClick={() => window.location.href = `/?ticker=${stock.symbol || ''}`}
              disabled={!stock.symbol}
            >
              Detailed Analysis →
            </button>
          </div>
        </div>
      );
    } catch (error) {
      console.error(`Error rendering stock card for index ${index}:`, error);
      return (
        <div key={`error-${index}`} className="stock-card error-card">
          <h3>Error Rendering Stock #{index + 1}</h3>
          <p>There was a problem displaying this stock. Please try refreshing the page.</p>
        </div>
      );
    }
  };

  const getIndexName = () => {
    return type === 'nasdaq100' ? 'NASDAQ-100' : type === 'sp500' ? 'S&P 500' : 'MAG-7';
  };

  return (
    <div className="stock-screener">
      <div className="screener-header" >
        <h1 style={{  color : isDarkTheme ? '#fff' : '#666' }}>{getIndexName()} Stock Screener</h1>
        <p style={{  color : isDarkTheme ? '#fff' : '#666' }}>Find the most attractive stocks from the {getIndexName()} index based on technical and sentiment analysis</p>
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
          <p className="loading-note" style={{  color : isDarkTheme ? '#f5f3f2' : '#666' }}>
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
            <h2 className="loading-note" style={{  color : isDarkTheme ? '#f5f3f2' : '#666' }}>Top {results.topStocks?.length || 0} Most Attractive {getIndexName()} Stocks</h2>
            <p className="loading-note" style={{  color : isDarkTheme ? '#f5f3f2' : '#666' }}>Successfully analyzed {results.totalAnalyzed || 0} stocks</p>
          </div>

          <div className="stocks-grid">
            {results.topStocks && results.topStocks.length > 0 ? 
              results.topStocks.map((stock, index) => renderStockCard(stock, index)) : 
              <div className="no-results" >No stocks met the screening criteria</div>
            }
          </div>

          {results.failedSymbols && results.failedSymbols.length > 0 && (
            <div className="failed-symbols">
              <p>Failed to analyze: {results.failedSymbols.join(', ')}</p>
              {results.failedSymbols.length > 10 && 
                <p className="warning-note">A high number of analysis failures may indicate an API rate limit or service issue.</p>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockScreener;
