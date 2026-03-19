const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

// Force CJS builds for packages that use import.meta in their ESM builds,
// which Hermes does not support.
const ESM_CJS_OVERRIDES = {
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  // Expo/Metro can crash when it loads the ESM entry of `tslib` (via `tslib/modules/index.js`)
  // due to incorrect default export interop in the bundler runtime.
  // For `tslib`, the CJS build provides the same helper exports (__extends, etc).
  'tslib': path.resolve(__dirname, 'node_modules/tslib/tslib.js'),
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
