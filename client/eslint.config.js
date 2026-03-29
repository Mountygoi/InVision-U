import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // --- ВОТ ТУТ МЫ ГАСИМ ВСЕ ОШИБКИ ---
      '@typescript-eslint/no-explicit-any': 'off', // Разрешаем any
      '@typescript-eslint/no-unused-vars': 'off', // Разрешаем неиспользуемые переменные
      '@typescript-eslint/ban-ts-comment': 'off', // Разрешаем @ts-ignore
      'no-unused-vars': 'off', // Дублирующее правило для JS
      'prefer-const': 'off', // Не приставать с заменой let на const
      '@typescript-eslint/no-empty-object-type': 'off', // Разрешаем пустые {} в типах
    },
  },
)