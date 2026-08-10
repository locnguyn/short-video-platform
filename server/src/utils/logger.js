/**
 * Logger tối giản, không thêm dependency.
 *
 * Lý do có file này: trước đây code rải `console.log` khắp service, gồm cả log
 * debug lẫn dữ liệu người dùng (id, nội dung tin nhắn). Ở production, log kiểu
 * đó vừa gây nhiễu vừa có nguy cơ ghi ra thông tin cá nhân.
 *
 * Mức log điều khiển qua biến môi trường LOG_LEVEL: error < warn < info < debug.
 * Mặc định `info`, và ở NODE_ENV=production thì `debug` bị tắt hoàn toàn.
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const configured = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const threshold = LEVELS[configured] ?? LEVELS.info;
const isProd = process.env.NODE_ENV === 'production';

function emit(level, args) {
  if (LEVELS[level] > threshold) return;
  if (level === 'debug' && isProd) return;
  const line = `${new Date().toISOString()} ${level.toUpperCase()}`;
  // error và warn ra stderr để tách khỏi log thường khi thu gom log
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;
  sink(line, ...args);
}

export const logger = {
  error: (...args) => emit('error', args),
  warn: (...args) => emit('warn', args),
  info: (...args) => emit('info', args),
  debug: (...args) => emit('debug', args),
};

export default logger;
