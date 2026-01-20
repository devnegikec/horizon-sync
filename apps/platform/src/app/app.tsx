import * as React from 'react';
import NxWelcome from './nx-welcome';
import { Link, Route, Routes } from 'react-router-dom';
import '@horizon-sync/ui/styles/globals.css';
import { Button } from '@horizon-sync/ui/components/ui/button';


const Inventory = React.lazy(() => import('inventory/Module'));

export function App() {
  return (
    <React.Suspense fallback={null}>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/inventory">Inventory</Link>
          <Button>Click me</Button>
        </li>
      </ul>
      <Routes>
        <Route path="/" element={<NxWelcome title="platform" />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;
