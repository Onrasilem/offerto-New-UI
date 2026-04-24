const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backend folder from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
  /docs\/.*/,
];

// Only watch src folder for changes (not backend)
config.watchFolders = [__dirname];

module.exports = config;
