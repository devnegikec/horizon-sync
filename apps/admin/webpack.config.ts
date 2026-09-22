import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { withReact } from '@nx/react';
import { composePlugins, withNx } from '@nx/webpack';

dotenvConfig({ path: resolve(__dirname, '../../.env') });

export default composePlugins(withNx(), withReact(), (config) => {
  const webpack = require('webpack');
  config.output = { ...config.output, publicPath: 'auto' };
  config.devServer = {
    ...config.devServer,
    hot: true,
    historyApiFallback: true,
    port: 4300,
    headers: { 'Access-Control-Allow-Origin': '*' },
  };
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NX_API_BASE_URL': JSON.stringify(process.env.NX_API_BASE_URL),
      'process.env.NX_API_CORE_URL': JSON.stringify(process.env.NX_API_CORE_URL),
      'process.env.NX_API_IDENTITY_URL': JSON.stringify(process.env.NX_API_IDENTITY_URL),
    }),
  );
  return config;
});
