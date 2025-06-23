import React from 'react';

/**
 * A helper function that enhances mobile tooltip experience by showing popup dialogs when clicked.
 * Usage: Add this script tag to your HTML file and it will automatically convert tooltips to tap-to-show dialogs on mobile.
 */
const enhanceMobileTooltips = () => {
  // Only run in browser environment
  if (typeof document === 'undefined') return;
  
  // Check if running on a touch device
  const isTouchDevice = () => {
    return (('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0));
  };
  
  if (!isTouchDevice()) return;
  
  const tooltipEnhancerStyle = document.createElement('style');
  tooltipEnhancerStyle.innerHTML = `
    /* Mobile Note Dialog Styles */
    .mobile-note-dialog {
      position: fixed;
      z-index: 9999;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    
    .mobile-note-dialog.active {
      opacity: 1;
      pointer-events: all;
    }
    
    .mobile-note-dialog-content {
      position: relative;
      width: 85%;
      max-width: 400px;
      padding: 20px;
      background-color: #ffffff;
      color: #000000;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .dark-mode .mobile-note-dialog-content {
      background-color: #1a1a2e;
      color: #ffffff;
    }
    
    .mobile-note-title {
      margin-top: 0;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
      color: inherit;
    }
    
    .mobile-note-text {
      margin-bottom: 16px;
      white-space: pre-wrap;
      word-break: break-word;
      color: inherit;
    }
    
    .mobile-note-close {
      display: block;
      padding: 8px 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      margin-left: auto;
      cursor: pointer;
      font-weight: bold;
    }
  `;
  document.head.appendChild(tooltipEnhancerStyle);

  // Function to create and show dialog
  const showMobileNoteDialog = (symbol: string, note: string) => {
    const dialog = document.createElement('div');
    dialog.className = 'mobile-note-dialog';
    
    // Check for dark mode
    const isDarkMode = document.documentElement.classList.contains('dark-mode') || 
                      document.body.classList.contains('dark-mode') ||
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    dialog.innerHTML = `
      <div class="mobile-note-dialog-content${isDarkMode ? ' dark-mode' : ''}">
        <h3 class="mobile-note-title">Note for ${symbol}</h3>
        <div class="mobile-note-text">${note}</div>
        <button class="mobile-note-close">Close</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add animation delay
    setTimeout(() => {
      dialog.classList.add('active');
    }, 10);
    
    // Handle close
    const closeBtn = dialog.querySelector('.mobile-note-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dialog.classList.remove('active');
        setTimeout(() => {
          document.body.removeChild(dialog);
        }, 200);
      });
    }
    
    // Close on background click
    dialog.addEventListener('click', (e: Event) => {
      if (e.target === dialog && closeBtn instanceof HTMLElement) {
        closeBtn.click();
      }
    });
  };

  // Find all tooltip-enabled note icons and add click handlers
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
            const noteIcons = node.querySelectorAll('[data-note]');
            noteIcons.forEach((icon: Element) => {
              if (!icon.hasAttribute('data-note-enhanced')) {
                const note = icon.getAttribute('data-note') || '';
                const symbol = icon.getAttribute('data-symbol') || '';
                icon.addEventListener('click', (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                  showMobileNoteDialog(symbol, note);
                });
                icon.setAttribute('data-note-enhanced', 'true');
              }
            });
          }
        });
      }
    }
  });

  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial scan for existing elements
  const noteIcons = document.querySelectorAll('[data-note]');
  noteIcons.forEach((icon: Element) => {
    if (!icon.hasAttribute('data-note-enhanced')) {
      const note = icon.getAttribute('data-note') || '';
      const symbol = icon.getAttribute('data-symbol') || '';
      icon.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        showMobileNoteDialog(symbol, note);
      });
      icon.setAttribute('data-note-enhanced', 'true');
    }
  });
};

export default enhanceMobileTooltips;
