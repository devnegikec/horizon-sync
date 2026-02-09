import { withModuleFederation } from '@nx/module-federation/webpack.js';
import { withReact } from '@nx/react';
import { composePlugins, withNx } from '@nx/webpack';
import * as webpack from 'webpack';

import baseConfig from './module-federation.config';

const config = {
  ...baseConfig,
};

export default composePlugins(withNx(), withReact(), withModuleFederation(config, { dts: false }), (config) => {
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NX_API_CORE_URL': JSON.stringify(process.env.NX_API_CORE_URL),
    }),
  );
  return config;
});
