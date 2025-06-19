# FullScreen Modal Feature

The Stock Analyzer application now includes a fullscreen modal feature for all charts in the interface, enhancing the user experience when analyzing detailed charts.

## Features

- All charts can be expanded to fullscreen mode
- Accessible UI elements with keyboard navigation
- Smooth animations when opening/closing modals
- Focus management for better accessibility
- Keyboard support (Esc to close)

## Usage

Each chart in the application includes an "Expand" button in the top-right corner. Clicking this button will open the chart in a fullscreen modal that:

1. Shows only the selected chart with more screen real estate
2. Can be closed by:
   - Clicking the "Close" button in the top-right
   - Pressing the Esc key
   - Clicking on the background area around the chart

## Implementation

The feature is implemented through:

- A reusable `FullScreenModal` component (`frontend/src/components/FullScreenModal.tsx`)
- State management in chart components to track which chart is in fullscreen mode
- Focus trapping for accessibility (`frontend/src/utils/focusTrap.ts`)
- Animation effects for smooth transitions

## Accessibility

The modal implementation follows accessibility best practices:

- Focus trap for keyboard navigation
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus restoration when the modal is closed
- High contrast styling for better visibility
