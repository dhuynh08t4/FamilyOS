# Thống kê Dự chi Ngân sách (Budget Planning Statistics)

## 1. Giới thiệu
Tài liệu mô tả logic tính toán và hiển thị thống kê tổng quan trên màn hình "Dự chi Ngân sách" (`/budget`) của hệ thống FamilyOS.

## 2. Vị trí hiển thị
Thống kê tổng quan được đặt ở đầu trang `BudgetPlanning.tsx`, ngay phía trên danh sách các khoản dự chi đang chạy. Giao diện responsive 3 cột trên Desktop và các thẻ trực quan trên Mobile kèm thanh tiến độ tổng thể.

## 3. Các chỉ số thống kê & Logic tính toán

### 3.1. Tổng dự kiến (Total Planned)
- **Định nghĩa**: Tổng số tiền đã lên kế hoạch dự chi cho tất cả các khoản mục đang hoạt động (`status === 'active'`).
- **Công thức**:
  $$\text{totalPlanned} = \sum_{p \in \text{activePlans}} p.\text{planned\_amount}$$
- **Hiển thị**: Định dạng tiền tệ VND (`.toLocaleString('vi-VN') + ' đ'`). Kèm theo số lượng khoản mục đang chạy.

### 3.2. Tổng đã chi (Total Spent)
- **Định nghĩa**: Tổng số tiền thực tế đã chi tiêu từ các giao dịch gắn liên kết với các khoản dự chi đang chạy.
- **Công thức**:
  $$\text{totalSpent} = \sum_{p \in \text{activePlans}} \left( \sum_{t \in \text{transactions}, t.\text{budget\_plan\_id} = p.\text{id}} t.\text{amount} \right)$$
- **Hiển thị**: Định dạng tiền tệ VND, kèm tỷ lệ phần trăm so với tổng dự kiến:
  $$\text{spentPercent} = \frac{\text{totalSpent}}{\text{totalPlanned}} \times 100$$

### 3.3. Tổng chưa chi theo kế hoạch (Total Unspent / Remaining)
- **Định nghĩa**: Số tiền còn lại chưa chi tiêu dựa theo hạn mức kế hoạch đã lập.
- **Công thức**:
  $$\text{totalUnspent} = \max(0, \text{totalPlanned} - \text{totalSpent})$$
- **Quy tắc hiển thị**:
  - Khi $\text{totalPlanned} \ge \text{totalSpent}$: Hiển thị màu xanh lá (`emerald`), kèm dòng thông tin `% còn lại theo kế hoạch`.
  - Khi $\text{totalPlanned} < \text{totalSpent}$ (chi vượt kế hoạch): Hiển thị `0 đ`, kèm cảnh báo màu đỏ (`rose`) ghi rõ số tiền đã vượt kế hoạch:
    $$\text{overspent} = \text{totalSpent} - \text{totalPlanned}$$

### 3.4. Tiến độ thực hiện kế hoạch (Progress Bar)
- Thanh tiến độ trực quan hiển thị tỷ lệ hoàn thành ngân sách ($\text{spentPercent}$).
- **Màu sắc trạng thái**:
  - Dưới 100%: Màu chủ đạo (`bg-primary`).
  - Đạt đúng 100%: Màu xanh thành công (`bg-emerald-500`).
  - Vượt quá 100%: Màu đỏ cảnh báo (`bg-rose-500`).

## 4. Tự động đồng bộ Realtime
- Dữ liệu thống kê tự động tính toán lại khi có bất kỳ thay đổi nào từ bảng `budget_plans` hoặc `transactions` thông qua Supabase Realtime channel và CustomEvent `family-os-refresh`.
