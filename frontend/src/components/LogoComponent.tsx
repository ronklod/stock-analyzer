import React from 'react';
// Import both logos to have them available
import whiteLogoSrc from '../images/logo_white.png';
import regularLogoSrc from '../images/logo.png';

interface LogoProps {
  variant?: 'white' | 'regular';
  width?: number;
  height?: number | 'auto';
  marginRight?: string;
}

const LogoComponent: React.FC<LogoProps> = ({
  variant = 'white',
  width = 50,
  height = 'auto',
  marginRight = '8px'
}) => {
  const logoSrc = variant === 'white' ? whiteLogoSrc : regularLogoSrc;
  
  return (
    <img 
      src={logoSrc} 
      alt="Stock Analyzer Logo" 
      style={{ 
        width,
        height,
        marginRight
      }} 
    />
  );
};

export default LogoComponent;
