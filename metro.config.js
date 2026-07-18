const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Kenney의 원본 CC0 사운드는 Android가 기본 지원하는 Ogg Vorbis 형식이다.
config.resolver.assetExts.push('ogg');

module.exports = config;
