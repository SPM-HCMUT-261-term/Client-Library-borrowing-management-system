# Phân tích chuẩn bị triển khai Admin BookBorrow

Ngày: 13/11/2026. Phạm vi: đọc source client/server, schema SQL, API contract và Figma; chưa triển khai hoặc sửa logic ứng dụng.

Thiết kế: [BookBorrow – Admin view](https://www.figma.com/design/eR66wqUZrC4hJGGcMmxjz8/BookBorrow?node-id=146-2).
Đã đọc metadata toàn trang; lấy design context và xem ảnh render của Accounts (147:63), Violation details (147:659), Activity log (147:863). Các màn hình khác được phân tích từ cấu trúc/layer text; cần lấy design context riêng khi triển khai.

## 1. Kết luận

Client có nền tảng phù hợp để mở rộng admin, nhưng hiện chỉ có giao diện guest/student. Backend có auth và 5 route quản lý tài khoản được mount; chưa đủ nghiệp vụ cho Figma. Cần sửa auth, phân quyền và truy vấn tài khoản trước, bổ sung violation/activity/recovery, rồi nối UI thật.

API_Contract.md hiện ghi Admin View là “Non-Figma”; tài liệu này chưa phản ánh thiết kế admin mới. Không coi endpoint được mô tả trong contract là endpoint đã chạy trên server.

## 2. Hiện trạng source

| Phần | Hiện trạng | Cách tận dụng |
|---|---|---|
| Client | React 18, TypeScript, Vite, React Router 6, Tailwind 3, lucide-react | Giữ stack hiện có |
| Routing | src/App.tsx chỉ có /, /login, /books, /books/:id, /holds/:id/confirmed, /my-borrowing | Thêm nhánh /admin với guard theo role |
| Layout | src/components/Layout.tsx có guest/auth/student; mọi user đăng nhập đều vào layout student | Tạo AdminLayout dùng navigation đúng Figma |
| Auth | AuthContext + localStorage token/user; LoginPage hỗ trợ chọn 3 role nhưng luôn navigate('/') | Điều hướng theo role và khôi phục session đúng backend |
| API client | src/api/client.ts, endpoints.ts, types/api.ts | Tái sử dụng envelope/error handling sau khi thống nhất auth/types |
| Mock | MSW mặc định bật trừ khi VITE_USE_MOCK=false; có auth, books, borrowing; chưa có handler admin | Bổ sung mock admin theo cùng contract mới |
| Server | Express + TypeScript + PostgreSQL; routes → controller → service → repository | Mở rộng theo cấu trúc hiện có |
| Điểm khởi động | src/server.ts; src/app.ts chỉ là code comment | Kiểm tra route tại server.ts |
| Inventory | Có controller/service nhưng routes và repository implementation đang rỗng, chưa mount | Không coi là API sẵn dùng |
| Database | users, books, physical_copies, holds, loans, fines; session store riêng | Thêm dữ liệu lock, violation, audit, recovery bằng migration |

## 3. Phạm vi Figma

Trang có 14 frame workspace, 6 frame authentication/recovery và 5 modal. Nhiều frame là trạng thái của cùng một trang, không phải route độc lập.

| Nhóm | Node | UI cần triển khai | API liên quan |
|---|---|---|---|
| Home | 147:2 | 4 thẻ Accounts, Violations, Activity log, My profile | /auth/me; không thấy KPI dashboard trong thiết kế |
| Accounts | 147:63 | Tìm tên/account ID, lọc role/access, bảng trạng thái | GET /admin/users cần sửa và mở rộng |
| Account details | 147:228 | Thông tin role, quyền đăng nhập, quyền mượn; đổi role/khóa | Thiếu GET chi tiết; PUT hiện tại chỉ đáp ứng một phần |
| Account states | 147:296, 147:367, 147:438 | Locked, unlocked, role updated và thông báo thành công | Cần lock/unlock/role mutation kèm audit |
| Violations | 147:509 | Tìm student, ID, title, copy; danh sách và số tiền còn nợ | Chưa có API |
| Violation details | 147:659, 147:730, 147:798 | Outstanding, ready to clear, cleared | Chưa có API chi tiết/clear |
| Activity log | 147:863, 147:1000 | Tab account activity/circulation, tìm kiếm, lọc ngày/event | Chưa có API |
| Activity event | 147:1120 | Actor, subject, loan, trạng thái trước/sau, lý do | Chưa có API |
| My profile | 147:1190 | Thông tin admin, recovery và đăng xuất | GET /auth/me, POST /auth/logout cần sửa |
| Choose role / Sign in | 148:55, 148:133 | Có thể mở rộng LoginPage hiện tại | POST /auth/login |
| Recovery | 148:209, 148:299, 148:386, 148:477 | Nhập account ID → mã xác minh → mật khẩu mới → thành công | Chưa có luồng recovery |
| Confirmation | 148:561, 148:574, 148:583, 148:592, 148:601 | Lock có lý do; unlock; clear; sign out; đổi role | Dùng chung modal có pending/error/keyboard focus |

### Quy tắc thể hiện rõ trong thiết kế

- Account access và borrowing access độc lập. Unlock tài khoản không tự xóa hạn chế mượn.
- Phân biệt khóa Manual và Automatic; cần lưu nguồn, lý do và thời điểm.
- Sau khi trả sách và hết nợ, case vẫn có thể Restricted và Ready to clear; admin phải xác nhận clear. Chỉ suy ra restriction từ overdue/fines hiện tại sẽ làm mất trạng thái này.
- Đổi Student thành Staff không xóa khoản mượn/vi phạm trước đó; UI thể hiện “Previous student violation”.
- Clear phải kiểm tra nghĩa vụ ở server, không chỉ disable nút frontend; nếu còn case khác thì chưa thể khôi phục quyền mượn toàn tài khoản.
- Trả sách/thanh toán được cập nhật từ quầy thư viện. Admin đọc kết quả để xử lý case.
- Activity ghi actor (gồm System), subject, thời gian, nguồn, loan/copy và trạng thái trước/sau.
- Recovery dùng mã một lần sau khi quầy xác minh danh tính; không mặc định chuyển thành email OTP.
- Điều kiện khóa tự động, ngưỡng quá hạn, xử lý mất/hỏng không được mô tả đầy đủ trong các frame. Cần chốt chính sách trước khi triển khai rule tự động.

### Hướng giao diện

Khung desktop 1440 × 1000, header 80px, lề ngang 48px. Nền #F7F6F2, card trắng, viền #DCE2DC, chữ #203B3B/#687573, accent #17645F. Lora cho heading, Inter cho nội dung; phần lớn đã có trong tailwind.config.js. Card radius 10px, button/input khoảng 40px, radius 6px. Layout hiện tại có header 88px nên cần cấu hình riêng cho admin.

Tái sử dụng token và cấu trúc auth/API; tách AdminPageHeader, StatusBadge, DataTable, SearchFilters, DetailRow, Notice, ConfirmDialog. Không sao chép tọa độ absolute cho toàn trang; dùng grid/flex. Mobile/tablet chưa được xác định trong các frame đã đọc, cần bố trí responsive hợp lý. Icon/asset Figma phải đối chiếu và tải đúng khi triển khai; chưa tải asset trong giai đoạn phân tích.

## 4. API thực tế được mount

Prefix chung: /api/v1. “Có route” không đồng nghĩa đã được kiểm thử thành công.

| Method / path | Input chính | Kết quả / lưu ý |
|---|---|---|
| POST /auth/login | accountId, password, role | Set session cookie; accessToken/sessionToken trả chuỗi rỗng |
| GET /auth/me | Session | User stats; query hiện lệch schema SQL |
| POST /auth/logout | Session | success/message; xử lý callback destroy cần sửa |
| GET /admin/users | type_query, role, status, page, limit | items/pagination; chưa nhận q như contract |
| POST /admin/users | accountId, fullName, password, role, yearGroup? | User mới; chưa hash password đúng |
| PUT /admin/users/:id | fullName, role, yearGroup?, status | Bắt buộc gửi đầy đủ fullName/role/status; chưa có lý do lock/audit |
| POST /admin/users/:id/reset-password | newPassword | Reset bởi người đăng nhập; không phải recovery một lần |
| DELETE /admin/users/:id | id | Có kiểm tra loans nhưng chưa đúng đủ contract |

Create/delete/reset tài khoản có trong backend nhưng không thấy là thao tác chính trong workspace Figma mới; không tự thêm các màn hình CRUD ngoài phạm vi thiết kế.

## 5. Lỗi và khoảng trống cần xử lý

Các đường dẫn server dưới đây tương đối với Server-Library-borrowing-management-system; client tương đối với Client-Library-borrowing-management-system.

### P0 — auth và phân quyền

1. **Thiếu admin-only authorization:** server.ts dùng verificationMiddleware cho /admin/users, nhưng middleware chấp nhận student/staff/admin. User có session hợp lệ có thể gọi mutation quản trị. Bổ sung requireRole('admin'), đọc trạng thái/quyền hiện hành hoặc cơ chế vô hiệu hóa session sau khóa/đổi role.
2. **Token và cookie lệch nhau:** auth.service.ts trả token rỗng; client AuthContext không gọi /me khi thiếu token, nên reload sẽ xóa user local. Ưu tiên thống nhất cookie session theo backend hiện tại; bootstrap /me độc lập token. Vite chưa có proxy /api; nếu gọi cross-origin cần credentials và cấu hình CORS/cookie phù hợp. Với cùng origin qua proxy, fetch mặc định đã gửi cookie cùng origin.
3. **Mật khẩu chưa bảo vệ đúng:** password.util.ts hash chuỗi cố định "password" và verify bằng so sánh plaintext; admin repository ghi password/newPassword trực tiếp vào password_hash. Cần hash/verify thật cho create/reset/login, đồng thời xử lý dữ liệu phát triển cũ.
4. **/auth/me lệch schema:** auth.repository.ts query borrow_records trong khi schema.sql định nghĩa loans. DTO profile trả id còn client đòi _id. Sửa query và thống nhất serialization.
5. **Seed admin lỗi:** init.seed.ts SELECT alias num_user nhưng đọc numUser, chưa chuyển COUNT về number; nhánh tạo admin không chạy như dự định. Seed hiện ghi mật khẩu thô.

### P1 — danh sách và mutation tài khoản

6. **SQL danh sách có lỗi:** admin.repository.ts kiểm tra truthiness của mảng conditionsStmt (mảng rỗng vẫn truthy), nên không có filter vẫn nối WHERE rỗng. Ghép WHERE/ORDER BY/LIMIT thiếu khoảng trắng ở ranh giới có thể tạo SQL sai.
7. **Phân trang sai:** LIMIT = limit × page, không OFFSET; totalItems lấy rowCount của kết quả giới hạn. Cần COUNT với cùng filter, LIMIT/OFFSET và thứ tự ổn định.
8. **Thiếu search:** type_query chỉ chọn thứ tự accountId/fullName, không tìm từ khóa; controller không nhận q. Cần q tìm tên hoặc account ID bằng tham số SQL.
9. **Stats không thống nhất:** admin trả unpaidFinesCount thay vì tổng unpaidFines; COUNT PostgreSQL chưa được chuẩn hóa number; hasBorrowingHistory chỉ xét holds, bỏ loans. DTO khai báo id nhưng SQL trả _id.
10. **Delete không đủ bảo vệ:** dùng params.id trực tiếp để kiểm tra loans.student_id dù input có thể là accountId; chưa kiểm tra holds. Phải resolve user ID trước và kiểm tra lịch sử trong transaction.
11. **Duplicate create:** service kỳ vọng repository trả null, nhưng repository INSERT thông thường sẽ throw lỗi unique; cần map SQLSTATE 23505 thành 409.
12. **updatedAt không đổi:** UPDATE không set updated_at; schema không có trigger tương ứng. Cột Last change sẽ sai.
13. **Logout:** response thành công được gửi trước khi callback session.destroy hoàn tất; lỗi callback có thể gửi response lần hai. Chờ destroy xong và clear cookie đúng path.
14. **Lỗi response:** fallback 404/500 ở server.ts không theo envelope success/error/code/message của client; cần thống nhất. Success reset/logout không có data, nên type response cần cho phép dạng message-only hoặc dùng data:null nhất quán.

### P1 — thiếu mô hình nghiệp vụ

users.status chỉ có Active/Inactive, chưa có nguồn/lý do khóa; schema chưa lưu violation lifecycle, clearance, audit events hoặc recovery challenges. Không thể dựng trạng thái Figma chính xác chỉ bằng đổi nhãn Inactive thành Locked.

## 6. Contract đề xuất bổ sung — chưa tồn tại

Các route/field sau là đề xuất để triển khai, không phải API hiện có.

| API | Mục đích |
|---|---|
| GET /admin/users?q=&role=&status=&page=&limit= | Hoàn thiện search/filter/pagination; thống nhất ý nghĩa access filter |
| GET /admin/users/:id | Detail đầy đủ, accountAccess, borrowingAccess, role permissions, actions khả dụng |
| POST /admin/users/:id/lock {reason} | Khóa thủ công + audit + xử lý session |
| POST /admin/users/:id/unlock | Mở đăng nhập, không tự clear borrowing restriction |
| PATCH /admin/users/:id/role {role} | Đổi role + audit; bảo toàn lịch sử |
| GET /admin/violations?q=&status=&page=&limit= | Queue gồm user, reason, loan/copy/book, outstandingAmount, caseStatus |
| GET /admin/violations/:id | Return/payment, restriction, canClear và clearDisabledReason |
| POST /admin/violations/:id/clear | Kiểm tra lại nghĩa vụ, cập nhật case, tính lại eligibility, ghi audit trong transaction |
| GET /admin/activity-logs?category=&q=&event=&from=&to=&page=&limit= | Account/circulation history, filter phía server |
| GET /admin/activity-logs/:id | Actor/subject/before/after/reason/related loan |
| POST /auth/recovery/start | Khởi tạo yêu cầu theo account ID; không tự cấp mã chỉ vì biết ID |
| POST /auth/recovery/verify | Kiểm tra mã do quầy cấp; tạo quyền reset ngắn hạn |
| POST /auth/recovery/reset | Mật khẩu mới, tiêu thụ quyền reset và vô hiệu hóa session phù hợp |

Luồng cấp mã tại quầy cần quyền riêng, mã hết hạn/dùng một lần và giới hạn thử; tên route cấp mã chốt khi làm phần quầy. Reset-password quản trị hiện tại không thay thế luồng này.

Mô hình đề xuất:

- AccountAccess: state, source, reason, changedAt, changedBy; giữ tương thích status hoặc migration rõ ràng.
- BorrowingAccess: eligible/restricted/notApplicable, reasons, unresolvedCaseCount; do server tính từ role và case còn hiệu lực.
- Violation: user/loan/copy references, reason, openedAt, clearedAt/clearedBy; readyToClear suy ra từ nghĩa vụ hiện hành, clearance lưu bền vững. Không buộc tự xóa restriction khi thanh toán.
- AuditEvent: category, eventType, actor hoặc System, subject, before/after, reason, timestamp, related references. Ghi cùng transaction với mutation; không ghi password/recovery code.
- RecoveryChallenge: user, hash mã, thời hạn, số lần thử, thời điểm dùng, người cấp/xác minh.

Chính sách cần chốt khi làm backend: ngưỡng khóa tự động; unlock khi còn automatic lock; xử lý nghĩa vụ lost/damaged; bảo vệ admin cuối cùng và tự khóa/đổi role; thời hạn recovery. Đây là chi tiết chưa được định nghĩa đầy đủ trong source/thiết kế.

## 7. Kế hoạch triển khai

1. Sửa auth/session, password, /me, seed, role guard và error envelope; cấu hình chạy client/server với mock tắt.
2. Sửa GET/PUT tài khoản, chuẩn hóa User DTO, bổ sung detail/lock/unlock/role và migration/audit cần thiết.
3. Dựng /admin, /admin/accounts, /admin/accounts/:id, /admin/profile với AdminLayout và confirmation dialogs; redirect sau login dựa role.
4. Thêm violation model/API; dựng /admin/violations và /admin/violations/:id cho đủ ba trạng thái.
5. Hoàn thiện audit từ account/circulation/system; dựng /admin/activity-log và /admin/activity-log/:id.
6. Thêm recovery flow và mock tương ứng. Đối chiếu từng frame còn lại bằng design context/screenshot trước khi code chi tiết.

Tổ chức client dự kiến: src/pages/admin/*, src/components/admin/*, src/api/admin.ts, src/types/admin.ts; tách handler mock admin để không dồn vào file handlers.ts hiện có.

## 8. Kiểm chứng khi triển khai

- Đăng nhập admin → đúng /admin; reload giữ phiên; logout/expired session quay về login; student/staff bị 403 khi gọi API admin trực tiếp.
- Search tiếng Việt/account ID, kết hợp filter, trang 2 không lặp trang 1, tổng số chính xác; empty/loading/error/retry đầy đủ.
- Lock/unlock giữ borrowing restriction đúng; đổi role giữ nghĩa vụ cũ; giao diện lấy dữ liệu server sau mutation.
- Clear bị từ chối nếu chưa đủ điều kiện hoặc dữ liệu thay đổi đồng thời; clear một case không xóa restriction từ case khác; không ghi audit trùng khi retry.
- Audit đủ actor/before/after/reason; recovery hết hạn/sai/dùng lại bị từ chối.
- So ảnh desktop với Figma, kiểm tra responsive, bàn phím, focus modal, disabled/pending và lỗi validation.

Giới hạn lần phân tích này: chưa cài dependencies (hai repo chưa có node_modules), chưa build, chưa chạy server/PostgreSQL hay gọi API runtime. Các lỗi trên được xác định từ code/schema, không phải kết quả integration test. Không thay đổi source ứng dụng hay dữ liệu database.
