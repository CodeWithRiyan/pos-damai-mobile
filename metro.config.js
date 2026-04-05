// Cache-busting comment: 2026-01-14T03:55:00Z
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql', 'mjs', 'mts');
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'import', 'react-native'];
config.transformer.babelTransformerPath = require.resolve('./transformer.js');

module.exports = withNativeWind(config, { input: './global.css' });
