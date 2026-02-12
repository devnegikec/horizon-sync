import { ModuleFederationConfig } from '@nx/module-federation';
import { withModuleFederation } from '@nx/module-federation/webpack.js';
import { withReact } from '@nx/react';
import { composePlugins, withNx } from '@nx/webpack';

import baseConfig from './module-federation.config';

const config: ModuleFederationConfig = {
  ...baseConfig,
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
  withModuleFederation(config, { dts: false }),
  (config) => {
    // Inject environment variables using DefinePlugin
    const webpack = require('webpack');
    config.output = {
      ...config.output,
      publicPath: 'auto',
    };

    config.devServer = {
      ...config.devServer,
      hot: true,
      historyApiFallback: true,
      watchFiles: ['apps/platform/src/**/*'],
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };

    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NX_API_BASE_URL': JSON.stringify(
          process.env.NX_API_BASE_URL
        ),
      })
    );
    return config;
  }
);
