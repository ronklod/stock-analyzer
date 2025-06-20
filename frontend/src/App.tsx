import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function StockAnalyzer() {
  const [searchParams] = useSearchParams();
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<StockAnalysisResponse | null>(null);
  const api = useApi();

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
      const data = await api.analyzeStock(symbolToAnalyze.toUpperCase());
      setAnalysisData(data);
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
                  
                  {/* Screener routes */}
                  <Route path="/screener/nasdaq100" element={<StockScreener type="nasdaq100" />} />
                  <Route path="/screener/sp500" element={<StockScreener type="sp500" />} />
                  <Route path="/screener/mag7" element={<StockScreener type="mag7" />} />
                  
                  {/* User profile and watchlist */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
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