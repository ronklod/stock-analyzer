import React, { useState } from 'react';
import { TechnicalAnalysis, SentimentAnalysis } from '../types';
import { format } from 'date-fns';
import FullScreenModal from './FullScreenModal';
import { useMediaQuery } from '@mui/material';

interface Props {
  technicalAnalysis: TechnicalAnalysis;
  sentimentAnalysis: SentimentAnalysis;
}

// Component for a chart section
interface ChartSectionProps {
  title: string;
  children: React.ReactNode;
}

const ChartSection: React.FC<ChartSectionProps> = ({ title, children }) => {
  return (
    <div className="chart-section" style={{ marginBottom: '16px', position: 'relative' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

const TechnicalAnalysisCard: React.FC<Props> = ({ technicalAnalysis, sentimentAnalysis }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);
  const [showSentimentInfo, setShowSentimentInfo] = useState(false);
  const [showNewsImpact, setShowNewsImpact] = useState(false);
  
  // New state for full screen mode
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);
  const [fullScreenContent, setFullScreenContent] = useState<React.ReactNode | null>(null);

  const getSignalClass = (signal: string) => {
    if (signal.includes('Bullish')) return 'Bullish';
    if (signal.includes('Bearish')) return 'Bearish';
    if (signal.includes('Neutral')) return 'Neutral';
    return '';
  };

  const indicatorDescriptions: Record<string, string> = {
    'RSI': 'Relative Strength Index (RSI) measures momentum. Values above 70 indicate overbought conditions (potential price drop), while values below 30 indicate oversold conditions (potential price rise).',
    'MACD': 'Moving Average Convergence Divergence (MACD) identifies trend changes. When MACD crosses above the signal line, it\'s bullish. When it crosses below, it\'s bearish.',
    'Bollinger_Bands': 'Bollinger Bands measure volatility. Price touching the upper band suggests overbought conditions, while touching the lower band suggests oversold conditions.',
    'CCI': 'Commodity Channel Index (CCI) identifies cyclical trends. Values above +100 indicate overbought conditions, while values below -100 indicate oversold conditions.',
    'Demark_Indicator': 'The Demark Indicator identifies potential price exhaustion points and trend reversals. A buy signal occurs after 9 consecutive closes lower than the close 4 bars earlier, indicating a potential upward reversal. A sell signal occurs after 9 consecutive closes higher than the close 4 bars earlier, indicating a potential downward reversal.',
    'AI_Analysis': 'AI-powered comprehensive stock analysis using advanced machine learning models. The AI analyzes fundamental data, technical patterns, market sentiment, and sector trends to provide investment recommendations with confidence scores. This combines multiple analytical approaches into a single actionable signal.'
  };

  const shouldShowInfo = (indicator: string) => {
    return ['RSI', 'MACD', 'Bollinger_Bands', 'CCI', 'Demark_Indicator', 'AI_Analysis'].includes(indicator);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const sentimentExplanation = `
Market Sentiment Analysis Methodology:

1. Data Sources:
   • Major financial news sources (Bloomberg, CNBC, Reuters, WSJ)
   • Company-specific news and press releases
   • Market analysis reports

2. Sentiment Calculation:
   • Natural Language Processing (NLP) analysis of news content
   • Weighted scoring based on source credibility
   • Recent news given higher importance
   • Source diversity bonus for multiple perspectives

3. Score Range: -100 to +100
   • Above +20: Strongly Positive
   • 0 to +20: Slightly Positive
   • -20 to 0: Slightly Negative
   • Below -20: Strongly Negative

Current Score: ${sentimentAnalysis.score.toFixed(1)}
Based on ${sentimentAnalysis.articles?.length || 0} recent articles
  `;

  // Create chart sections
  const createTechnicalSignalsSection = () => (
    <div className="signals-list" style={{ padding: fullScreenChart === 'technical' ? '20px' : '0' }}>
      {Object.entries(technicalAnalysis.signals).map(([indicator, signal]) => (
        <div key={indicator} className="signal-item" style={{ 
          marginBottom: '12px',
          fontSize: fullScreenChart === 'technical' ? '16px' : 'inherit'
        }}>
          <span className="signal-name">
            {indicator.replace(/_/g, ' ')}
            {shouldShowInfo(indicator) && (
              <span 
                className="info-icon"
                onMouseEnter={() => setHoveredIndicator(indicator)}
                onMouseLeave={() => setHoveredIndicator(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: fullScreenChart === 'technical' ? '20px' : '16px',
                  height: fullScreenChart === 'technical' ? '20px' : '16px',
                  marginLeft: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '50%',
                  cursor: 'help',
                  fontSize: fullScreenChart === 'technical' ? '13px' : '11px',
                  fontWeight: 'bold',
                  color: '#6b7280',
                  position: 'relative',
                }}
              >
                i
                {hoveredIndicator === indicator && (
                  <div
                    className="tooltip"
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(31, 41, 55, 0.95)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: fullScreenChart === 'technical' ? '14px' : '12px',
                      lineHeight: '1.4',
                      width: fullScreenChart === 'technical' ? '320px' : '250px',
                      textAlign: 'left',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      fontWeight: 'normal',
                    }}
                  >
                    {indicatorDescriptions[indicator]}
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                      }}
                    />
                  </div>
                )}
              </span>
            )}
          </span>
          <span className={`signal-value ${getSignalClass(signal)}`} style={{
            fontSize: fullScreenChart === 'technical' ? '16px' : 'inherit'
          }}>
            {signal}
          </span>
        </div>
      ))}
    </div>
  );

  const createSentimentSection = () => (
    <div className="sentiment-section" style={{ padding: fullScreenChart === 'sentiment' ? '20px' : '0' }}>
      <h3 style={{ 
        fontSize: fullScreenChart === 'sentiment' ? '1.3rem' : '1.1rem', 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        📰 News Sentiment
        <span 
          className="info-icon"
          onMouseEnter={() => setShowSentimentInfo(true)}
          onMouseLeave={() => setShowSentimentInfo(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: fullScreenChart === 'sentiment' ? '20px' : '16px',
            height: fullScreenChart === 'sentiment' ? '20px' : '16px',
            marginLeft: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '50%',
            cursor: 'help',
            fontSize: fullScreenChart === 'sentiment' ? '13px' : '11px',
            fontWeight: 'bold',
            color: '#6b7280',
            position: 'relative',
          }}
        >
          i
          {showSentimentInfo && (
            <div
              className="tooltip"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                padding: '12px 16px',
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                color: 'white',
                borderRadius: '6px',
                fontSize: fullScreenChart === 'sentiment' ? '14px' : '12px',
                lineHeight: '1.6',
                width: fullScreenChart === 'sentiment' ? '400px' : '320px',
                textAlign: 'left',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                fontWeight: 'normal',
                whiteSpace: 'pre-line',
              }}
            >
              {sentimentExplanation}
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                }}
              />
            </div>
          )}
        </span>
      </h3>
      <div className="signal-item" style={{ 
        marginBottom: '16px',
        fontSize: fullScreenChart === 'sentiment' ? '16px' : 'inherit' 
      }}>
        <span className="signal-name">Market Sentiment</span>
        <span className={`signal-value ${
          sentimentAnalysis.score > 0 ? 'Bullish' : 
          sentimentAnalysis.score < 0 ? 'Bearish' : 'Neutral'
        }`} style={{
          fontSize: fullScreenChart === 'sentiment' ? '16px' : 'inherit'
        }}>
          {sentimentAnalysis.description} ({sentimentAnalysis.score > 0 ? '+' : ''}{sentimentAnalysis.score.toFixed(1)})
        </span>
      </div>

      {/* Collapsible News Articles Section */}
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setShowNewsImpact(!showNewsImpact)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#1976d2',
            fontSize: fullScreenChart === 'sentiment' ? '1rem' : '0.9rem',
            fontWeight: 500,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.05)'}
        >
          <span>Recent News Impact</span>
          <span style={{ 
            transform: showNewsImpact ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: fullScreenChart === 'sentiment' ? '1.3rem' : '1.2rem'
          }}>
            ▼
          </span>
        </button>

        {showNewsImpact && (
          <div className="news-articles" style={{ marginTop: '0.75rem' }}>
            <div className="articles-list" style={{ 
              maxHeight: fullScreenChart === 'sentiment' ? '400px' : '200px', 
              overflowY: 'auto' 
            }}>
              {(sentimentAnalysis.articles || []).map((article, index) => (
                <a 
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                >
                  <div style={{ 
                    fontSize: fullScreenChart === 'sentiment' ? '1rem' : '0.9rem', 
                    fontWeight: 500, 
                    marginBottom: '0.25rem', 
                    color: '#1a1a1a' 
                  }}>
                    {article.title}
                  </div>
                  <div style={{ 
                    fontSize: fullScreenChart === 'sentiment' ? '0.9rem' : '0.8rem', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{article.source}</span>
                    <span style={{ 
                      color: article.sentiment > 0 ? '#10b981' : article.sentiment < 0 ? '#ef4444' : '#666',
                      marginLeft: '0.5rem'
                    }}>
                      {article.sentiment > 0 ? '+' : ''}{(article.sentiment * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: fullScreenChart === 'sentiment' ? '0.9rem' : '0.8rem', 
                    color: '#666', 
                    marginTop: '0.25rem' 
                  }}>
                    {formatDate(article.date)}
                  </div>
                </a>
              ))}
              {(!sentimentAnalysis.articles || sentimentAnalysis.articles.length === 0) && (
                <div style={{ 
                  padding: '1rem', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: fullScreenChart === 'sentiment' ? '1rem' : '0.9rem',
                  fontStyle: 'italic'
                }}>
                  No recent news articles available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ fontSize: isMobile ? '1rem' : '1.3rem' }}>📈 Technical Analysis</h2>
      </div>
      <div className="technical-content" style={{ fontSize: isMobile ? '0.9rem' : '1rem',color: '#666' }}>
        <ChartSection 
          title="Technical Signals" 
        >
          {createTechnicalSignalsSection()}
        </ChartSection>

        <ChartSection
          title="News Sentiment"
        >
          {createSentimentSection()}  
        </ChartSection>
      </div>

      {/* Full screen modals */}
      <FullScreenModal
        isOpen={fullScreenChart === 'technical'}
        title="Technical Analysis Signals"
        onClose={() => setFullScreenChart(null)}
      >
        {createTechnicalSignalsSection()}
      </FullScreenModal>

      <FullScreenModal
        isOpen={fullScreenChart === 'sentiment'}
        title="News Sentiment Analysis"
        onClose={() => setFullScreenChart(null)}
      >
        {createSentimentSection()}
      </FullScreenModal>
    </div>
  );
};

export default TechnicalAnalysisCard;