# Fuxie Local Development Checklist

Tài liệu này lưu lại các bước xử lý lỗi thường gặp khi phát triển local.

## 1. Database Connection & Port
Nếu gặp lỗi `Dashboard smoke bị chặn do DB local 127.0.0.1:5434 không reachable` hoặc các lỗi liên quan đến Prisma client không sync schema:

1. Đảm bảo docker/postgres local đang chạy ở đúng port **5434** (Fuxie dùng port này cho Dev DB để tránh đụng với các project khác ở port 5432).
2. Xóa và khởi tạo lại Database nếu bị rác/lỗi:
   ```powershell
   $env:DATABASE_URL="postgresql://fuxie:fuxie_dev@127.0.0.1:5434/fuxie_dev"
   npx prisma db push --force-reset
   ```
3. Chạy seed script cho quá trình QA:
   ```powershell
   $env:DATABASE_URL="postgresql://fuxie:fuxie_dev@127.0.0.1:5434/fuxie_dev"
   npx tsx scripts/seed-first-contact.ts
   ```

## 2. Dev Server Hygiene
Nếu code đã pass typecheck hoặc bạn vừa sửa một mảng lớn nhưng browser vẫn hiện lỗi cũ hoặc bị cache lỗi trong `/dashboard`, `/admin/campaign`:

1. Tắt Dev Server (`Ctrl+C` hoặc kill process Node.exe).
2. Xóa thư mục `.next` trong `apps/web`:
   ```powershell
   rm -r -force apps\web\.next
   ```
3. Khởi động lại `npm run dev`.

**Note:** Các lỗi "stale parse error" ở Next.js App Router thường do Webpack cache cũ không được invalidate khi schema Prisma thay đổi hoặc khi xóa sửa cấu trúc file gốc quá nhiều.

## 3. QA First Contact Loop
Dùng 4 tài khoản sau để test luồng học A1:
- `learner-new@fuxie.local`: Hoàn toàn mới.
- `learner-speed@fuxie.local`: Đã xong bước Speed.
- `learner-boss@fuxie.local`: Đã xong Boss Review.
- `learner-roleplay@fuxie.local`: Đang/Đã vào Roleplay.

Password mặc định: Không yêu cầu nếu bật `FUXIE_DEV_AUTH_ENABLED=true` (Dùng tính năng Dev Login trên UI).
