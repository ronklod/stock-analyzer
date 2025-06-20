import React, { useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useMediaQuery } from '@mui/material';

interface CollapsibleExplanationProps {
  title: string;
  children: React.ReactNode;
  initialState?: boolean;
  className?: string;
  buttonStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

const CollapsibleExplanation: React.FC<CollapsibleExplanationProps> = ({
  title,
  children,
  initialState,
  className = '',
  buttonStyle = {},
  contentStyle = {}
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  // Default to collapsed on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(
    initialState !== undefined ? initialState : !isMobile
  );

  return (
    <div className={`collapsible-explanation ${className}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#f0f0f0',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: 500,
          ...buttonStyle
        }}
      >
        <span>{title}</span>
        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: '0.75rem',
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: '#4b5563',
            ...contentStyle
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleExplanation;
