// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Les écrans synchronisent des données fetchées vers un état local
      // (sélection par défaut après chargement, etc.). Migration vers un état
      // dérivé à faire écran par écran ; en attendant, on avertit sans bloquer.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
