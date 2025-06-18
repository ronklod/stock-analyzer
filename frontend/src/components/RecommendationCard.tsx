import React, { useState } from 'react';
import { Recommendation } from '../types';

interface Props {
  recommendation: Recommendation;
}

const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getRecommendationClass = (rec: string) => {
    return rec.replace(/\s+/g, ' ');
  };

  const scoreExplanation = `The recommendation score is calculated using a weighted combination of technical and sentiment analysis:

• Technical Score (70% weight): Based on multiple indicators including moving averages (SMA 20/50/150/200), RSI, MACD, Bollinger Bands, CCI, and Demark Indicator. Each indicator contributes bullish or bearish signals.

• Sentiment Score (30% weight): Derived from analyzing recent news articles and their sentiment using natural language processing.

• Combined Score = (Technical × 0.7) + (Sentiment × 0.3)

Recommendation thresholds:
• Strong Buy: Score > +30
• Buy: Score > +10
• Hold: Score between -10 and +10
• Sell: Score < -10
• Strong Sell: Score < -30`;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">📊 Recommendation</h2>
      </div>
      <div className="recommendation-content">
        <div className={`recommendation-badge ${getRecommendationClass(recommendation.recommendation)}`}>
          {recommendation.recommendation}
        </div>
        
        <div className="confidence-meter">
          <p style={{ marginBottom: '0.5rem', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Confidence: <strong style={{ marginLeft: '0.25rem' }}>{recommendation.confidence.toFixed(1)}%</strong>
            <span 
              className="info-icon"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
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
              }}
            >
              i
              {showTooltip && (
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
                    fontSize: '12px',
                    lineHeight: '1.6',
                    width: '320px',
                    textAlign: 'left',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontWeight: 'normal',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {scoreExplanation}
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
          </p>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${recommendation.confidence}%` }}
            />
          </div>
        </div>

        <div className="recommendation-description">
          <p style={{ 
            marginTop: '1rem', 
            marginBottom: '1rem', 
            padding: '0.75rem',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '0.5rem',
            borderLeft: '3px solid #3b82f6',
            color: '#374151',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            {recommendation.description}
          </p>
        </div>

        <div className="scores-grid">
          <div className="score-item">
            <div className="score-label">Technical Score</div>
            <div className="score-value" style={{ 
              color: recommendation.technical_score > 0 ? '#10b981' : 
                     recommendation.technical_score < 0 ? '#ef4444' : '#666' 
            }}>
              {recommendation.technical_score > 0 ? '+' : ''}{recommendation.technical_score.toFixed(1)}
            </div>
          </div>
          <div className="score-item">
            <div className="score-label">Sentiment Score</div>
            <div className="score-value" style={{ 
              color: recommendation.sentiment_score > 0 ? '#10b981' : 
                     recommendation.sentiment_score < 0 ? '#ef4444' : '#666' 
            }}>
              {recommendation.sentiment_score > 0 ? '+' : ''}{recommendation.sentiment_score.toFixed(1)}
            </div>
          </div>
          <div className="score-item">
            <div className="score-label">Combined Score</div>
            <div className="score-value" style={{ 
              color: recommendation.combined_score > 0 ? '#10b981' : 
                     recommendation.combined_score < 0 ? '#ef4444' : '#666',
              fontWeight: 700
            }}>
              {recommendation.combined_score > 0 ? '+' : ''}{recommendation.combined_score.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;