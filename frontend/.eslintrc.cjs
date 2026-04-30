module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Gradually improving type safety - warnings help track progress
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    // Hook dependencies - warn to catch missing dependencies
    'react-hooks/exhaustive-deps': 'warn',
    // Fast-refresh: allow constant exports in component files
    'react-refresh/only-export-components': ['warn', { 
      allowConstantExport: true 
    }],
  },
}

