Warehouse Management System (WMS) - Frontend
Giao diện quản lý kho hàng hiện đại dành cho hệ thống WMS, được xây dựng trên nền tảng React, TypeScript và thư viện UI Ant Design. Ứng dụng tập trung vào trải nghiệm người dùng tối ưu cho các tác vụ quản trị kho phức tạp.

Công nghệ sử dụng
Core: React 18, TypeScript.

Build Tool: Vite (tốc độ phát triển và đóng gói tối ưu).

UI Framework: Ant Design (đảm bảo tính nhất quán cho các thành phần Form, Table, Modal).

State Management: Redux Toolkit / Zustand (Quản lý trạng thái đơn hàng, tồn kho).

HTTP Client: Axios (Xử lý Interceptors, tích hợp JWT tự động).

Kiến trúc thư mục (Screaming Architecture)
Dự án được tổ chức theo hướng Module-based, giúp dễ dàng mở rộng và bảo trì:

src/api/: Định nghĩa các dịch vụ kết nối API, tách biệt logic gọi dữ liệu khỏi giao diện.

src/pages/: Chứa giao diện chính của các module nghiệp vụ (Stocktake, Warehouse, Inventory...).

src/components/: Các thành phần UI tái sử dụng (Common Components).

src/store/: Quản lý trạng thái toàn cục của ứng dụng.

src/types/: Định nghĩa Type/Interface TypeScript, đồng bộ hóa cấu trúc dữ liệu với Backend.

src/utils/: Các hàm tiện ích xử lý định dạng ngày tháng, tiền tệ và xử lý chuỗi.

Các tính năng chính
Dashboard: Tổng quan về nhập xuất kho và cảnh báo tồn kho thấp.

Inventory Management: Theo dõi chi tiết vị trí hàng hóa theo kho và vị trí cụ thể.

Order Processing: Xử lý quy trình tạo đơn nhập kho (PO), xuất kho (SO) và điều chuyển.

Authorization UI: Phân quyền hiển thị Menu và các nút chức năng dựa trên Permission nhận được từ Backend.

Triển khai và Chạy ứng dụng
Chạy ở môi trường Development
Cài đặt thư viện:

Bash

npm install
Khởi chạy:

Bash

npm run dev
Truy cập: http://localhost:5173

Chạy bằng Docker (Production-ready)
Dự án đã được cấu hình sẵn Dockerfile sử dụng Nginx để phục vụ file tĩnh:

Truyền biến môi trường: Cấu hình địa chỉ API thông qua tham số VITE_API_BASE_URL trong file docker-compose.yml.

Khởi chạy:

Bash

docker-compose up -d --build
Ghi chú kỹ thuật
Hệ thống sử dụng Interceptors để tự động đính kèm JWT vào Header của mọi yêu cầu HTTP.

Xử lý lỗi tập trung (Global Error Handling) cho các mã trạng thái 401, 403 để điều hướng người dùng về trang Login hoặc Blocked.

Phát triển bởi: [Your Name/Team]

Mục tiêu: Cung cấp giao diện quản trị kho hiệu suất cao, trực quan và dễ sử dụng.
