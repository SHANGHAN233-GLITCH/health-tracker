const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 确保图标字体文件能够正确处理
config.resolver.assetExts.push('ttf', 'otf');

// 优化Web平台的资源处理
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;