# Cấu hình Model AI Gemini (Gemini AI Model Configuration)

## 1. Giới thiệu
Tài liệu mô tả cấu hình model Gemini AI mới nhất và cơ chế fallback xoay vòng model / key trong FamilyOS.

## 2. Model Gemini mới nhất
Hệ thống sử dụng model Gemini mới nhất của Google làm model mặc định cho toàn bộ các chức năng AI (Trợ lý AI FinAssistant, Quét hóa đơn AI Scanner, Chat gia đình):
- **Model mặc định ưu tiên 1**: `gemini-3.8-flash`
  - Tối ưu hóa tốc độ cao, khả năng reasoning sâu và xử lý đa phương thức (multimodal).
  - Hỗ trợ context window lớn và độ chính xác cao khi trích xuất dữ liệu JSON giao dịch/kế hoạch.

## 3. Danh sách Model & Thứ tự Fallback
Hệ thống duy trì danh sách `GEMINI_MODELS` trong `src/lib/gemini.ts`:
1. `gemini-3.8-flash` (Mặc định mới nhất)
2. `gemini-3.5-flash-lite`
3. `gemini-3-flash-preview`
4. `gemini-3-pro-preview`
5. `gemini-flash-latest`
6. `gemini-flash-lite-latest`

## 4. Cơ chế chịu lỗi (Smart Model & Key Rotation)
Khi thực hiện yêu cầu AI thông qua hàm `generateSmartContent()`:
1. **Model Rotation**: Thử `selectedModel` (`gemini-3.8-flash`) đầu tiên. Nếu gặp lỗi quota/endpoint/quá tải, hệ thống tự động thử tiếp các model dự phòng trong `GEMINI_MODELS`.
2. **Key Shuffling**: Với mỗi model, hệ thống xáo trộn ngẫu nhiên danh sách API Key được cấu hình trong `user_settings` / `app_settings` (`GEMINI_API_KEY`) để chia tải.
3. **Payload Sanitization**: Chỉ đính kèm đối tượng `inlineData` khi có dữ liệu base64 hợp lệ, tránh lỗi schema validation từ các API endpoint mới của Gemini.
