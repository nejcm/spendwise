const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

// Force CJS builds for packages that use import.meta in their ESM builds,
// which Hermes does not support.
const ESM_CJS_OVERRIDES = {
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (Object.hasOwn(ESM_CJS_OVERRIDES, moduleName)) {
    return { filePath: ESM_CJS_OVERRIDES[moduleName], type: 'sourceFile' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
