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
