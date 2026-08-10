import jwt from 'jsonwebtoken';

/**
 * Tiện ích JWT phía server.
 *
 * File này từng chứa cả `getToken`/`removeToken` đọc `localStorage` — API của
 * trình duyệt, không tồn tại trong Node, nên gọi tới là crash. Chúng thuộc về
 * frontend (`short-video-frontend/src/utils/tokenUtils.js`) và đã được bỏ khỏi
 * đây. Cùng với đó là `decodeToken` chỉ có thân hàm rỗng.
 */

export const createToken = (user) =>
  jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token đã hết hạn' };
    }
    return { valid: false, error: 'Token không hợp lệ' };
  }
};
