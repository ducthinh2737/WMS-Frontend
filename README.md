# 🎨 WMS - FRONTEND (REACT & ANT DESIGN)

Giao diện quản lý kho hàng hiện đại, sử dụng **Vite**, **React TypeScript** và **Ant Design**.

## 🏗️ Cấu trúc thư mục (Screaming Architecture)
Nhìn vào cấu trúc `src/` của dự án:
* **`api/`**: Quản lý các dịch vụ gọi API (như `product.api.ts`, `warehouseApi.ts`).
* **`components/`**: Các thành phần UI dùng chung.
* **`pages/`**: Chứa giao diện các module (ví dụ: `pages/stocktake/CreateStockTake.tsx`).
* **`store/`**: Quản lý trạng thái toàn cục (Redux/Zustand).
* **`types/`**: Định nghĩa các Interface TypeScript đồng bộ với Backend.

## 🚀 Công nghệ sử dụng
* **Vite:** Công cụ build siêu tốc.
* **Ant Design:** Thư viện UI chính cho Table, Form và Layout.
* **Axios:** Xử lý kết nối API với lớp Backend.

## 🛠 Hướng dẫn chạy
1. Cài đặt: `npm install`
2. Chạy môi trường Dev: `npm run dev`
3. Truy cập tại: `http://localhost:5173`
