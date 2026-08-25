# Hướng dẫn trải nghiệm Demo UI - Custom Link Nâng Cao (SOP Affiliate Marketing)

> **Mô hình nghiệp vụ:** 2-Tab Form Architecture (Mentor-approved). Salesman tạo link theo URL-First, Tab "URL đích" active và Tab "Chọn từ danh sách" disabled khi tạo mới. Sau khi tạo link thành công, hệ thống điều hướng trực tiếp sang Màn hình Chi tiết Link (Dashboard Read-only chuẩn pic_04). Nhu cầu cấu hình 1–3 gói SP/DV được thực hiện thông qua nút **"Chỉnh sửa"** (hệ thống mở Form Chỉnh sửa link và chuyển trực tiếp vào Tab "Chọn từ danh sách").

Thư mục này chứa mã nguồn giao diện HTML/CSS/JavaScript độc lập (chạy trực tiếp trên trình duyệt, không cần build bundle), mô phỏng quy trình nghiệp vụ Custom Link Nâng Cao chuẩn FPT Telecom / SOP.

---

## 1. Cách mở và chạy thử
- Mở trực tiếp file [`index.html`](file:///c:/BA/ba-tool-kit/project/AM/custom-link-nang-cao/demo/index.html) bằng trình duyệt (Google Chrome, Microsoft Edge, Firefox, Safari...).

---

## 2. Kịch bản tương tác trong Demo

### 2.1 Màn hình Danh sách Link tôi tạo (FR01)
- Hiển thị bảng danh sách các custom link cá nhân đã khởi tạo.
- Cột hiển thị: **Tên link + Avatar**, **Link/Sản phẩm dịch vụ** (Badge tên gói cước kèm avatar thu nhỏ 18×18px khi đã custom; hiện text URL đích khi chưa custom), **Ngày tạo**, **Ngày sửa**, **Thao tác**.
- Tìm kiếm realtime theo tên link và bộ lọc thời gian / loại link.
- Các nút thao tác nhanh: Xem chi tiết (icon mắt), Cấu hình SP/DV (icon bút chì - mở Form sửa vào thẳng tab SP/DV), Sao chép Shortlink (icon copy).

### 2.2 Màn hình Tạo link theo URL đích (FR02 — 2-Tab Form)
- Nhấn nút **"+ Tạo link"** ở góc trên bên phải.
- Form gồm **Thông tin cơ bản** (Tên link, chọn/đổi Avatar mẫu) và **2-Tab Thông tin link**:
  - **Tab "URL đích" (Active):** Nhập URL trang đích (thuộc `fpt.vn`).
  - **Tab "Chọn từ danh sách" (Disabled):** Trạng thái xám mờ vô hiệu hóa khi tạo mới, không cho phép click chọn trước khi link được tạo.
- Cột bên phải hiển thị khung Placeholder chờ tạo link (chưa hiển thị mã QR hay Shortlink).
- Nhấn nút **"Tạo link"**: Hệ thống thực hiện kiểm tra dữ liệu on-submit, lưu bản ghi, sinh Shortlink & Mã QR Code và tự động chuyển sang **Màn hình Chi tiết Link**.

### 2.3 Màn hình Chi tiết Link & Báo cáo KPI (FR04 — Chuẩn Mockup pic_04)
- **Banner chiến dịch (Header):** Hiển thị Avatar lớn, Tên link in đậm, Ngày tạo, Ngày cập nhật, và nút **"Chỉnh sửa"** (mở Form sửa và chuyển thẳng sang tab "Chọn từ danh sách" để cấu hình SP/DV).
- **Báo cáo hiệu quả (4 thẻ KPI realtime):** Khách hàng tiềm năng (Leads), KHTN được xử lý, Hợp đồng ký kết, Tỷ lệ chuyển đổi (CR%).
- **Bố cục 2 Cột chuẩn Dashboard (Read-only thuần túy):**
  - **Cột trái — Thông tin link AM:** Hiển thị Shortlink (nút Sao chép 1-click) và Mã QR Code (nút Tải ảnh QR).
  - **Cột phải — Sản phẩm dịch vụ:**
    - Hiển thị Header "Sản phẩm dịch vụ" (kèm badge đếm số gói).
    - Nếu link đã cấu hình gói: Render danh sách 1–3 card gói cước đã chọn (Avatar thu nhỏ + Tên gói + Thông số băng thông + Giá cước).
    - Nếu link chưa cấu hình gói nào (0 gói / mới tạo): Vùng nội dung bên dưới để trống (chờ cập nhật cấu hình). Không hiển thị nội dung hay nút tùy biến thừa.

### 2.4 Màn hình Chỉnh sửa Link (FR03 — 2-Tab Form, Khóa URL đích & Khu vực 2 cấp)
- Nhấn nút **"Cấu hình SP/DV"** tại Header Chi tiết link hoặc icon Bút chì tại bảng danh sách.
- Form mở ra và **tự động chuyển trực tiếp vào Tab "Chọn từ danh sách"** (Cấu hình SP/DV):
  - **Bộ chọn Khu vực 2 cấp (Location-first pattern giống pic2):** 
    - Khung **KHU VỰC** gồm 2 dropdown liên hoàn bắt buộc: **Tỉnh/Thành phố \*** và **Phường/Xã \*** (Phường/Xã tự động nạp theo Tỉnh/Thành đã chọn). Khi bấm "Lưu", nếu để trống Tỉnh/Thành hoặc Phường/Xã hệ thống sẽ báo lỗi và chặn lưu.
    - **Quy tắc Reset khi đổi Tỉnh/Thành hoặc Phường/Xã:** Tự động xóa sạch danh sách gói đã chọn (không popup toast) để bảo đảm đúng đơn giá và chính sách khu vực mới.
  - **Đổ toàn bộ gói theo ngành hàng của URL đích:** Nạp toàn bộ gói cước thuộc ngành hàng URL đích vào danh sách chọn.
  - **Badge cam nhẹ `mới` & Bộ đếm `X/3`:** Xuất hiện trong phiên sửa đầu tiên (dựa trên cờ `hasBeenEdited: false`) và kết thúc vĩnh viễn sau khi lưu thành công lần đầu.
  - **Giao diện thẻ gói cước đã chọn (chuẩn pic2) & Kéo thả FLIP Realtime:**
    - Hiển thị card trắng bo góc có icon tay cầm kéo `:::`, thumbnail, tên gói + thông số và icon Thùng rác 🗑️.
    - Kéo thả sắp xếp thứ tự ưu tiên với chuyển động trượt FLIP Realtime êm ái. Gói đầu tiên sẽ xuất hiện ưu tiên ở vị trí đầu trên Landing Page.
  - **Tab 1 — URL đích (Locked / Read-only):** Chuyển sang trạng thái **Read-only vĩnh viễn (nền xám, font monospace, icon Khóa 🔒)** để bảo vệ 100% định danh của Shortlink & QR Code đã phân phối ra thị trường.
- **Bảo toàn Định danh & Hiển thị Landing Page Thực tế:**
  - Nhấn "Lưu": Cập nhật dữ liệu mới nhưng **giữ nguyên vẹn 100% Shortlink và Mã QR Code** (Identity Stability) và quay về Trang Danh sách.
  - **Landing Page (Trang đích thực tế / Live Preview):** 
    - Nếu đã cấu hình gói: Thay thế vùng sản phẩm bằng đúng 1–3 gói đã chọn theo đúng thứ tự ưu tiên.
    - Nếu đã chọn khu vực nhưng chưa chọn gói nào (0 gói): Hiển thị trạng thái rỗng *"Không có sản phẩm dịch vụ khả dụng tại khu vực [Tên Tỉnh]"*.
    - Hiển thị thông tin Tên Salesman tạo link ở góc trên bên phải trang.
