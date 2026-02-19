let tsParser;
let tsPlugin;

try {
  tsParser = require('@typescript-eslint/parser');
  tsPlugin = require('@typescript-eslint/eslint-plugin');
} catch {
  tsParser = null;
  tsPlugin = null;
}

const baseConfig = {
  ignores: ['node_modules/**', 'dist/**', '.expo/**', 'coverage/**'],
};

if (!tsParser || !tsPlugin) {
  module.exports = [
    {
      ...baseConfig,
      ignores: [...baseConfig.ignores, '**/*.ts', '**/*.tsx'],
    },
  ];
} else {
  module.exports = [
    baseConfig,
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    },
  ];
}
