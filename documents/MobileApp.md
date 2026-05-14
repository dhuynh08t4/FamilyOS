# FamilyOS Mobile App (Android)

FamilyOS sử dụng **Capacitor** để đóng gói và chạy ứng dụng trên nền tảng Android, song song với phiên bản Web (PWA) hiện có. Cả hai phiên bản chia sẻ chung 100% mã nguồn (Vite + React + TypeScript).

## 1. Kiến trúc chạy song song (Chung Source Code)

- **Web / PWA Version**: Chạy trực tiếp trên trình duyệt hoặc cài đặt dưới dạng PWA. Hoạt động tối ưu trên mọi thiết bị di động và máy tính.
- **Android App Version**: Chạy dưới dạng ứng dụng native (APK/AAB) thông qua WebView của Capacitor. Các thành phần giao diện, logic xử lý, Supabase, và AI (Gemini) hoàn toàn nhất quán với phiên bản Web.

## 2. Các lệnh quản lý (Scripts)

Trong `package.json` đã được tích hợp sẵn các lệnh hỗ trợ phát triển và đồng bộ ứng dụng di động:

- `npm run cap:sync`: Đồng bộ các thay đổi mới nhất từ thư mục `dist` vào mã nguồn native Android.
- `npm run cap:open`: Mở dự án Android bằng Android Studio để kiểm tra hoặc xuất file APK.
- `npm run cap:build`: Tự động biên dịch phiên bản Web (`npm run build`) và đồng bộ ngay lập tức vào Android (`npx cap sync`).

## 3. Quy trình phát triển và triển khai

1. **Phát triển tính năng**: Lập trình và kiểm thử giao diện trên phiên bản Web/Dev Server (`npm run dev`) như thông thường.
2. **Cập nhật Mobile App**: Khi hoàn thiện tính năng, chạy lệnh `npm run cap:build` để bản dựng mới nhất được cập nhật vào mã nguồn Android.
3. **Build APK/Triển khai**: Sử dụng `npm run cap:open` để mở Android Studio và xuất file cài đặt APK phân phối cho các thành viên trong gia đình.

## 4. Các phương án thay thế khi không cài Android Studio

Nếu máy tính của bạn không cài đặt Android Studio, bạn có thể áp dụng các phương án thay thế tiện lợi sau:

### Phương án 1: Sử dụng GitHub Actions (Khuyên dùng - Hoàn toàn tự động trên Cloud)
Vì mã nguồn đã được lưu trên GitHub, bạn có thể thiết lập một workflow GitHub Actions. Máy chủ của GitHub (đã cài sẵn Android SDK và Gradle) sẽ tự động biên dịch và tạo ra file `.apk` mỗi khi bạn đẩy code lên:
- **Ưu điểm**: Không tốn tài nguyên máy cá nhân, tải trực tiếp file APK từ GitHub về điện thoại.

### Phương án 2: Biên dịch qua Terminal (Command Line bằng Gradle)
Nếu trên máy macOS của bạn đã cài đặt Java (JDK 17+) và Android SDK Command-line Tools:
```bash
# 1. Đồng bộ mã nguồn web mới nhất vào dự án Android
npm run cap:build

# 2. Di chuyển vào thư mục Android và chạy Gradle để xuất APK Debug
cd android
./gradlew assembleDebug
```
File APK sẽ xuất hiện tại: `android/app/build/outputs/apk/debug/app-debug.apk`.

### Phương án 3: Dịch vụ Cloud Build trực tuyến (Ionic Appflow / Codemagic)
Sử dụng các dịch vụ chuyên dụng cho Capacitor như **Ionic Appflow**, **Codemagic** hoặc **Bitrise**. Các dịch vụ này kết nối với kho lưu trữ GitHub và cung cấp giao diện trực quan để tự động đóng gói ứng dụng di động chỉ bằng 1 nút bấm.

### Phương án 4: Cài đặt dưới dạng PWA (Không cần file APK)
Phiên bản Web của FamilyOS đã được tối ưu cho di động. Người dùng Android chỉ cần mở trang web bằng trình duyệt Chrome và chọn **"Add to Home Screen" (Thêm vào màn hình chính)**. Ứng dụng sẽ xuất hiện trên màn hình chính và hoạt động mượt mà như một ứng dụng độc lập.

