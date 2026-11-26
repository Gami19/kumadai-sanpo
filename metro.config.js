const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes('csv')) {
  config.resolver.sourceExts.push('csv');
}

config.transformer.babelTransformerPath = require.resolve('./metro.csv-transformer.js');

module.exports = config;
