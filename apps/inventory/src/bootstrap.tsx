import { StrictMode } from 'react';

import * as ReactDOM from 'react-dom/client';

import App from './app/app';
import { installNgrokHeaders } from './ngrok-headers';

// Inject ngrok-skip-browser-warning header on every outgoing request
// so ngrok doesn't return its interstitial HTML page instead of JSON.
installNgrokHeaders();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
