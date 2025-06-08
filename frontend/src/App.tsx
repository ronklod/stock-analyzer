import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
import './App.css';
import CompanyInfoCard from './components/CompanyInfoCard';
import RecommendationCard from './components/RecommendationCard';
import TechnicalAnalysisCard from './components/TechnicalAnalysisCard';
import StockChart from './components/StockChart';
import StockScreener from './components/StockScreener';
import WatchlistPage from './components/WatchlistPage';
import './StockScreener.css';
import { StockAnalysisResponse } from './types';
import PriceTargetsCard from './components/PriceTargetsCard';
import WatchlistButton from './components/WatchlistButton';

function StockAnalyzer() {
  const [searchParams] = useSearchParams();
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<StockAnalysisResponse | null>(null);

  // Check for ticker in URL params on mount
  useEffect(() => {
    const tickerParam = searchParams.get('ticker');
    if (tickerParam) {
      setTicker(tickerParam.toUpperCase());
      // Auto-analyze if ticker is provided in URL
      handleAnalyze(tickerParam);
    }
  }, [searchParams]);

  const handleAnalyze = async (tickerToAnalyze?: string) => {
    const symbolToAnalyze = tickerToAnalyze || ticker;
    if (!symbolToAnalyze.trim()) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: symbolToAnalyze.toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze stock');
      }

      const data: StockAnalysisResponse = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <AppHeader />
      <main className="App-main">
        <section className="search-section">
          <div className="search-container">
            <input
              type="text"
              className="ticker-input"
              placeholder="Enter stock ticker (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={loading}
            />
            <button 
              className="analyze-button"
              onClick={() => handleAnalyze()}
              disabled={loading || !ticker.trim()}
            >
              {loading ? 'Analyzing...' : 'Analyze Stock'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </section>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing {ticker}...</p>
          </div>
        )}

        {analysisData && (
          <section className="results-section">
            <div className="results-header">
              <h2>{analysisData.ticker} Analysis Results</h2>
              <WatchlistButton 
                symbol={analysisData.ticker} 
                companyName={analysisData.companyInfo.name} 
              />
            </div>
            <div className="results-grid">
              <CompanyInfoCard companyInfo={analysisData.companyInfo} ticker={analysisData.ticker} />
              <RecommendationCard recommendation={analysisData.recommendation} />
              <TechnicalAnalysisCard 
                technicalAnalysis={analysisData.technicalAnalysis}
                sentimentAnalysis={analysisData.sentimentAnalysis}
              />
              <PriceTargetsCard 
                priceTargets={{
                  currentPrice: analysisData.priceTargets.current_price,
                  stopLoss: analysisData.priceTargets.stop_loss,
                  target1: analysisData.priceTargets.target_1,
                  target2: analysisData.priceTargets.target_2,
                  riskRewardRatio: analysisData.priceTargets.risk_reward,
                }}
                supportResistanceLevels={analysisData.supportResistanceLevels}
              />
            </div>
            
            <div className="chart-section">
              <StockChart 
                chartData={analysisData.chartData}
                ticker={analysisData.ticker}
                supportResistanceLevels={analysisData.supportResistanceLevels}
              />
            </div>
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  return (
    <header className="App-header">
      <h1>📈 Stock Analyzer</h1>
      <p>Get AI-powered stock analysis with technical indicators and sentiment analysis</p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/" style={{ color: 'white', marginRight: '2rem' }}>Analyzer</Link>
        <Link to="/screener/nasdaq100" style={{ color: 'white', marginRight: '2rem' }}>NASDAQ-100 Screener</Link>
        <Link to="/screener/sp500" style={{ color: 'white', marginRight: '2rem' }}>S&P 500 Screener</Link>
        <Link to="/screener/mag7" style={{ color: 'white', marginRight: '2rem' }}>MAG7 Screener</Link>
        <Link to="/watchlist" style={{ color: 'white' }}>My Watchlist</Link>
      </nav>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="App-footer">
      <p>© 2024 Stock Analyzer. Data provided by Yahoo Finance.</p>
    </footer>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StockAnalyzer />} />
        <Route path="/screener/nasdaq100" element={
          <div className="App">
            <AppHeader />
            <main className="App-main">
              <StockScreener type="nasdaq100" />
            </main>
            <AppFooter />
          </div>
        } />
        <Route path="/screener/sp500" element={
          <div className="App">
            <AppHeader />
            <main className="App-main">
              <StockScreener type="sp500" />
            </main>
            <AppFooter />
          </div>
        } />
        <Route path="/screener/mag7" element={
          <div className="App">
            <AppHeader />
            <main className="App-main">
              <StockScreener type="mag7" />
            </main>
            <AppFooter />
          </div>
        } />
        <Route path="/watchlist" element={
          <div className="App">
            <AppHeader />
            <main className="App-main">
              <WatchlistPage />
            </main>
            <AppFooter />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App; 