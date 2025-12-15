module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/lib': './src/lib',
            '@/types': './src/types',
            '@/constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
