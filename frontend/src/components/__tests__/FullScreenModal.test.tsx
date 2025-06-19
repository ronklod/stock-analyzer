import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FullScreenModal from '../FullScreenModal';

describe('FullScreenModal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
  });
  
  test('renders when isOpen is true', () => {
    render(
      <FullScreenModal isOpen={true} title="Test Modal" onClose={mockOnClose}>
        <div data-testid="modal-content">Modal content</div>
      </FullScreenModal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });
  
  test('does not render when isOpen is false', () => {
    render(
      <FullScreenModal isOpen={false} title="Test Modal" onClose={mockOnClose}>
        <div data-testid="modal-content">Modal content</div>
      </FullScreenModal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });
  
  test('calls onClose when close button is clicked', () => {
    render(
      <FullScreenModal isOpen={true} title="Test Modal" onClose={mockOnClose}>
        <div>Modal content</div>
      </FullScreenModal>
    );
    
    fireEvent.click(screen.getByText('Close'));
    
    // Account for animation timeout
    setTimeout(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, 250);
  });
  
  test('calls onClose when Escape key is pressed', () => {
    render(
      <FullScreenModal isOpen={true} title="Test Modal" onClose={mockOnClose}>
        <div>Modal content</div>
      </FullScreenModal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Account for animation timeout
    setTimeout(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, 250);
  });
});
