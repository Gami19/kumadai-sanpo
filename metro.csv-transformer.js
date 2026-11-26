const { createRequire } = require('node:module');

const requireFromExpo = createRequire(require.resolve('expo/metro-config'));
const upstream = requireFromExpo('@expo/metro-config/babel-transformer');

function transform(args) {
  if (args.filename.endsWith('.csv')) {
    return upstream.transform({
      ...args,
      src: `export default ${JSON.stringify(args.src)};\n`,
    });
  }
  return upstream.transform(args);
}

module.exports = {
  transform,
  getCacheKey: upstream.getCacheKey,
};
