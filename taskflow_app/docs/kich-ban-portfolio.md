# Kịch bản Demo TaskFlow App (Dành cho Portfolio)

**Mục tiêu của luồng test:** Kịch bản này đi qua đầy đủ các Roles, tập trung show ra *luồng quản lý logic* và các *xử lý tự động* (ví dụ: tự tính phần trăm tiến độ, noti, tracking giờ...).

---

## 1. Setup Data - Role: Owner / Giám đốc
*Chứng minh tính năng Role-based Access Control và thiết lập dữ liệu.*

- **Đăng nhập:** 
  - Email: `owner@taskflow.vn` 
  - Password: `password123`
- **Quản lý Client (Menu Clients):** 
  - Bấm "Add Client"
  - Tên công ty (Company Name): `TechNova Financials`
  - Lĩnh vực (Industry): `Fintech / Ngân hàng số`
  - Lưu lại.
- **Tạo Project mới (Menu Projects):**
  - Bấm "Create Project"
  - Tên dự án (Project Name): `TechNova Mobile App Redesign`
  - Khách hàng (Client): Chọn `TechNova Financials`
  - Mô tả (Description): `Nâng cấp toàn bộ trải nghiệm người dùng (UX) cho tính năng chuyển tiền và quản lý tài sản số.`
  - Đơn giá giờ làm (Hourly Rate): `500,000` (VND)
  - Ngày bắt đầu (Start Date): (chọn ngày đầu tháng hiện tại)
  - Ngày kết thúc (End Date): (chọn ngày cuối tháng sau)
  - Trạng thái (Status): `Active`
  - Bấm Save.
- **Gán Team Member:** 
  - Vào chi tiết dự án "TechNova Mobile App Redesign" > Click tab "Members"
  - Assign user `Linh Phuong` (pm@taskflow.vn) -> Chọn role: **Project Manager**
  - Assign user `Bao Trung` (member1@taskflow.vn) -> Chọn role: **Member**

---

## 2. Lên kế hoạch Task - Role: Project Manager
*Chứng minh khả năng Điều phối, tạo flow nghiệp vụ thực tế.*

- **Log out và Login lại:** 
  - Email: `pm@taskflow.vn` (Mật khẩu: `password123`)
- **Tạo Tasks:** 
  - Vào menu Projects -> Chọn dự án "TechNova Mobile App Redesign" -> Click "Create Task". 
  - **Tạo Task #1:**
     - Tên Task: `Phân tích UX & Vẽ Wireframe luồng chuyển tiền`
     - Assingee: `Bảo Trung`
     - Priority: `High`
     - Due Date: (Chọn hạn chót là 2 ngày tới)
     - Status: `To do` 
  - **Tạo Task #2:**
     - Tên Task: `Xây dựng Design System & Bảng màu chủ đạo`
     - Assingee: `Linh Phương` (Tự giao cho mình)
     - Priority: `Medium`
     - Due Date: (Chọn hạn chót là 5 ngày tới)
     - Status: `To do`

---

## 3. Thực thi và Cập nhật - Role: Member (Dev/Designer)
*Nổi bật tính năng Tracking & Cập nhật tự động (Automation).*

- **Log out và Login lại:** 
  - Email: `member1@taskflow.vn` (Mật khẩu: `password123`)
- **Check Notifications:** 
  - Ở màn hình chính Dashboard, bấm vào mục thông báo (quả chuông đỏ góc trên). 
  - Nó sẽ báo *"You were assigned to Phân tích UX & Vẽ Wireframe luồng chuyển tiền"*. Click thẳng vào dòng chữ này để mở Task.
- **Cập nhật Status:** 
  - Ở form chi tiết Task, đổi Status từ `To do` -> `In Progress`.
- **Luồng Time Tracking (Quan trọng! Ăn điểm ở đây):**
  - Bấm nút **Start Timer** màu xanh ở trên giao diện Task. Chờ khoảng 10 giây.
  - Bấm **Stop Timer**. Bạn vừa show cho nhà tuyển dụng thấy tính năng real-time tracking!
  - **Làm thêm (Manual Time Log):** Ở phần "Time Logs", bấm nhập tay thêm một khoảng thời gian giả lập: 
      - Nhập Duration: `150` minutes (2.5 tiếng)
      - Mô tả (Note): `Đã họp xong requirement và vẽ xong 5 màn hình cơ bản.`
- **Tương tác (Comment):** 
  - Kéo xuống khu vực bình luận, gõ dòng chữ: *"Em đã hoàn thành các artboards cốt lõi. Chị @LinhPhuong vào xem link Figma nhé."*
  - Bấm Update Status của Task sang `Done`.

---

## 4. Nghiệm thu & Khách hàng - Role: Client
*Show góc nhìn Dashboard tổng và tính minh bạch.*

- **Log out và Login lại bằng quyền Admin/Owner:** 
  - Email: `owner@taskflow.vn` (Mật khẩu: `password123`)
- **Tiến độ tự động nhảy (Project Progress Automation):** 
  - Nhanh chóng trở lại List Projects. 
  - Bạn rê chuột vào Thanh Progress của project "TechNova Mobile App Redesign". Khán giả sẽ thấy thanh tiến độ lúc này đã hiển thị là **50%** (Vì dự án có 2 tasks, 1 task đã DONE). Đây là điểm BA xuất sắc nhất (Automation tracking).
- **Export (Trích xuất file PDF):** 
  - Bấm vào chi tiết dự án, click nút Export (nếu có ở giao diện), chọn xuất file dưới định dạng `PDF`.
- **Góc nhìn Khách hàng - Tuyệt chiêu chốt hạ:** 
  - *Log out ra, Login với tài khoản Khách hàng:* 
  - Email: `client@taskflow.vn` (Mật khẩu: `password123`)
  - Cho xem một vòng Dashboard: Ở quyền Client, màn hình bị giới hạn, không thấy tin nhắn nội bộ hay những thông tin nhạy cảm. Khách hàng chỉ thấy "Đã hoàn thành 50%" và xem được số giờ log/Billing Total rất minh bạch và gọn gàng.
