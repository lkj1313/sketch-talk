import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

function restrictLayerImports(layers) {
  return [
    'error',
    {
      patterns: layers.map((layer) => ({
        group: [`@/${layer}`, `@/${layer}/**`],
        message: `FSD 계층 규칙상 ${layer} 레이어를 가져올 수 없습니다.`,
      })),
    },
  ]
}

export default defineConfig([
  globalIgnores(['dist', 'storybook-static']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/shared/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictLayerImports([
        'entities',
        'features',
        'widgets',
        'pages',
        'app',
      ]),
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictLayerImports([
        'features',
        'widgets',
        'pages',
        'app',
      ]),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictLayerImports([
        'widgets',
        'pages',
        'app',
      ]),
    },
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictLayerImports(['pages', 'app']),
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictLayerImports(['app']),
    },
  },
])
