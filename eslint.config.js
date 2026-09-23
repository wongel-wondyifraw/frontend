import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'dist/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-key': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@next/next/no-img-element': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);

export default eslintConfig;
