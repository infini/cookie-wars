const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAnimatedWebp(config) {
  return withGradleProperties(config, (gradleConfig) => {
    const property = gradleConfig.modResults.find(
      (item) => item.type === 'property' && item.key === 'expo.webp.animated',
    );
    if (property) property.value = 'true';
    else {
      gradleConfig.modResults.push({
        type: 'property',
        key: 'expo.webp.animated',
        value: 'true',
      });
    }
    return gradleConfig;
  });
};
