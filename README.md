# Lumi Glide

Game bay lượn dành cho trẻ em, chạy thẳng trên trình duyệt (HTML5 canvas, không cần cài thêm gì, không có file ảnh hay âm thanh nào).
Tên game chỉ là tên tạm, xem phần "Đổi tên game" bên dưới.

## Chạy thử

Mở file `index.html` bằng trình duyệt. Khi chạy ở máy cá nhân, Poki SDK không tải được nên game vẫn chơi bình thường và quảng cáo bị bỏ qua.

## Cách chơi

- **Giữ** chuột / ngón tay / phím Space hoặc ↑ để bay lên, **thả** ra để rơi.
- Nhặt ⭐ (mỗi sao +1, dùng để mua nhân vật), né cột gai và các chướng ngại.
- Vật phẩm bay giữa các cột:
  - 🛡️ khiên chịu 1 lần va chạm.
  - 🌈 siêu tốc 4 giây, bay xuyên qua mọi thứ.
  - 🧲 nam châm hút sao trong 8 giây.
  - ✨ sao x2: mỗi sao +2 trong 8 giây.
- Chướng ngại: bóng gai (từ điểm 4), dơi (7), thanh xoay (12), thiên thạch (18).
- 5 thế giới đổi màu mỗi 10 điểm.
- **Boss** xuất hiện ở điểm 15, sau đó cách nhau khoảng 20 điểm. Cột biến mất, chỉ cần sống sót đến khi thanh của boss cạn. Boss sau mạnh hơn và đánh lâu hơn. Thắng được +5 điểm và sao thưởng.
- Nhân vật mở khóa bằng sao ở màn hình chính (32 loại, giá 50 đến 1000 sao).

## Các file

| File | Nội dung |
|---|---|
| `index.html` | Khung trang, màn hình bắt đầu / kết thúc |
| `style.css` | Giao diện |
| `game.js` | Toàn bộ logic game, vẽ hình, âm thanh |

## Poki

- SDK được nạp trong `index.html`. Trong `game.js` đã gọi sẵn: `init`, `gameLoadingFinished`, `gameplayStart`, `gameplayStop`, `commercialBreak` (quảng cáo giữa các lượt, không chạy trước lượt đầu), `rewardedBreak` (nút "HỒI SINH", mỗi lượt một lần).
- Khi quảng cáo chạy, âm thanh game được tắt tiếng.
- Nút hồi sinh chỉ hiện khi có Poki SDK, nên cần kiểm tra lại trong môi trường Poki thật (bản thử nghiệm của Poki).

## Lưu dữ liệu

Lưu bằng `localStorage` của trình duyệt (kỷ lục, số sao, nhân vật đã mở, tắt/bật tiếng). Xóa dữ liệu trình duyệt hoặc đổi máy thì mất. Sao được lưu ngay khi nhặt.

## Chỉnh độ khó và giá

Tất cả nằm trong `game.js`:

| Muốn chỉnh | Tìm |
|---|---|
| Lực bay / rơi | `PHYS` |
| Tốc độ, khoảng cách cột | `const S` và `update()` (`S.speed`, `S.dist`) |
| Độ rộng khe giữa cột | `addObstacle()` (`const gap`) |
| Chướng ngại xuất hiện từ điểm nào | `spawnHazard()` |
| Boss: điểm xuất hiện, độ dài trận, đạn | `boss` (`next: 15`), `updateBoss()`, `attack()` |
| Giá, danh sách nhân vật | `SKINS` |
| Màu các thế giới | `WORLDS` |

## Đổi tên game

Đổi ở 3 chỗ: thẻ `<title>` và chữ logo (`LUMI` / `GLIDE`) trong `index.html`. Không nên đổi các khóa lưu trong `game.js` (`lumiGlideSave`, `lumiGlideBest`, `lumiGlideMuted`), vì đổi thì người chơi cũ mất sao và nhân vật.

## Bản quyền

- Mã nguồn, hình vẽ và âm thanh (tổng hợp bằng WebAudio) đều do dự án tự tạo, không dùng tài nguyên của game khác.
- Nhân vật, vật phẩm và boss dùng **emoji** do phông chữ của thiết bị vẽ ra, nên hình sẽ hơi khác nhau giữa các máy. Muốn đồng nhất và chắc chắn về giấy phép, có thể thay bằng hình tự vẽ hoặc bộ emoji mã nguồn mở (như Noto Emoji hoặc Twemoji, ghi nguồn đúng giấy phép).
- Trước khi đăng, nên tìm tên game trên Google, Poki, Google Play và App Store để tránh trùng.
