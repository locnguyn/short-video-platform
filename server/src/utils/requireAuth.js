/**
 * Kiểm tra người gọi đã đăng nhập chưa, dùng chung cho mọi GraphQL resolver.
 *
 * Trước đây mỗi resolver tự lặp lại khối kiểm tra này, và 15 chỗ viết
 * `throw new Error(tokenError)` trong khi biến đó không tồn tại trong scope —
 * giá trị thật nằm ở `context.tokenError`. Hệ quả: token hết hạn hoặc không hợp
 * lệ thì client nhận `ReferenceError: tokenError is not defined` thay vì thông
 * báo rõ ràng.
 *
 * @param {{ user?: { id: string }, tokenError?: string }} context
 * @returns {{ id: string }} người dùng đã xác thực
 */
export function requireAuth(context) {
  // Token có nhưng không hợp lệ hoặc hết hạn: trả đúng lý do để client biết
  // cần đăng nhập lại thay vì thử lại vô ích.
  if (context?.tokenError) {
    throw new Error(context.tokenError);
  }
  if (!context?.user?.id) {
    throw new Error('Bạn cần đăng nhập để thực hiện hành động này');
  }
  return context.user;
}

/**
 * Dành cho resolver mà đăng nhập là tuỳ chọn — ví dụ xem video công khai, nhưng
 * nếu đã đăng nhập thì trả thêm trạng thái đã like hoặc đã lưu.
 *
 * Token không hợp lệ vẫn báo lỗi, vì đó là client gửi sai chứ không phải khách.
 *
 * @param {{ user?: { id: string }, tokenError?: string }} context
 * @returns {{ id: string } | null}
 */
export function optionalAuth(context) {
  if (context?.tokenError) {
    throw new Error(context.tokenError);
  }
  return context?.user?.id ? context.user : null;
}
