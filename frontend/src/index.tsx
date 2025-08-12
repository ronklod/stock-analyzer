import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './MobileResponsive.css'; // Import the mobile responsive styles
import './components/utils/responsive.css'; // Import additional responsive utilities
import { default as App } from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);