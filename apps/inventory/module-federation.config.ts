import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'inventory',
  exposes: {
    './Module': './src/remote-entry.ts',
    './RevenuePage': './src/app/pages/RevenuePage.tsx',
    './SourcingPage': './src/app/pages/SourcingPage.tsx',
    './BooksPage': './src/app/pages/BooksPage.tsx',
  },
  shared: (libraryName, defaultConfig) => {
    // Share React and React-DOM as singletons
    if (libraryName === 'react' || libraryName === 'react-dom') {
      return {
        ...defaultConfig,
        singleton: true,
        requiredVersion: defaultConfig.requiredVersion,
        strictVersion: false,
      };
    }

    // Share Zustand store as singleton
    if (libraryName === 'zustand') {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: false,
      };
    }

    // Share all @horizon-sync packages as singletons
    if (libraryName.startsWith('@horizon-sync/')) {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: false,
      };
    }

    // Share React Query if used
    if (libraryName === '@tanstack/react-query') {
      return {
        ...defaultConfig,
        singleton: true,
        strictVersion: false,
      };
    }

    return defaultConfig;
  },
};

/**
 * Nx requires a default export of the config to allow correct resolution of the module federation graph.
 **/
export default config;
