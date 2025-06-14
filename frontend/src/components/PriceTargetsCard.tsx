import React from 'react';

interface SupportResistanceLevel {
  price: number;
  type: 'Support' | 'Resistance';
  strength: number;
}

interface PriceTargets {
  currentPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
}

interface Props {
  priceTargets: PriceTargets;
  supportResistanceLevels: SupportResistanceLevel[];
}

const PriceTargetsCard: React.FC<Props> = ({ priceTargets, supportResistanceLevels }) => {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  
  const calculatePercentage = (target: number, current: number) => {
    const percentage = ((target - current) / current) * 100;
    return `(${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%)`;
  };

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <h2 className="card-title">🎯 Price Targets</h2>
      </div>
      <div style={{ padding: '1.5rem' }}>
        {/* Current Price and Risk/Reward */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
              Current Price
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              {formatPrice(priceTargets.currentPrice)}
            </div>
          </div>
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
              Risk/Reward Ratio
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              {priceTargets.riskRewardRatio.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              A ratio &gt; 1 indicates potential reward outweighs the risk
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
          {/* Price Targets Section */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Price Targets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                borderRadius: '8px'
              }}>
                <span>Stop Loss</span>
                <div>
                  <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                    {formatPrice(priceTargets.stopLoss)}
                  </span>
                  <span style={{ color: '#991b1b' }}>
                    {calculatePercentage(priceTargets.stopLoss, priceTargets.currentPrice)}
                  </span>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#dcfce7',
                borderRadius: '8px'
              }}>
                <span>Target 1</span>
                <div>
                  <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                    {formatPrice(priceTargets.target1)}
                  </span>
                  <span style={{ color: '#166534' }}>
                    {calculatePercentage(priceTargets.target1, priceTargets.currentPrice)}
                  </span>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: '#dcfce7',
                borderRadius: '8px'
              }}>
                <span>Target 2</span>
                <div>
                  <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                    {formatPrice(priceTargets.target2)}
                  </span>
                  <span style={{ color: '#166534' }}>
                    {calculatePercentage(priceTargets.target2, priceTargets.currentPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Explanation */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>How Targets Are Calculated</h3>
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#4b5563'
            }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>Stop Loss:</strong> Based on the lower Bollinger Band, which represents a statistical support level. 
                When price breaks below this level, it often indicates a trend reversal.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>Target 1:</strong> Set at the upper Bollinger Band, which represents a statistical resistance level 
                where price often encounters selling pressure.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>Target 2:</strong> Extends 5% above Target 1, providing an additional profit target for strong upward trends.
              </p>
              <p>
                <strong>Risk/Reward:</strong> Calculated as the ratio between potential reward (distance to Target 1) and risk 
                (distance to Stop Loss). A higher ratio indicates a more favorable trading opportunity.
              </p>
            </div>
          </div>
        </div>

        {/* Support & Resistance Levels */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Support & Resistance Levels</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {supportResistanceLevels.map((level, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: level.type === 'Support' ? '#dcfce7' : '#fee2e2',
                borderRadius: '8px'
              }}>
                <span>{level.type}</span>
                <div>
                  <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                    {formatPrice(level.price)}
                  </span>
                  <span style={{ 
                    color: level.type === 'Support' ? '#166534' : '#991b1b',
                    fontSize: '0.9rem'
                  }}>
                    (Strength: {level.strength.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '1rem',
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#4b5563'
          }}>
            <p>
              <strong>How Strength is Calculated:</strong> Support and resistance levels are identified using technical 
              indicators like Moving Averages and Bollinger Bands. The strength percentage indicates how reliable the level 
              is based on multiple factors:
            </p>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>Bollinger Bands: 70% strength (highly reliable)</li>
              <li>Moving Averages: 60% strength (moderately reliable)</li>
              <li>Higher strength indicates more significant price reaction at these levels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceTargetsCard; 