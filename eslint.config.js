import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier' // Prettier 설정 추가
import prettierPlugin from 'eslint-plugin-prettier' // Prettier 플러그인 추가

export default [
  { ignores: ['dist'] }, // 'dist' 디렉토리는 ESLint 검사를 무시
  {
    files: ['**/*.{js,jsx}'], // ESLint가 검사할 파일 확장자 설정
    languageOptions: {
      ecmaVersion: 2020, // ECMAScript 2020 지원
      globals: globals.browser, // 브라우저 전역 변수 허용
      parserOptions: {
        ecmaVersion: 'latest', // 최신 ECMAScript 버전 지원
        ecmaFeatures: { jsx: true }, // JSX 지원
        sourceType: 'module', // ECMAScript 모듈 사용
      },
    },
    settings: {
      react: { version: '18.3' }, // React 버전 감지
    },
    plugins: {
      react, // React ESLint 플러그인
      'react-hooks': reactHooks, // React Hooks 플러그인
      'react-refresh': reactRefresh, // React Fast Refresh 플러그인
      prettier: prettierPlugin, // Prettier 플러그인 추가
    },
    rules: {
      ...js.configs.recommended.rules, // ESLint 추천 규칙 적용
      ...react.configs.recommended.rules, // React 추천 규칙 적용
      ...react.configs['jsx-runtime'].rules, // JSX 런타임 관련 규칙
      ...reactHooks.configs.recommended.rules, // React Hooks 추천 규칙 적용
      'react/jsx-no-target-blank': 'off', // target="_blank" 보안 경고 비활성화
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'prettier/prettier': 'error', // Prettier 규칙을 위반하면 ESLint에서 에러로 처리
    },
  },
]
