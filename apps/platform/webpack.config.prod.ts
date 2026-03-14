import { execSync } from 'child_process';
import { resolve } from 'path';

import { ModuleFederationConfig } from '@nx/module-federation';
import { withModuleFederation } from '@nx/module-federation/webpack.js';
import { withReact } from '@nx/react';
import { composePlugins, withNx } from '@nx/webpack';
import { config as dotenvConfig } from 'dotenv';

import baseConfig from './module-federation.config';

// Load .env from workspace root
dotenvConfig({ path: resolve(__dirname, '../../.env') });

// Generate build identifiers for deployment verification
const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
})();
const buildTimestamp = new Date().toISOString();
const buildId = `${gitHash}-${Date.now()}`;

const prodConfig: ModuleFederationConfig = {
  ...baseConfig,
  /*
   * Remote overrides for production.
   * Each entry is a pair of a unique name and the URL where it is deployed.
   *
   * In production, the inventory remote is served from /inventory/ on the same domain
   * via nginx. We use a relative URL so it works on any domain.
   */
  remotes: [
    ['inventory', '/inventory/remoteEntry.js'],
  ],
};

// Nx plugins for webpack to build config object from Nx options and context.
/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(prodConfig, { dts: false }),
  (config) => {
    // Inject environment variables using DefinePlugin
    const webpack = require('webpack');

    config.output = {
      ...config.output,
      publicPath: 'auto',
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@module-federation/,
        message: /Failed to parse source map/,
      },
    ];

    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NX_API_BASE_URL': JSON.stringify(process.env.NX_API_BASE_URL),
        'process.env.NX_API_CORE_URL': JSON.stringify(process.env.NX_API_CORE_URL),
        'process.env.NX_SEARCH_API_BASE_URL': JSON.stringify(process.env.NX_SEARCH_API_BASE_URL),
        'process.env.NX_NODE_ENV': JSON.stringify(process.env.NX_NODE_ENV),
        'process.env.NX_BUILD_ID': JSON.stringify(buildId),
        'process.env.NX_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
        'process.env.NX_GIT_HASH': JSON.stringify(gitHash),
      })
    );
    return config;
  }
);
