import React, { useEffect, useRef, useState } from 'react';
import { setupFocusTrap } from '../utils/focusTrap';

interface FullScreenModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const FullScreenModal: React.FC<FullScreenModalProps> = ({ isOpen, title, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  
  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);
  
  // Setup focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    // Setup focus trap that handles Tab key navigation
    const cleanupFocusTrap = setupFocusTrap(modalRef, isOpen, handleClose);
    
    // Additional Escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cleanupFocusTrap();
      
      // Return focus to previous element when closed
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  if (!isOpen) return null;

  // Background click handler to close the modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if the actual background is clicked (not content)
    if (e.target === modalRef.current) {
      handleClose();
    }
  };

  return (
    <div 
      ref={modalRef}
      tabIndex={-1}
      className={`fullscreen-modal ${isClosing ? 'closing' : ''}`}
      onClick={handleBackgroundClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '20px',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px 10px 40px',
        borderBottom: '1px solid #eaeaea',
        marginBottom: '20px',
      }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button 
          onClick={handleClose}
          aria-label="Close modal"
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          <span style={{ fontSize: '18px' }}>×</span> Close
        </button>
      </div>
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '0 40px 40px 40px',
      }}>
        {children}
      </div>
      
      <style>
        {`
          @keyframes fullscreenModalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fullscreenModalFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          .fullscreen-modal {
            animation: fullscreenModalFadeIn 0.2s ease-out;
          }
          .fullscreen-modal.closing {
            animation: fullscreenModalFadeOut 0.2s ease-in;
          }
        `}
      </style>
    </div>
  );
};

export default FullScreenModal;
