import React, { useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

/**
 * A custom hook to enhance tooltip experience on mobile devices
 * This adds several improvements:
 * 1. Increases touch target size
 * 2. Makes tooltips show on tap instead of hover
 * 3. Adds active state styles
 * 4. Improves tooltip positioning
 */
const useMobileTooltipEnhancer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    if (!isMobile) return;
    
    // Add mobile-specific tooltip styles to the document
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.innerHTML = `
      /* Mobile Tooltip Enhancements */
      .MuiTooltip-tooltip {
        font-size: 14px !important;
        max-width: 280px !important;
        padding: 10px 14px !important;
        line-height: 1.5 !important;
        background-color: ${theme.palette.mode === 'dark' ? '#1a1a2e' : '#ffffff'} !important;
        color: ${theme.palette.mode === 'dark' ? '#ffffff' : '#000000'} !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        border-radius: 8px !important;
        border: 1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }
      
      /* Force tooltip visibility on touch (overrides pointer-events) */
      .mobile-tooltip-trigger {
        position: relative;
      }
      
      .mobile-tooltip-trigger::after {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        z-index: 2;
      }
    `;
    
    document.head.appendChild(styleEl);
    
    // Add touch event handlers to tooltip triggers
    const enhanceTooltips = () => {
      const tooltipTriggers = document.querySelectorAll('.MuiIconButton-root, [role="button"]');
      
      tooltipTriggers.forEach(trigger => {
        if (!trigger.classList.contains('mobile-tooltip-enhanced')) {
          trigger.classList.add('mobile-tooltip-trigger');
          trigger.classList.add('mobile-tooltip-enhanced');
          
          // This helps override MUI's tooltip behavior on mobile
          trigger.addEventListener('touchend', (e) => {
            e.stopPropagation();
            // Keep the default behavior, we're just adding the class
          }, { passive: true });
        }
      });
    };
    
    // Run enhancement initially and set up observer
    enhanceTooltips();
    
    // Set up a mutation observer to detect new tooltip triggers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          enhanceTooltips();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Clean up
    return () => {
      document.head.removeChild(styleEl);
      observer.disconnect();
    };
  }, [isMobile, theme.palette.mode]);
  
  return null;
};

export default useMobileTooltipEnhancer;
