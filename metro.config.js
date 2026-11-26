const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes('csv')) {
  config.resolver.sourceExts.push('csv');
}

config.transformer.babelTransformerPath = require.resolve('./metro.csv-transformer.js');

// 開発用の模擬位置は開発バンドルだけに載せる。本番の解決先は空実装。
const devTogglePath = path.resolve(__dirname, 'src/features/map/DevLocationToggle.tsx');
const devToggleProductionPath = path.resolve(
  __dirname,
  'src/features/map/DevLocationToggle.production.tsx',
);
const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = previousResolveRequest ?? context.resolveRequest;
  const resolution = resolve(context, moduleName, platform);
  if (
    !context.dev &&
    resolution.type === 'sourceFile' &&
    path.resolve(resolution.filePath) === devTogglePath
  ) {
    return { type: 'sourceFile', filePath: devToggleProductionPath };
  }
  return resolution;
};

module.exports = config;
