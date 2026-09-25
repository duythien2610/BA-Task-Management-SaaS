# PROTOTYPE REQUIREMENTS TRACEABILITY MATRIX (v2.0)
# Z Enterprise — Business Validation Prototype

Tài liệu này ánh xạ chi tiết các màn hình, kịch bản nghiệp vụ và hành vi trong Prototype với các Quyết định PO đã xác nhận (`initiative.md`) và các Quyết định Nghiệp vụ cần xác thực (`z_enterprise_prototype_feature_uiux_improvement.md`).

---

## 1. MA TRẬN ÁNH XẠ KỊCH BẢN XÁC THỰC NGHIỆP VỤ

| Kịch Bản (Scenario) | Màn Hình / Thành Phần UI | Thao Tác Nghiệp Vụ Cốt Lõi | PO Decision & Evidence Status | Câu Hỏi Nghiệp Vụ Cần Xác Thực Với PO |
|---|---|---|:---:|---|
| **Scenario 01: New Employee** | `employees`, Modal Tạo Nhân Sự | Kiểm tra Quota khả dụng, nhập mã NV & email `@fpt.com.vn`, khởi tạo tài khoản và gửi thư mời kích hoạt | `D-001`, `D-002`, `D-004`<br/>(`CONFIRMED`) | Thời hạn hiệu lực của thư mời kích hoạt (TTL 72h) có phù hợp với thực tế tiếp nhận nhân sự của chi nhánh? |
| **Scenario 02: Quota Exhausted (Zero Quota)** | `quota`, Hộp cảnh báo Zero Quota | Khi Quota tự do = 0, hệ thống chặn gán tài khoản; hiển thị 2 lựa chọn: [Gửi Yêu Cầu Xin Thêm Quota] và [Xem Bảng Phân Bổ Vùng] | `D-001`, `D-008`<br/>(`BA PROPOSAL`) | PO chọn phương án nào: Option A (Super Admin cấp trực tiếp) hay Option B (Chi nhánh chủ động gửi phiếu yêu cầu)? |
| **Scenario 03: Employee Resigned (Offboarding)** | Modal Stepper 6 Bước (`modal-wizard`) | 1. Access: Ngắt ngay hay vào ngày cuối?<br/>2. Account: Hoàn pool, suspend hay archive?<br/>3. Customer: Chuyển nhân viên mới hay vào queue?<br/>4. History: Xem metadata hay xem toàn bộ?<br/>5. Quota: Giải phóng ngay hay sau đóng hồ sơ?<br/>6. Review: Bảng tóm tắt tác động (Impact Summary) | `D-006`, `D-007`<br/>(`PENDING PO + PROVIDER DEPENDENT`) | 1. Khi nhân viên nghỉ, tài khoản có được tái cấp cho nhân sự khác không?<br/>2. Người kế nhiệm có được xem tin nhắn cũ không?<br/>3. Quota hoàn về chi nhánh ngay hay chờ 30 ngày? |
| **Scenario 04: Employee Transfer** | Modal Điều Chuyển (`modal-generic`) | Chọn chi nhánh tiếp nhận; hệ thống hiển thị rà soát tác động nghiệp vụ (Quota đi theo nhân sự, danh bạ cũ bàn giao tại chỗ) | `D-008`<br/>(`PENDING POLICY`) | 1. Tài khoản Enterprise có đi theo nhân sự sang chi nhánh mới không?<br/>2. Khách hàng cũ có bắt buộc phải để lại chi nhánh cũ không? |
| **Scenario 05: 4,000+ Scale Management** | `employees`, Filter bar & Bulk bar | Bộ lọc đa tiêu chí (Region, Branch, Job Status, Account Status), tìm kiếm thời gian thực, chọn hàng loạt 125 nhân sự, phân trang | `D-008`<br/>(`CONFIRMED DIRECTION`) | Admin cấp chi nhánh có được quyền thực hiện các thao tác hàng loạt (Bulk Assign/Suspend) hay chỉ dành cho Super Admin? |
| **Scenario 06: Account Suspended** | Modal Xác Nhận Tác Động (Impact Confirmation) | Cảnh báo chi tiết tác động: Ngắt toàn bộ phiên làm việc, giữ nguyên quan hệ khách hàng, tạm chặn tin nhắn gửi đến | `D-006`, `D-007`<br/>(`CONFIRMED / PROPOSED`) | Khi tạm khóa tài khoản: Khách hàng gửi tin nhắn vào sẽ nhận thông báo gì từ Zalo (Delivery Failed / Tạm ngưng phục vụ)? |
| **Scenario 07: Quota Distribution** | `org-structure`, Tree & Detail panel | Cây tổ chức 3 cấp (Company → Region → Branch), chọn từng đơn vị xem hạn ngạch và nhân sự, phân bổ quota từ trên xuống | `D-001`, `D-008`<br/>(`CONFIRMED DIRECTION`) | Chi nhánh có được quyền tự điều chuyển Quota nhàn rỗi cho chi nhánh khác trong cùng Vùng không? |
| **Scenario 08: Audit Investigation** | `audit`, Bảng Audit Log | Tra cứu nhật ký các hành động quản trị hành chính theo thời gian, chủ thể, hành vi, đơn vị và kết quả | `D-007`, `D-009`<br/>(`CONFIRMED DIRECTION`) | Nhật ký quản trị cần lưu trữ tối thiểu bao lâu (6 tháng, 12 tháng hay vĩnh viễn)? |

---

## 2. DANH MỤC TRẠNG THÁI QUYẾT ĐỊNH CỐT LÕI (DECISION STATUS LEDGER)

| Mã Hiệu | Nội Dung Quyết Định | Trạng Thái Hiện Tại | Ghi Chú Xác Thực Trong Prototype |
|:---:|---|:---:|---|
| `D-001` | Định mức: 1 Quota = 1 Enterprise Account = 1 Nhân viên | `CONFIRMED` | Áp dụng bất biến trên toàn bộ các màn hình Quota và Account. |
| `D-002` | Mỗi nhân viên chỉ được sở hữu duy nhất 1 Enterprise Account | `CONFIRMED` | Chặn cấp trùng tài khoản trên màn hình Employee Management. |
| `D-003` | Enterprise Account thuộc sở hữu công ty, tách biệt hoàn toàn với Personal Zalo | `CONFIRMED` | Không có bất kỳ liên kết hay can thiệp nào vào tài khoản cá nhân. |
| `D-004` | Phương thức định danh duy nhất là Email công ty (`@fpt.com.vn`) | `CONFIRMED` | Form tạo nhân viên bắt buộc hòm thư chính thức của doanh nghiệp. |
| `D-005` | Đồng bộ đa nền tảng cho cùng một Enterprise Account | `CONFIRMED DIRECTION` | Dữ liệu danh bạ và tin nhắn phản ánh nhất quán trên các thiết bị. |
| `D-006` | Doanh nghiệp có quyền quản trị toàn diện đối với Enterprise Account | `CONFIRMED` | Không có yêu cầu bảo mật riêng tư của nhân viên đối với tài sản công ty. |
| `D-007` | Admin nắm được nhân viên nào đang trao đổi với khách hàng nào (Metadata) | `BA ANALYSIS REQUIRED` | Giới hạn hiển thị ở Mức 1-2-3 (Metadata); khóa xem nội dung tin nhắn thường nhật. |
| `D-008` | Cơ cấu tổ chức 3 tầng: Company → Region → Branch | `CONFIRMED DIRECTION` | Thể hiện đầy đủ trong cây Organization Structure. |
| `P-001` | Giới hạn số thiết bị đăng nhập đồng thời | `PROVIDER DEPENDENT` | Đánh dấu phụ thuộc khả năng kỹ thuật của Zalo Enterprise API. |
| `P-002` | Người kế nhiệm có được xem tin nhắn cũ khi bàn giao không | `PENDING PO` | Đưa vào Step 4 của Offboarding Wizard để PO đưa ra lựa chọn chính sách. |
