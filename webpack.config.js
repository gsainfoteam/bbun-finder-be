const nodeExternals = require('webpack-node-externals');
const path = require('node:path');

module.exports = function (options) {
  return {
    ...options,
    entry: {
      main: path.resolve(__dirname, 'src/main.ts'),
      instrumentation: path.resolve(__dirname, 'src/instrumentation.mts'),
    },
    externals: [
      nodeExternals({
        allowlist: [/^file-type/],
      }),
    ],
    resolve: {
      ...options.resolve,
      // 중요: .js 확장자로 호출하더라도 .ts 파일을 먼저 찾도록 매핑
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
    },
    output: {
      ...options.output,
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
  };
};
