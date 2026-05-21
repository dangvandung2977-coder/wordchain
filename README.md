# English Word Chain Miniapp

Một miniapp **nối từ tiếng Anh online**:
- Người chơi **chỉ nhập tên**, không cần tài khoản.
- Host tạo phòng, gửi **mã phòng** hoặc **link phòng** cho bạn bè.
- Hỗ trợ **2–8 người**.
- Mỗi từ hợp lệ cộng **1 điểm / 1 ký tự**.
- Ai đạt **100 điểm trước** thắng.
- Từ đầu tiên tự do; các từ sau phải nối theo **ký tự cuối** của từ trước.
- Từ đã dùng không được dùng lại.
- Kiểm tra từ hợp lệ **phía server**, không tin client.

## Chế độ có sẵn

1. **Basic**
   - Nối theo 1 ký tự cuối.

2. **Ban One Vowel**
   - Cấm `a/e/i/o/u`.
   - Host có thể chọn nguyên âm cụ thể hoặc để server chọn ngẫu nhiên khi bắt đầu.

3. **Hard Chain**
   - Nối theo **2 ký tự cuối** của từ trước.

## Công nghệ

- Client: React + Vite + TypeScript
- Server: Node.js + Express + Socket.IO + TypeScript
- Dictionary: `data/words_alpha.txt`
- Không dùng Supabase, không database, không tài khoản.

## Cách chạy local

```bash
npm install
npm --prefix client install
npm --prefix server install
npm run dev
```

Mở:
- Client: `http://localhost:5173`
- Server realtime: `http://localhost:3001`

## Build production

```bash
npm run build
npm start
```

Server sẽ tự serve file build của client.

## Deploy

Có thể deploy lên các nền tảng chạy Node server lâu dài như:
- Render
- Railway
- VPS
- Fly.io

Vì game dùng kết nối realtime Socket.IO, bản này phù hợp với **server Node chạy liên tục** hơn là serverless stateless.

## Biến môi trường

### `server/.env.example`
```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### `client/.env.example`
```env
VITE_SOCKET_URL=http://localhost:3001
```

Ở production cùng domain, có thể để `VITE_SOCKET_URL` trống.

## Luật chi tiết

### Chấm điểm
- Điểm nhận được = số ký tự của từ hợp lệ.
- `counterrevolutionary` = 20 điểm.

### Từ hợp lệ
- Chỉ chữ cái `a-z`.
- Có trong dictionary.
- Chưa từng xuất hiện trong phòng.
- Đúng quy tắc chain và mode.

### Thứ tự lượt
- Theo thứ tự vào phòng.
- Sau khi người chơi nhập từ hợp lệ, lượt chuyển sang người kế tiếp.

### Restart server
- Vì không dùng database, phòng đang chơi sẽ bị mất khi server restart.

## Deploy để người ngoài vào chơi

Xem file [`DEPLOY.md`](./DEPLOY.md) để deploy lên Render / Railway / Docker.
