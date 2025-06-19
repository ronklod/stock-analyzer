import { RefObject } from 'react';

// Array of focusable element selectors
const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export function setupFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  onEscape?: () => void
): () => void {
  if (!isActive || !containerRef.current) {
    return () => {};
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle ESC key to close modal
    if (e.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

    // Only handle Tab key
    if (e.key !== 'Tab') {
      return;
    }

    if (!containerRef.current) return;

    // Get all focusable elements in the modal
    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS.join(','))
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift + tab and first element is focused, move to last focusable element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If tab and last element is focused, cycle to first focusable element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Focus first focusable element when modal opens
  setTimeout(() => {
    if (containerRef.current) {
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS.join(','))
      ) as HTMLElement[];
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        containerRef.current.focus();
      }
    }
  }, 100);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
