# Z-Enterprise Management Platform — Prototype v7.0 (Clean Minimalism)

> **Hệ thống Quản trị Tập trung Quota Zalo Enterprise & Vòng Đời Tài Khoản Nhân Viên**  
> Tuân thủ 100% các quyết định nghiệp vụ và thiết kế UI/UX đã thống nhất qua Clarification Harness (`D-013` đến `D-020`):
> - **1 Zalo Enterprise Account = 1 Quota**.
> - **Tổng Quota = Đang sử dụng + Chưa sử dụng**.
> - **Đang sử dụng = Đang hoạt động + Tạm khóa** *(Bao gồm tài khoản Đang hoạt động và Tạm dừng dịch vụ)*.
> - **Đã loại bỏ hoàn toàn 'Chờ kích hoạt' (Pending Activation)**: Cấp phát là chuyển ngay sang Đang hoạt động (Active).
> - **Bảo tồn Leads khách hàng**: Kho tài khoản đã thu hồi được ưu tiên số 1 để tái cấp bảo toàn khách hàng cũ.
> - **Bàn giao an toàn**: Bắt buộc Mở khóa tài khoản trước khi thực hiện Bàn giao.
> - **Side Drawer cạnh phải**: Xem chi tiết nhân sự, tài khoản, leads và timeline thao tác mà không mất ngữ cảnh bảng.
> - **100% Thuần Việt Doanh nghiệp**: Loại bỏ hoàn toàn từ 'hạn ngạch', giữ 'Quota' và 'Account'.

---

## 1. HƯỚNG DẪN KHỞI CHẠY PROTOTYPE

Prototype là ứng dụng Web độc lập (HTML5/CSS3/Vanilla JS thuần túy), tương thích tối ưu trên viewport Desktop tiêu chuẩn 1440 × 900 px:

### Cách 1: Mở Trực Tiếp Trên Trình Duyệt
Mở trực tiếp tệp:
```text
c:\BA\ba-tool-kit\project\z-enterprise\prototype\z-enterprise-platform\index.html
```

### Cách 2: Khởi Chạy Local HTTP Server
Tại thư mục prototype, chạy lệnh PowerShell:
```powershell
python -m http.server 8080
```
Truy cập: `http://localhost:8080` trên trình duyệt.

---

## 2. KIẾN TRÚC 2 VAI TRÒ (PERSONAS) & 3 MÀN HÌNH CHÍNH

### 2 Vai Trò Tác Nghiệp (Role Switcher tại chân trang Sidebar):
1. **Super Admin (Vũ Minh Tuấn — Trụ sở HQ Toàn Quốc)**:
   - Quản trị toàn bộ 1,200 Quota công ty trên 3 Vùng (Miền Nam, Miền Trung, Miền Bắc).
   - Xem bảng phân bổ và tỷ lệ sử dụng của toàn bộ các Chi nhánh.
   - Lọc đa chiều Vùng $\rightarrow$ Chi nhánh, thực hiện mọi action trên toàn hệ thống.
2. **Admin Chi nhánh (Lê Hoàng Nam — Chi nhánh HCM-01)**:
   - Phạm vi quản trị cố định tại chi nhánh Hồ Chí Minh 01 (150 Quota).
   - 5 Thẻ KPI tự động co cụm về dữ liệu riêng của chi nhánh.
   - Khóa cứng bộ lọc Vùng/Chi nhánh, tập trung quản lý nhân sự và tài khoản trong chi nhánh.

### 3 Màn Hình Cốt Lõi:
1. **Tổng quan (`nav-overview`)**:
   - 5 Thẻ KPI: *Tổng Quota*, *Đang sử dụng (% và thanh tiến trình)*, *Chưa sử dụng*, *Tạm khóa (Tạm dừng dịch vụ)*, *Cần chú ý*.
   - Bảng phân bổ Quota theo Vùng và Chi nhánh (Super Admin) kèm nút *Xem danh sách* drill-down sang màn hình Quota.
2. **Quota (`nav-quota`)**:
   - Thanh công cụ lọc: Tìm kiếm đa năng (Tên, Mã NV, Email, Mã ZENT) + Dropdown Vùng/Chi nhánh.
   - Dải Tabs chuyển đổi nhanh:
     - `Tất cả nhân viên`
     - `Kho tài khoản chưa cấp` *(Hiển thị rõ các account đã thu hồi có leads sẵn sàng tái cấp + Quota trống)*
     - `Đang hoạt động`
     - `Tạm khóa`
     - `Cần chú ý` *(Cảnh báo rủi ro)*
   - Bảng dữ liệu 6 cột tinh gọn và Ngăn trượt **Side Drawer** xem chi tiết từ cạnh phải.
3. **Nhật ký audit (`nav-audit-log`)**:
   - Bảng kiểm toán 5 cột chuẩn: *Thời gian* | *Người thực hiện* | *Thao tác* | *Nhân viên & Account tác động* | *Chi nhánh*.
   - Hỗ trợ tìm kiếm sự kiện và xuất file CSV kiểm toán.

---

## 3. CÁC KỊCH BẢN DEMO NGHIỆP VỤ ĐẶC SẮC

### 🎯 Demo 1: Tái Cấp Account Đã Thu Hồi (Bảo Tồn Leads Khách Hàng)
1. Trên màn hình **Quota**, chọn tab **Kho tài khoản chưa cấp**.
2. Quan sát bảng trên cùng: **Tài khoản đã thu hồi sẵn sàng tái cấp**.
   - Thấy tài khoản `ZENT-001089` có **48 Leads** từ chủ cũ `Nguyễn Thành Nam (Đã thôi việc)`.
3. Bấm **"Tái cấp ngay ➔"**:
   - Modal Cấp tài khoản tự động chọn phương thức ưu tiên: *Tái cấp từ Kho đã thu hồi*.
   - Chọn nhân sự tiếp nhận `Đặng Ngọc F` (hoặc nhân viên mới khác).
4. Bấm **"Xác nhận cấp account"**:
   - Tài khoản `ZENT-001089` được gán ngay cho `Đặng Ngọc F`, chuyển sang trạng thái `Đang hoạt động (Active)`.
   - Toàn bộ 48 leads cũ được tiếp quản, 1 điểm Quota được chuyển sang Đang dùng, ghi nhận ngay vào Nhật ký audit!

### 🎯 Demo 2: Mở Side Drawer Xem Chi Tiết Nhân Sự & Account
1. Click vào bất kỳ dòng nhân viên nào trên bảng (ví dụ: `Nguyễn Văn A`).
2. Quan sát ngăn trượt **Side Drawer** mượt mà từ cạnh phải trượt ra:
   - Hiển thị đầy đủ Hồ sơ nhân sự, Mã ZENT, Ngày cấp Zalo, Tác động Quota và số Leads tích lũy.
   - Hiển thị dòng sự kiện vòng đời (Timeline log).
   - Cho phép bấm các nút thao tác nhanh (`Bàn giao`, `Tạm khóa`, `Thu hồi`) ngay trên Drawer mà không làm mất ngữ cảnh bảng đang xem.

### 🎯 Demo 3: An Toàn Bàn Giao — Bắt Buộc Mở Khóa Trước Khi Bàn Giao
1. Tại nhân viên `Lê Văn C` đang ở trạng thái **Tạm khóa**:
2. Bấm vào menu `•••` $\rightarrow$ Thấy mục `Bàn giao` bị khóa với cảnh báo: *"Bắt buộc phải mở khóa tài khoản trước khi bàn giao"*.
3. Bấm nút **"Mở khóa"** $\rightarrow$ Xác nhận mở khóa tài khoản về `Đang hoạt động`.
4. Sau đó mới thực hiện **"Bàn giao"** sang nhân sự mới cùng chi nhánh chưa có tài khoản.
5. Sau bàn giao:
   - Nhân sự cũ `Lê Văn C` chuyển trạng thái account thành: `Đã bàn giao ➔ [Tên nhân sự mới]`.
   - Nhân sự mới nhận tài khoản và chuyển thành `Đang hoạt động`.
   - Tổng Quota của chi nhánh hoàn toàn giữ nguyên (+0 / -0).

### 🎯 Demo 4: Tạm Khóa (Tạm Dừng Dịch Vụ) vs Thu Hồi (Trả Lại 1 Quota Về Quỹ)
1. Thao tác **Tạm khóa**:
   - Chọn nhân sự `Hoàng Quốc E` $\rightarrow$ Bấm `Tạm khóa`.
   - Đọc Impact Summary: Biến động Quota khả dụng = 0 (Không làm thay đổi chỉ tiêu chi nhánh).
2. Thao tác **Thu hồi**:
   - Chọn nhân sự `Phạm Văn D` (Đã nghỉ việc nhưng account còn mở) $\rightarrow$ Bấm `Thu hồi`.
   - Đọc Impact Summary: Hoàn trả Quota trống: **+1 Quota khả dụng (Đang dùng -1)**.
   - Toàn bộ 127 leads cũ của `Phạm Văn D` được đưa vào Kho thu hồi để chờ tái cấp cho nhân sự mới!

### 🎯 Demo 5: Đổi Role Sang Admin Chi Nhánh (Cố Định Scope)
1. Click vào avatar/widget người dùng góc dưới Sidebar:
   - Hệ thống chuyển từ `Super Admin` sang `Admin Chi nhánh (HCM-01)`.
2. Quan sát giao diện:
   - 5 Thẻ KPI tự động co hẹp về đúng chỉ số của Chi nhánh HCM-01 (Tổng: 150 Quota, Đang dùng: 132, Chưa dùng: 18, Tạm khóa: 4).
   - Bộ lọc Vùng và Chi nhánh trên màn hình Quota tự động bị khóa cứng tại HCM-01.
   - Không thể can thiệp hay xem dữ liệu của các chi nhánh khác ngoài quyền hạn.
