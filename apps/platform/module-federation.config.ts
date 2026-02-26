import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'platform',
  /**
   * To use a remote that does not exist in your current Nx Workspace
   * You can use the tuple-syntax to define your remote
   *
   * remotes: [['my-external-remote', 'https://nx-angular-remote.netlify.app']]
   *
   * You _may_ need to add a `remotes.d.ts` file to your `src/` folder declaring the external remote for tsc, with the
   * following content:
   *
   * declare module 'my-external-remote';
   *
   */
  remotes: ['inventory'],
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
