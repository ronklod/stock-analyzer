import React from 'react';
import { CompanyInfo } from '../types';

interface Props {
  companyInfo: CompanyInfo;
  ticker: string;
}

const CompanyInfoCard: React.FC<Props> = ({ companyInfo, ticker }) => {
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{ticker} - {companyInfo.name}</h2>
      </div>
      <div className="company-info-grid">
        <div className="info-item">
          <span className="info-label">Current Price</span>
          <span className="info-value">${companyInfo.currentPrice.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Day Change</span>
          <span className={`info-value price-change ${companyInfo.dayChange >= 0 ? 'positive' : 'negative'}`}>
            {companyInfo.dayChange >= 0 ? '+' : ''}{companyInfo.dayChange.toFixed(2)} 
            ({companyInfo.dayChangePercent >= 0 ? '+' : ''}{companyInfo.dayChangePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">52 Week Range</span>
          <span className="info-value">
            ${companyInfo.fiftyTwoWeekLow.toFixed(2)} - ${companyInfo.fiftyTwoWeekHigh.toFixed(2)}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Market Cap</span>
          <span className="info-value">{formatNumber(companyInfo.marketCap)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Volume</span>
          <span className="info-value">{formatVolume(companyInfo.volume)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Avg Volume</span>
          <span className="info-value">{formatVolume(companyInfo.averageVolume)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">P/E Ratio</span>
          <span className="info-value">{companyInfo.pe ? companyInfo.pe.toFixed(2) : 'N/A'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Dividend Yield</span>
          <span className="info-value">{companyInfo.dividend ? `${companyInfo.dividend.toFixed(2)}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoCard; 