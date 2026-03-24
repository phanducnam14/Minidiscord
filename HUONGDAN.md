# HƯỚNG DẪN VẬN HÀNH MIGHTY HỆ THỐNG MINIDISCORD (MẠNG NỘI BỘ & NGROK)

Tài liệu này hướng dẫn cách chạy, test và các lưu ý quan trọng để 2 máy (Máy A và Máy B) có thể kết nối, chat và gọi video với nhau.

---

## 🚀 1. Các thành phần cần khởi chạy (Tại Máy A - Máy chủ)

Để hệ thống hoạt động, bạn cần mở **3 cửa sổ Terminal** và chạy các lệnh sau:

1.  **Backend (Spring Boot):**
    ```powershell
    .\mvnw.cmd spring-boot:run
    ```
    *Chờ đến khi thấy dòng chữ: `? MiniDiscord đang chạy!`*

2.  **Frontend (Vite):**
    ```powershell
    cd frontend
    npm run dev -- --host
    ```

3.  **Ngrok (Tạo đường truyền HTTPS):**
    ```powershell
    ngrok http --domain=demonological-myrtle-matless.ngrok-free.dev 3000
    ```

---

## 🔗 2. Cách truy cập và Test

### Bước 1: Máy A đăng nhập
- Truy cập: `https://demonological-myrtle-matless.ngrok-free.dev`
- Đăng nhập bằng Google.
- Chọn một Server, tạo **Link mời (Invite Link)**.

### Bước 2: Máy B tham gia
- Gửi link mời (VD: `https://...ngrok.dev/invite/abcxyz`) sang Máy B.
- Máy B mở link trong trình duyệt (Chrome/Edge được khuyên dùng).
- Nhấn **Tham gia**. Máy B sẽ được yêu cầu đăng nhập Google (nếu chưa).
- Sau khi xong, Máy B sẽ xuất hiện trong Server cùng Máy A.

### Bước 3: Test Chat & Video
- **Chat:** Nhắn tin ở Máy A, Máy B sẽ thấy ngay lập tức.
- **Voice/Video:** 
  - Cả 2 máy cùng vào một **Kênh thoại (Voice Channel)**.
  - Nhấn biểu tượng Camera để bật Video hoặc biểu tượng Màn hình để Share screen.
  - Khi có người vào/ra, hệ thống sẽ hiện thông báo ở góc trên bên phải.

---

## ⚠️ 3. Những lưu ý cực kỳ quan trọng

1.  **Quyền truy cập Micro/Camera:**
    - Trình duyệt sẽ hỏi quyền, hãy chọn **Allow (Cho phép)**.
    - Nếu lỡ chặn, hãy nhấn vào biểu tượng ổ khóa 🔒 đầu thanh địa chỉ để bật lại.

2.  **HTTPS là bắt buộc:**
    - Các tính năng như Micro, Camera, Share Screen và Đăng nhập Google **chỉ chạy được trên HTTPS**. 
    - Luôn sử dụng link `https://...ngrok-free.dev` để test giữa 2 máy.

3.  **Lỗi "Redirect URI Mismatch" (Nếu đổi domain ngrok):**
    - Nếu bạn tắt ngrok và bật lại mà bị đổi tên miền, bạn **phải cập nhật lại** tên miền mới trong **Google Cloud Console** (mục Authorized redirect URIs).
    - Cập nhật lại `app.frontend-url` trong file `application.properties`.

4.  **Kiểm tra lỗi (F12):**
    - Nếu không thấy hình ảnh, hãy nhấn phím **F12**, chọn tab **Console**.
    - Tìm các dòng bắt đầu bằng `[WebRTC]` để biết trạng thái kết nối.

---

## 🛠 4. Các lỗi thường gặp và cách xử lý

- **Bị văng ra trang Login:** Do session bị hết hạn hoặc domain ngrok bị thay đổi. Hãy xóa Cookies và đăng nhập lại từ link gốc.
- **Không share được màn hình:** Đảm bảo bạn đang dùng trình duyệt hiện đại (Chrome/Edge/Firefox) và đã cấp quyền share.
- **Máy B không thấy máy A:** Kiểm tra xem cả 2 máy có đang dùng chung một đường truyền ngrok không.

---
*Chúc bạn có trải nghiệm tuyệt vời với MiniDiscord!*
