import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'inventory',
  exposes: {
    './Module': './src/remote-entry.ts',
    './RevenuePage': './src/app/pages/RevenuePage.tsx',
    './SourcingPage': './src/app/pages/SourcingPage.tsx',
    './BooksPage': './src/app/pages/BooksPage.tsx',
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
