import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from '../../app/app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
        <App />
      </BrowserRouter>,
    );
    expect(baseElement).toBeTruthy();
  });
});
