import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@mui/material'; // Import useMediaQuery for responsive design
import './App.css';
import CompanyInfoCard from './components/CompanyInfoCard';
import RecommendationCard from './components/RecommendationCard';
import TechnicalAnalysisCard from './components/TechnicalAnalysisCard';
import StockChart from './components/StockChart';
import StockScreener from './components/StockScreener';
import WatchlistPage from './components/WatchlistPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import './StockScreener.css';
import { StockAnalysisResponse } from './types';
import PriceTargetsCard from './components/PriceTargetsCard';
import WatchlistButton from './components/WatchlistButton';
import { useApi } from './utils/apiClient';
import './theme.css'; // Import theme styles

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AIStockAnalyzer from './components/AIStockAnalyzer';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminRoute from './components/AdminRoute';
import { useTheme } from './context/ThemeContext';
import useMobileTooltipEnhancer from './hooks/useMobileTooltipEnhancer';

function StockAnalyzer() {
  // Use the mobile tooltip enhancer hook
  useMobileTooltipEnhancer();
  const [searchParams] = useSearchParams();
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockAnalysisResponse | null>(null);
  const api = useApi();
  const isMobile = useMediaQuery('(max-width:768px)'); // Add responsive hook
  const { theme } = useTheme(); // Get current theme from context
  const isDarkTheme = theme === 'dark'; 

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
    setStockData(null);

    try {
      const data = await api.analyzeStock(symbolToAnalyze.toUpperCase());
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App"> 
      <main className="App-main">
        <section className="search-section">
          <div className={`search-container ${isMobile ? 'mobile-stack' : ''}`}>
            <input
              type="text"
              className="ticker-input"
              placeholder="Enter stock ticker (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={loading}
              style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
            <button 
              className="analyze-button"
              onClick={() => handleAnalyze()}
              disabled={loading || !ticker.trim()}
              style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
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

        {stockData && (
          <section className="results-section">
            <div
              className={`results-header ${isMobile ? 'mobile-stack' : ''}`}
              style={{
              marginBottom: isMobile ? '0.5rem' : '1rem'
              }}
            >
             
              <h2 style={{ marginBottom: isMobile ? '1rem' : '0.5rem', color : isDarkTheme ? '#fff' : '#666' }}>{stockData.companyInfo.name} ({stockData.ticker})</h2>
              <WatchlistButton symbol={stockData.ticker} companyName={stockData.companyInfo.name} />
            </div>
            
            <div className="results-grid" style={{ 
              gap: isMobile ? '0.75rem' : '2rem',
              gridTemplateColumns: isMobile ? '1fr' : '1fr'
            }}>
              {/* Top three main cards in special container for desktop layout */}
              <div className="top-cards-container">
                <CompanyInfoCard companyInfo={stockData.companyInfo} ticker={stockData.ticker} />
                <RecommendationCard recommendation={stockData.recommendation} />
                <TechnicalAnalysisCard 
                  technicalAnalysis={stockData.technicalAnalysis}
                  sentimentAnalysis={stockData.sentimentAnalysis}
                />
              </div>
              <PriceTargetsCard 
                priceTargets={{
                  currentPrice: stockData.priceTargets.current_price,
                  stopLoss: stockData.priceTargets.stop_loss,
                  target1: stockData.priceTargets.target_1,
                  target2: stockData.priceTargets.target_2,
                  riskRewardRatio: stockData.priceTargets.risk_reward,
                }}
                supportResistanceLevels={stockData.supportResistanceLevels}
              />
            </div>
            
            <div className="chart-section">
              <StockChart 
                chartData={stockData.chartData}
                ticker={stockData.ticker}
                supportResistanceLevels={stockData.supportResistanceLevels}
              />
            </div>
          </section>
        )}
      </main>
      
    </div>
  );
}



function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="App-main">
              <Routes>
                {/* Public routes - only login and register */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* All other routes require authentication */}
                <Route element={<ProtectedRoute />}>
                  {/* Main analyzer route */}
                  <Route path="/" element={<StockAnalyzer />} />
                  
                  {/* AI analyzer route */}
                  <Route path="/ai-analysis" element={<AIStockAnalyzer />} />
                  
                  {/* Screener routes */}
                  <Route path="/screener/nasdaq100" element={<StockScreener type="nasdaq100" />} />
                  <Route path="/screener/sp500" element={<StockScreener type="sp500" />} />
                  <Route path="/screener/mag7" element={<StockScreener type="mag7" />} />
                  
                  {/* User profile and watchlist */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                </Route>
                
                {/* Admin routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Routes>
            </main>

          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;