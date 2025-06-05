import React, { useState } from 'react';
import { TechnicalAnalysis, SentimentAnalysis } from '../types';

interface Props {
  technicalAnalysis: TechnicalAnalysis;
  sentimentAnalysis: SentimentAnalysis;
}

const TechnicalAnalysisCard: React.FC<Props> = ({ technicalAnalysis, sentimentAnalysis }) => {
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);

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
    'CCI': 'Commodity Channel Index (CCI) identifies cyclical trends. Values above +100 indicate overbought conditions, while values below -100 indicate oversold conditions.'
  };

  const shouldShowInfo = (indicator: string) => {
    return ['RSI', 'MACD', 'Bollinger_Bands', 'CCI'].includes(indicator);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">📈 Technical Analysis</h2>
      </div>
      
      <div className="signals-list">
        {Object.entries(technicalAnalysis.signals).map(([indicator, signal]) => (
          <div key={indicator} className="signal-item">
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
                    width: '16px',
                    height: '16px',
                    marginLeft: '6px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '50%',
                    cursor: 'help',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#6b7280',
                    position: 'relative',
                    verticalAlign: 'middle',
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
                        fontSize: '12px',
                        lineHeight: '1.4',
                        width: '250px',
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
            <span className={`signal-value ${getSignalClass(signal)}`}>
              {signal}
            </span>
          </div>
        ))}
      </div>

      <div className="sentiment-section">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📰 News Sentiment</h3>
        <div className="signal-item">
          <span className="signal-name">Market Sentiment</span>
          <span className={`signal-value ${
            sentimentAnalysis.score > 0 ? 'Bullish' : 
            sentimentAnalysis.score < 0 ? 'Bearish' : 'Neutral'
          }`}>
            {sentimentAnalysis.description} ({sentimentAnalysis.score > 0 ? '+' : ''}{sentimentAnalysis.score.toFixed(1)})
          </span>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysisCard; 