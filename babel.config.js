module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // expo-router/babel foi removido - babel-preset-expo já inclui suporte ao expo-router
  };
};

