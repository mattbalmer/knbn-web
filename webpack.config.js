const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  console.log(`Building client bundle in ${argv.mode} mode:`);
  const isDev = argv.mode ? argv.mode === 'development' || argv.mode === 'dev' : true;

  return {
    mode: isDev ? 'development' : 'production',
    devtool: 'inline-source-map',
    entry: './src/client/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist/client'),
      filename: 'bundle.js',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'vendor/*.js',
            to: '[name][ext]',
          },
          {
            from: 'src/client/*.css',
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