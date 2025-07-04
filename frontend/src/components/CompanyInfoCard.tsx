import React from 'react';
import { CompanyInfo } from '../types';
import { useMediaQuery } from '@mui/material';

interface Props {
  companyInfo: CompanyInfo;
  ticker: string;
}

const CompanyInfoCard: React.FC<Props> = ({ companyInfo, ticker }) => {
  const isMobile = useMediaQuery('(max-width:768px)');

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
        <h2 className="card-title" style={{ fontSize: isMobile ? '1rem' : '1.3rem' }}>{ticker} - {companyInfo.name}</h2>
      </div>
      <div className="company-info-grid" style={{ gap: isMobile ? '0.5rem' : '1rem' }}>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Current Price</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>${companyInfo.currentPrice.toFixed(2)}</span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Day Change</span>
          <span className={`info-value price-change ${companyInfo.dayChange >= 0 ? 'positive' : 'negative'}`} 
                style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>
            {companyInfo.dayChange >= 0 ? '+' : ''}{companyInfo.dayChange.toFixed(2)} 
            ({companyInfo.dayChangePercent >= 0 ? '+' : ''}{companyInfo.dayChangePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>52 Week Range</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>
            ${companyInfo.fiftyTwoWeekLow.toFixed(2)} - ${companyInfo.fiftyTwoWeekHigh.toFixed(2)}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Market Cap</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{formatNumber(companyInfo.marketCap)}</span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Volume</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{formatVolume(companyInfo.volume)}</span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Avg Volume</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{formatVolume(companyInfo.averageVolume)}</span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>P/E Ratio</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{companyInfo.pe ? companyInfo.pe.toFixed(2) : 'N/A'}</span>
        </div>
        <div className="info-item">
          <span className="info-label" style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>Dividend Yield</span>
          <span className="info-value" style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{companyInfo.dividend ? `${companyInfo.dividend.toFixed(2)}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoCard;