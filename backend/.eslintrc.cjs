module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'shared/',
    '*.js',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-console': 'off',
    'no-empty': 'off',
    'prefer-const': 'warn',
  },
};
