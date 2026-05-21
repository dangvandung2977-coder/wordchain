# Deploy nhanh để người ngoài vào chơi

## Cách 1: Render / Railway

### Build command
```bash
npm install && npm --prefix client install && npm --prefix server install && npm run build
```

### Start command
```bash
npm start
```

### Environment variables
```env
PORT=3001
CLIENT_ORIGIN=https://TEN-DOMAIN-CUA-BAN
```

Ví dụ khi deploy xong ở:
```text
https://word-chain-demo.onrender.com
```

thì đặt:
```env
CLIENT_ORIGIN=https://word-chain-demo.onrender.com
```

## Cách 2: Docker

```bash
docker build -t english-word-chain .
docker run -p 3001:3001 -e CLIENT_ORIGIN=http://localhost:3001 english-word-chain
```

Sau đó mở:
```text
http://localhost:3001
```

## Lưu ý quan trọng
- Không có database.
- Phòng được lưu trong RAM của server.
- Server restart là các phòng đang chơi mất.
- Ai có link/mã phòng đều có thể vào trước khi trận bắt đầu.
