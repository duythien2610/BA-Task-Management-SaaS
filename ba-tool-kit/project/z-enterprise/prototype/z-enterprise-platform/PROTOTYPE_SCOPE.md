# PROTOTYPE SCOPE CONTRACT (v7.0)
# Z Enterprise — Quản Trị Quota Zalo Enterprise & Vòng Đời Tài Khoản

> **Trạng thái:** HOÀN THIỆN ĐỒNG BỘ 100% THEO CHỈ ĐẠO NGHIỆP VỤ & QUYẾT ĐỊNH CLARIFICATION HARNESS (`D-013` ĐẾN `D-020`)  
> **Nguồn chân lý nghiệp vụ:** `Bạn đang làm việc trên prototype hi.md`, `media_1790307268621.png`, Quyết định Stakeholder  
> **Triết lý Thiết kế:** **B2B SaaS Enterprise Clean Minimalism** (Giao diện trắng phẳng tối giản, viền mảnh 1px, 100% không sticker/emoji trang trí, độ tương phản văn bản cao, tối ưu mật độ thông tin).  
> **Định dạng Viewport mục tiêu:** Desktop Admin Console tiêu chuẩn (1440 × 900 px, responsive container).

---

## 1. MỤC TIÊU & PHẠM VI BẤT BIẾN (IN-SCOPE VS OUT-OF-SCOPE)

### In-Scope (Thuộc Phạm Vi Trọng Tâm Duy Nhất):
1. **Quản trị Quota Zalo Enterprise**:
   - $1 \text{ Quota} = 1 \text{ Zalo Enterprise Account}$.
   - Phương trình: $\text{Tổng Quota} = \text{Đang sử dụng} + \text{Chưa sử dụng}$.
   - $\text{Đang sử dụng} = \text{Đang hoạt động} + \text{Tạm khóa}$ *(Bao gồm tài khoản Đang hoạt động và Tạm dừng dịch vụ)*.
2. **Vòng đời tài khoản & Bảo tồn Khách hàng/Leads**:
   - **Cấp Account**: Ưu tiên số 1 là tái cấp từ Kho tài khoản đã thu hồi có leads, sau đó mới đến Cấp mới từ Quota trống.
   - **Tạm khóa / Mở khóa**: Tạm dừng quyền truy cập của nhân viên nhưng vẫn bảo lưu Quota.
   - **Bàn giao Account**: Chuyển quyền sử dụng tài khoản và leads trong cùng chi nhánh; yêu cầu bắt buộc mở khóa trước khi bàn giao; người cũ thành `Đã bàn giao`.
   - **Thu hồi Account**: Giải phóng 1 Quota về quỹ (+1 Quota khả dụng) và đưa account cùng leads vào Kho thu hồi.
3. **Cơ chế Side Drawer (Ngăn trượt cạnh phải)**:
   - Cho phép xem chi tiết nhân sự, mã ZENT, ngày cấp Zalo, số leads và timeline lịch sử mà không làm mất bộ lọc bảng đang xem.
4. **2 Persona phân quyền rõ rệt**:
   - `Super Admin (Toàn quốc)`: Lọc đa tầng Vùng $\rightarrow$ Chi nhánh, xem và thao tác trên toàn bộ 1,200 Quota.
   - `Admin Chi nhánh (HCM-01)`: Cố định chi nhánh, 5 thẻ KPI co cụm theo dữ liệu chi nhánh, khóa cứng bộ lọc.

### Out-of-Scope (Đã Loại Bỏ Hoàn Toàn Khỏi Code & UI):
- ❌ CRM, Quản lý Khách hàng, Quản lý Portfolio Khách hàng cá nhân.
- ❌ Omnichannel Chat, Khung chat Zalo cá nhân/OA/Messenger/Website.
- ❌ Giám sát Sales, Đánh giá Hiệu suất (KPI/SLA/Response Time).
- ❌ Bảng xếp hạng thi đua (Hạng 1, Hạng 2, Scorecards, Health Score).
- ❌ Break-Glass Emergency Override, Compliance Center.
- ❌ Vai trò Region Admin, Sales Rep, Legal & Audit (Chỉ giữ đúng Super Admin và Admin Chi nhánh).
- ❌ Trạng thái "Chờ kích hoạt" (Pending Activation): Cấp là Active ngay.

---

## 2. KIẾN TRÚC 3 MÀN HÌNH NGHỆP VỤ

| Màn Hình | Mã View | Mục Tiêu & Thành Phần Cốt Lõi |
|---|---|---|
| **1. Tổng quan** | `overview` | • **5 Thẻ KPI**: Tổng Quota (1,200), Đang dùng (926 - 77.2%), Chưa dùng (274), Tạm khóa (38 - Tạm dừng dịch vụ), Cần chú ý (17 ⚠).<br/>• **Bảng Phân bổ theo Đơn vị**: Chi tiết từng Vùng/Chi nhánh kèm tỷ lệ sử dụng và nút drill-down sang Quota.<br/>• **Callout Quy chuẩn**: Nhắc nhở quy chuẩn 1 account = 1 quota. |
| **2. Quota** | `quota` | • **Thanh công cụ**: Ô tìm kiếm đa năng + Bộ lọc Vùng/Chi nhánh.<br/>• **Dải Tabs nhanh**: Tất cả nhân viên, Kho tài khoản chưa cấp (bảo tồn leads), Đang hoạt động, Tạm khóa, Cần chú ý.<br/>• **Bảng 6 nhóm cột**: Nhân viên, Chi nhánh, Zalo Enterprise (kèm ngày cấp), Trạng thái (kèm Quota), Cần chú ý, Thao tác.<br/>• **Side Drawer**: Ngăn trượt từ cạnh phải xem chi tiết & action nhanh. |
| **3. Nhật ký audit** | `audit_log` | • **Bảng kiểm toán chuẩn 5 trường**: Thời gian, Người thực hiện, Thao tác, Nhân viên & Account tác động, Chi nhánh.<br/>• Tìm kiếm sự kiện và xuất file CSV kiểm toán. |

---

## 3. BẢNG ÁNH XẠ THUẬT NGỮ CHUẨN DOANH NGHIỆP (ZERO 'HẠN NGẠCH')

- `Total Quota` $\rightarrow$ **Tổng Quota**
- `In Use Quota` $\rightarrow$ **Đang sử dụng** (hoặc **Đang dùng**)
- `Available Quota` $\rightarrow$ **Chưa sử dụng** (hoặc **Khả dụng**)
- `Suspended Quota` $\rightarrow$ **Tạm khóa** (Tạm dừng dịch vụ)
- `Needs Attention` $\rightarrow$ **Cần chú ý**
- `Unassigned Account` $\rightarrow$ **Chưa cấp**
- `Revoked Account with Leads` $\rightarrow$ **Tài khoản đã thu hồi (Có sẵn Leads)**
- `Handed Over` $\rightarrow$ **Đã bàn giao (cho [Tên mới])**
- `Active` $\rightarrow$ **Đang hoạt động**
- `Audit Log` $\rightarrow$ **Nhật ký audit**
- `Overview` $\rightarrow$ **Tổng quan**
- `Assign Account` $\rightarrow$ **Cấp Account**
- `Handover Account` $\rightarrow$ **Bàn giao tài khoản**
- `Revoke Account` $\rightarrow$ **Thu hồi tài khoản**
- `Unlock Account` $\rightarrow$ **Mở khóa tài khoản**
