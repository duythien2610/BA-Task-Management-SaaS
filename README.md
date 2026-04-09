# TaskFlow BA Documentation

Welcome to the Business Analysis repository for **TaskFlow**, a Work Management SaaS Platform tailored for Agencies & SMEs. 

This repository serves as the central hub for all business analysis, system design, and technical requirement documents that shape the product's scope, architecture, and development roadmap (with a current focus on the Q2/2025 MVP).

## 🚀 Về dự án TaskFlow

TaskFlow là một nền tảng quản lý công việc (Work Management Platform) dành cho các Startup, SME và đặc biệt là các Agency. Phần mềm được thiết kế với giao diện chuẩn UI/UX, hướng tới hiệu suất (performance) và tối ưu hóa quy trình làm việc (workflow) với các chức năng chính:

### Các tính năng cốt lõi (Core Features)
* **Quản trị Module & Dự án (Workspace / Project Management)**: Quản lý tập trung các dự án, danh sách công việc. 
* **Quản lý Công việc nâng cao (Advanced Task Management)**: Theo dõi tiến độ công việc với Multi-views (Kanban, List, Calendar), thao tác hàng loạt (**Bulk Actions**) giúp tự động hóa và đồng bộ các thay đổi nhanh chóng (đổi trạng thái, phân công, dời hạn deadline).
* **Quản lý Phân quyền (Permission Module)**: Hệ thống phân quyền cấu trúc phân tầng với 5 vai trò cố định: Owner/Director, Admin, Project Manager, Member và Client (read-only). Bảo mật mạnh mẽ và tách biệt dữ liệu đa khách thuê (multi-tenant).
* **Time Tracking & Billing Summary**: Theo dõi thời gian thực hiện từng Task, tính toán số giờ làm việc của từng Member. Tự động xuất báo cáo và chi phí (Client Billing Summary) dựa trên Hourly Rate của mỗi dự án.
* **Hệ thống cảnh báo & Thông báo (Notification System)**: Thông báo tức thời (In-app notifications) và qua Email khi Task tới hạn (overdue), thay đổi thiết lập, hoặc có comments mới.
* **Xuất báo cáo linh hoạt (Export Excel/PDF)**: Cung cấp 3 dạng biểu đồ báo cáo cốt lõi phục vụ riêng cho Agencies. Xuất Báo cáo tiến độ (Project Progress), Báo cáo khối lượng công việc đội ngũ (Team Workload) dưới định dạng Excel và PDF đạt chuẩn minh bạch với Client.

## 📁 Cấu trúc thư mục (Repository Structure)

Toàn bộ các tài liệu phục vụ việc phân tích nghiệp vụ và thiết kế hệ thống được tổ chức như sau:

* **`docs/`**: Chứa toàn bộ các tài liệu định nghĩa đặc tả chi tiết (chuẩn format PDF):
  * **Business Case (BC)**: Tài liệu lý luận tính khả thi và lợi ích thương mại.
  * **Business Requirements Document (BRD)**: Tài liệu yêu cầu nghiệp vụ cấp cao.
  * **Software Requirements Specification (SRS)**: Đặc tả yêu cầu phần mềm kỹ thuật.
  * **Scope Document**: Tài liệu quản lý phạm vi thay đổi, phạm vi MVP & các tính năng Q2.
  * **Delivery Plan & Stakeholder Matrix**: Phân bổ nguồn lực tổng thể dự án.
  
* **`diagram/`**: (hoặc `diagrams/`) Chứa các mô hình phân tích trực quan hỗ trợ cả Business lẫn Dev teams:
  * **Context Diagrams & Dependency Maps**: Sơ đồ thể hiện hệ thống tương tác và luồng nghiệp vụ.
  * Các biểu đồ luồng quy trình (Flowcharts), Use Case, DFD (Data Flow Diagram) chuẩn format SVG.

## 📞 Liên hệ

Các điều chỉnh, đóng góp hoặc hỏi đáp về bộ spec kỹ thuật + nghiệp vụ của dự án có thể được theo dõi qua issue board hoặc trực tiếp pull request ở repository này. Liên hệ với Business Analyst phụ trách dự án để được hỗ trợ cụ thể nhất.
