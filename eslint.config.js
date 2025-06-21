import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      playwright: playwright,
      sonarjs: sonarjs,
    },
    rules: {
      // Basic ESLint rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Disabled in favor of the TypeScript version

      // TypeScript ESLint rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // SonarJS rules for code duplication and complexity
      ...sonarjs.configs.recommended.rules,
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-functions': 'error',

      // Playwright-specific rules
      ...playwright.configs.recommended.rules,
      'playwright/no-force-option': 'warn',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
  
  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  
  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'playwright-report/', 'test-results/'],
  },
]; 