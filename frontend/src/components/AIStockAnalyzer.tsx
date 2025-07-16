import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { AIAnalysisResponse } from '../types';
import { useApi } from '../utils/apiClient';
import { useTheme } from '../context/ThemeContext';
import useMobileTooltipEnhancer from '../hooks/useMobileTooltipEnhancer';
import './AIStockAnalyzer.css';

const AIStockAnalyzer: React.FC = () => {
  // Use the mobile tooltip enhancer hook
  useMobileTooltipEnhancer();
  const [searchParams] = useSearchParams();
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const api = useApi();
  const isMobile = useMediaQuery('(max-width:768px)');
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  // Check for ticker in URL params on mount
  useEffect(() => {
    const tickerParam = searchParams.get('ticker');
    if (tickerParam) {
      setTicker(tickerParam.toUpperCase());
      // Auto-analyze if ticker is provided in URL
      handleAnalyzeAI(tickerParam);
    }
  }, [searchParams]);

  const handleAnalyzeAI = async (tickerToAnalyze?: string) => {
    const symbolToAnalyze = tickerToAnalyze || ticker;
    if (!symbolToAnalyze.trim()) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError(null);
    setAiAnalysis(null);

    try {
      const data = await api.analyzeStockAI(symbolToAnalyze.toUpperCase());
      setAiAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toUpperCase()) {
      case 'BULLISH':
        return '#4caf50';
      case 'BEARISH':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return '#4caf50';
      case 'SELL':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  return (
    <div className="ai-stock-analyzer">
      <main className="ai-analyzer-main">
        <section className="ai-search-section">
          <div className="ai-search-header">
            <h1 style={{ color: isDarkTheme ? '#fff' : '#666' }}>
              AI-Powered Stock Analysis
            </h1>
            <p style={{ color: isDarkTheme ? '#fff' : '#666' }}>
              Get comprehensive AI-driven investment insights powered by advanced language models
            </p>
          </div>
          
          <div className={`ai-search-container ${isMobile ? 'mobile-stack' : ''}`}>
            <input
              type="text"
              className="ai-ticker-input"
              placeholder="Enter stock ticker (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeAI()}
              disabled={loading}
              style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
            <button 
              className="ai-analyze-button"
              onClick={() => handleAnalyzeAI()}
              disabled={loading || !ticker.trim()}
              style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            >
              {loading ? 'Analyzing with AI...' : 'Analyze with AI'}
            </button>
          </div>
          {error && <div className="ai-error-message">{error}</div>}
        </section>

        {loading && (
          <div className="ai-loading-container">
            <div className="ai-loading-spinner"></div>
            <p>AI is analyzing {ticker}... This may take a moment.</p>
          </div>
        )}

        {aiAnalysis && (
          <section className="ai-results-section">
            <div className="ai-results-header">
              <h2 style={{ color: isDarkTheme ? '#fff' : '#666' }}>
                AI Analysis for {aiAnalysis.ticker}
              </h2>
            </div>

            <div className="ai-analysis-grid">
              {/* Overview Card */}
              <div className="ai-analysis-card ai-overview-card">
                <h3>AI Investment Overview</h3>
                <div className="ai-overview-content">
                  <div className="ai-sentiment-badge" 
                       style={{ backgroundColor: getSentimentColor(aiAnalysis.overall_sentiment) }}>
                    {aiAnalysis.overall_sentiment}
                  </div>
                  <div className="ai-recommendation-badge"
                       style={{ backgroundColor: getRecommendationColor(aiAnalysis.investment_recommendation) }}>
                    {aiAnalysis.investment_recommendation}
                  </div>
                  <div className="ai-confidence">
                    <span>Confidence: {aiAnalysis.confidence_score}/10</span>
                  </div>
                  {aiAnalysis.price_target && (
                    <div className="ai-price-target">
                      <span>AI Price Target: {aiAnalysis.price_target}</span>
                    </div>
                  )}
                  {aiAnalysis.time_horizon && (
                    <div className="ai-time-horizon">
                      <span>Time Horizon: {aiAnalysis.time_horizon}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div className="ai-analysis-card ai-summary-card">
                <h3>Executive Summary</h3>
                <p className="ai-summary-text">{aiAnalysis.summary}</p>
              </div>

              {/* Strengths & Risks */}
              <div className="ai-analysis-card ai-strengths-risks-card">
                <div className="ai-strengths-risks-grid">
                  <div className="ai-strengths">
                    <h4 style={{ color: '#4caf50' }}>Key Strengths</h4>
                    <ul>
                      {aiAnalysis.key_strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ai-risks">
                    <h4 style={{ color: '#f44336' }}>Key Risks</h4>
                    <ul>
                      {aiAnalysis.key_risks.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fundamental Analysis */}
              <div className="ai-analysis-card ai-fundamental-card">
                <h3>Fundamental Analysis</h3>
                <p className="ai-analysis-text">{aiAnalysis.fundamental_analysis}</p>
              </div>

              {/* Technical Outlook */}
              <div className="ai-analysis-card ai-technical-card">
                <h3>Technical Outlook</h3>
                <p className="ai-analysis-text">{aiAnalysis.technical_outlook}</p>
              </div>

              {/* Sector Analysis */}
              {aiAnalysis.sector_analysis && (
                <div className="ai-analysis-card ai-sector-card">
                  <h3>Sector Analysis</h3>
                  <p className="ai-analysis-text">{aiAnalysis.sector_analysis}</p>
                </div>
              )}

              {/* Catalysts & Concerns */}
              {(aiAnalysis.catalysts || aiAnalysis.concerns) && (
                <div className="ai-analysis-card ai-catalysts-concerns-card">
                  <div className="ai-catalysts-concerns-grid">
                    {aiAnalysis.catalysts && aiAnalysis.catalysts.length > 0 && (
                      <div className="ai-catalysts">
                        <h4 style={{ color: '#4caf50' }}>Positive Catalysts</h4>
                        <ul>
                          {aiAnalysis.catalysts.map((catalyst, index) => (
                            <li key={index}>{catalyst}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiAnalysis.concerns && aiAnalysis.concerns.length > 0 && (
                      <div className="ai-concerns">
                        <h4 style={{ color: '#f44336' }}>Key Concerns</h4>
                        <ul>
                          {aiAnalysis.concerns.map((concern, index) => (
                            <li key={index}>{concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AIStockAnalyzer; 