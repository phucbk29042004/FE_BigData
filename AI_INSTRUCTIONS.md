Bạn là một Autonomous Fullstack Architect. Khi thực hiện các yêu cầu trong dự án Next.js Dashboard này, hãy tuân thủ 13 nguyên lý "bất di bất dịch" sau:

1. Modular Feature-Based Architecture
Không tổ chức code theo loại file đơn thuần. Hãy tổ chức theo Features. Ví dụ: features/revenue-analytics/, features/user-management/. Mỗi feature folder phải chứa components, hooks, và logic riêng biệt của nó.

2. Type-Driven Development (TDD 2.0)
Mọi luồng dữ liệu phải bắt đầu bằng việc định nghĩa Schema (ưu tiên Zod). Sử dụng Discriminated Unions cho các trạng thái của Dashboard (e.g., Loading, Empty, Error, Success) để tránh các lỗi logic tiềm ẩn.

3. Progressive Data Streaming
Áp dụng chiến lược "Shell-First". Trang Dashboard phải render Layout khung ngay lập tức. Các Widget nặng (biểu đồ, bảng lớn) phải được bọc trong <Suspense> với Skeleton đặc thù cho từng loại dữ liệu, không sử dụng một loading spinner chung cho cả trang.

4. Server-Side Logic & "Thin" Clients
Client Component chỉ được phép chứa UI logic và state tối thiểu (e.g., đóng mở modal). Toàn bộ việc tính toán tỷ lệ, lọc dữ liệu, định dạng tiền tệ/ngày tháng phải thực hiện ở Server hoặc thông qua useMemo cực kỳ hạn chế.

5. Advanced Server Actions Pattern
Mọi Action phải trả về một chuẩn chung: { success: boolean, data?: T, error?: string }. Bắt buộc triển khai Optimistic Updates (cập nhật giao diện trước khi server phản hồi) cho các thao tác như chuyển trạng thái đơn hàng hoặc ẩn/hiện widget.

6. Component Composition over Props Drilling
Sử dụng Compound Components pattern cho các phần phức tạp như Modal, DataTable hay Charts. Tránh tạo các "Mega-components" với hàng chục props.

7. Zero-Runtime CSS & Design System
Sử dụng Tailwind CSS với các biến CSS được định nghĩa trong globals.css. Mọi khoảng cách (spacing), màu sắc (colors), và độ bo góc (radius) phải tuân thủ nghiêm ngặt hệ thống design hệ thống (tokens) của Shadcn UI.

8. Query Parameter as Source of Truth
Toàn bộ trạng thái của Dashboard (phân trang, search, filters, tab đang chọn) phải được đồng bộ lên URL Search Params. AI không được dùng useState cho các giá trị này để đảm bảo khi Refresh trang, Dashboard vẫn giữ nguyên trạng thái.

9. Semantic HTML & Accessibility (A11y)
Mọi biểu đồ và bảng phải có aria-labels. Phím tắt (Hotkeys) là bắt buộc cho các thao tác nhanh trên Dashboard (ví dụ: CMD+K để tìm kiếm, ESC để đóng nhanh các panel).

10. Performance Budget & Memoization
AI phải tự động kiểm tra việc re-render. Sử dụng React.memo cho các Chart components và useCallback cho các hàm xử lý sự kiện truyền xuống con. Đảm bảo Bundle size không bị phình to bởi các thư viện biểu đồ bên thứ ba.

11. Smart Error Boundary
Không để một Widget lỗi làm hỏng toàn bộ Dashboard. Mỗi khu vực chức năng lớn phải được bọc trong một ErrorBoundary riêng với nút "Thử lại" (Retry) cục bộ.

12. Logging & Telemetry (Agentic Debugging)
Triển khai hệ thống log đơn giản trong Server Actions để theo dõi lỗi. Khi viết code, AI phải để lại các "trace" (comment hoặc log) ở các điểm mấu chốt để dễ dàng debug bằng các công cụ quan sát.

13. Clean Code & Vietnamese Documentation
Tên biến phải mang tính mô tả (Self-documenting). Với các logic tính toán nghiệp vụ Dashboard phức tạp, AI phải viết giải thích bằng tiếng Việt ngay trên đầu hàm về mục đích và các trường hợp biên (edge cases).

├── app/
│   ├── (auth)/             # Login, Register
│   ├── (dashboard)/        # Layout chính của Dashboard
│   │   ├── layout.tsx      # Sidebar & Navbar (Persistent)
│   │   ├── page.tsx        # Trang tổng quan (Overview)
│   │   ├── analytics/      # Trang phân tích chuyên sâu
│   │   └── settings/       # Cấu hình hệ thống
│   ├── api/                # Route Handlers cho các tác vụ đặc biệt
│   └── globals.css         # Design tokens & Tailwind
├── components/
│   ├── ui/                 # Nguyên tử (Buttons, Inputs - từ Shadcn)
│   ├── shared/             # Dùng chung (Navbar, Sidebar, Footer)
│   └── dashboard/          # Các Widget đặc thù (RevenueChart, RecentOrders)
├── features/               # QUAN TRỌNG: Logic theo tính năng
│   ├── orders/             # components, hooks, actions cho Đơn hàng
│   ├── inventory/          # components, hooks, actions cho Kho hàng
│   └── users/              # components, hooks, actions cho User
├── lib/
│   ├── db.ts               # Kết nối Database (Prisma/Drizzle)
│   ├── utils.ts            # Cn, formatDate, formatCurrency
│   └── validators/         # Zod schemas (Source of truth)
├── hooks/                  # Custom hooks (useDebounce, useMediaQuery)
├── types/                  # Global types & interfaces
└── middleware.ts           # Bảo mật & Route protection