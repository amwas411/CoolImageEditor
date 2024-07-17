import rec from './node_modules/@eslint/js/src/configs/eslint-recommended.js';
import globals from 'globals';

export default {
  rules: {
    ...rec.rules,
    'no-unused-vars': 'warn'
  },
  ignores: ['eslint.config.js'],
  languageOptions: {
    globals: {
      ...globals.browser

    }
  }
};