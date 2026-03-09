const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
