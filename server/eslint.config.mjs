import js from '@eslint/js';
import globals from 'globals';

/**
 * ESLint cho phần server.
 *
 * Quy tắc quan trọng nhất ở đây là `no-undef`: chính nó phát hiện ra 15 chỗ viết
 * `throw new Error(tokenError)` trong khi biến đó không tồn tại trong scope —
 * bug khiến token hết hạn trả về ReferenceError thay vì thông báo rõ ràng.
 * Trước đây repo không có config nên không có gì chặn loại lỗi này.
 */
export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Bắt biến chưa khai báo — lý do chính có file này
      'no-undef': 'error',
      // Cho phép bỏ qua tham số không dùng của GraphQL resolver: (_, __, context)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Bắt buộc dùng logger thay vì console rải rác
      'no-console': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-return-await': 'error',
    },
  },
  {
    // logger là nơi duy nhất được phép gọi console
    files: ['src/utils/logger.js'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
