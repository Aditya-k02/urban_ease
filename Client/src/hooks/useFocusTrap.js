import { useEffect } from 'react';

/**
 * Custom hook to trap focus within a modal/dialog element
 * Ensures keyboard navigation stays within the modal for accessibility
 * 
 * @param {React.RefObject} ref - Reference to the modal container element
 * @param {boolean} isActive - Whether the focus trap should be active
 */
export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const modalElement = ref.current;
    
    // Get all focusable elements within the modal
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      
      return Array.from(modalElement.querySelectorAll(focusableSelectors));
    };

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab: focus last element if currently on first
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab: focus first element if currently on last
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Store the element that had focus before modal opened
    const previouslyFocusedElement = document.activeElement;

    // Add event listener
    modalElement.addEventListener('keydown', handleTabKey);

    // Cleanup
    return () => {
      modalElement.removeEventListener('keydown', handleTabKey);
      
      // Restore focus to previously focused element when modal closes
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    };
  }, [ref, isActive]);
}
