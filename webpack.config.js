const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  console.log(`Building client bundle in ${argv.mode} mode:`);
  const isDev = argv.mode ? argv.mode === 'development' || argv.mode === 'dev' : true;

  return {
    entry: './src/client/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist/client'),
      filename: 'bundle.js',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: isDev ? {
        'knbn': path.resolve(__dirname, './node_modules/knbn')
      } : {},
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'styles.css',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'vendor/*.js',
            to: '[name][ext]',
          },
        ],
      }),
    ],
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  };
};