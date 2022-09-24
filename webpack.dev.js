/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const PROXY_TARGET = 'http://localhost:4040';
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'client'),
    port: 8080,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        secure: false,
      },
    },
  },
});
