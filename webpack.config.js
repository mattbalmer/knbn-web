const path = require('path');

module.exports = (env, argv) => {
  console.log(`Building client bundle in ${argv.mode} mode:`);
  const isDev = argv.mode ? argv.mode === 'development' || argv.mode === 'dev' : true;

  return {
    entry: './src/server/client/index.tsx',
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
      ],
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
  };
};