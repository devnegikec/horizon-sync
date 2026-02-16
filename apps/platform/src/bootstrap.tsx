import { StrictMode } from 'react';

import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';
import { ErrorBoundary } from './app/components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
