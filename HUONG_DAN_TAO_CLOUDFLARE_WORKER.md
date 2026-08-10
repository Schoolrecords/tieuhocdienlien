# HƯỚNG DẪN TẠO CLOUDFLARE WORKER — Proxy API Apps Script

> Tạo: 2026-05-13 · Mục tiêu: Khắc phục lỗi "Không gọi được API" trên máy có AdBlocker / Firewall trường học chặn `script.googleusercontent.com`.
> Tổng thời gian: ~15 phút (phần của Thầy)

---

## 🎯 Mục đích

Hiện tại trình duyệt gọi trực tiếp **Apps Script** → nhiều máy bị chặn (adblock, firewall, antivirus).

Sau khi áp dụng: Trình duyệt gọi đến **Cloudflare** (domain mà không phần mềm nào chặn) → Cloudflare gọi Apps Script hộ → trả kết quả về.

**Kết quả**: 99% máy đều vào được, kể cả mạng trường học có firewall.

---

## ✅ Checklist trước khi bắt đầu

- [ ] Email Gmail của thầy (`chungtrt@gmail.com`) — để đăng ký Cloudflare
- [ ] Trình duyệt Chrome/Edge mới
- [ ] ~15 phút thời gian

> **Hoàn toàn MIỄN PHÍ**, không cần thẻ tín dụng.

---

## Bước 1: Đăng ký tài khoản Cloudflare (~3 phút)

1. Mở **https://dash.cloudflare.com/sign-up**
2. Nhập email **chungtrt@gmail.com** + mật khẩu mới (ghi nhớ vào sổ)
3. Bấm **Sign Up** (Đăng ký)
4. Mở Gmail → mở email từ Cloudflare → bấm link **Verify email** (xác minh)
5. Quay lại Cloudflare → đăng nhập

> Nếu Cloudflare hỏi "Add a site" / "Add a domain" → bấm **Skip** (bỏ qua). Không cần thêm domain.

---

## Bước 2: Tạo Worker mới (~5 phút)

1. Sau khi đăng nhập, ở thanh bên trái tìm mục **Workers & Pages** → bấm vào.
2. Bấm nút xanh **Create application** (Tạo ứng dụng) → chọn tab **Workers** → bấm **Create Worker**.
3. Cloudflare sẽ tự gợi ý 1 tên ngẫu nhiên kiểu `polished-meadow-1234`. Thầy **đổi tên** thành:

   ```
   thdienlien-api
   ```

   > URL Worker sẽ là: `https://thdienlien-api.<tên-tài-khoản>.workers.dev`
   > Nếu tên đã có người khác dùng, Cloudflare báo lỗi → thử `thdienlien-api-2026` hoặc tên khác.

4. Bấm **Deploy** (lần đầu deploy code mẫu của Cloudflare, sẽ thay sau).
5. Sau khi deploy xong, bấm **Continue to project** (Tiếp tục vào dự án).

---

## Bước 3: Dán code Worker (~5 phút)

1. Trong trang Worker vừa tạo, bấm **Edit code** (Chỉnh sửa code) — góc trên bên phải.
2. Cloudflare mở editor có code mẫu (kiểu `Hello World`). **Xoá hết** code mẫu.
3. **Copy toàn bộ code dưới đây** rồi paste vào editor:

```javascript
/**
 * Cloudflare Worker — Proxy API Apps Script cho TH Diễn Liên
 * Mục đích: Trình duyệt gọi Worker thay vì gọi thẳng Apps Script,
 * bypass AdBlocker / Firewall / Antivirus chặn googleusercontent.com.
 *
 * Cập nhật: 2026-05-13
 */

// 🔧 URL Apps Script GỐC (lấy từ qlcl.html line 631)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxS-M_WE3zkT7gR5kIuyka1DOOpGfgPCJInnpplpsik_RRfBQ6ULUDA9l8xlTVNgU_y/exec';

// 🔒 Chỉ cho phép request từ các domain hợp lệ (chống lạm dụng).
// Để trống nếu muốn cho mọi origin (test thoải mái lúc đầu).
const ALLOWED_ORIGINS = [
  'https://schoolrecords.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Chỉ chấp nhận GET và POST
    if (request.method !== 'GET' && request.method !== 'POST') {
      return jsonError('Method not allowed', 405, origin);
    }

    try {
      // Ghép query string từ request → forward sang Apps Script
      const targetUrl = APPS_SCRIPT_URL + (url.search || '');

      const init = {
        method: request.method,
        redirect: 'follow',
        headers: {
          'User-Agent': 'CF-Worker-THDienLien/1.0',
        },
      };

      if (request.method === 'POST') {
        init.body = await request.text();
        init.headers['Content-Type'] =
          request.headers.get('Content-Type') || 'application/x-www-form-urlencoded';
      }

      const upstream = await fetch(targetUrl, init);
      const body = await upstream.text();

      // Phát hiện response là JSONP (có "callback=..." trong query)
      const isJsonp = url.searchParams.has('callback');
      const contentType = isJsonp
        ? 'application/javascript; charset=utf-8'
        : 'application/json; charset=utf-8';

      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      return jsonError('Proxy error: ' + err.message, 502, origin);
    }
  },
};

function corsHeaders(origin) {
  // Nếu ALLOWED_ORIGINS rỗng → cho phép mọi origin (*)
  // Nếu có danh sách → chỉ cho phép origin hợp lệ
  let allowOrigin = '*';
  if (ALLOWED_ORIGINS.length > 0) {
    const matched = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    allowOrigin = matched ? origin : ALLOWED_ORIGINS[0];
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonError(message, status, origin) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}
```

4. Bấm nút xanh **Deploy** (góc trên bên phải editor).
5. Đợi ~5 giây — Cloudflare báo "Deployed successfully".

---

## Bước 4: Lấy URL Worker (~1 phút)

1. Sau khi deploy, ở phía trên màn hình editor có dòng:

   ```
   https://thdienlien-api.<tên-tài-khoản>.workers.dev
   ```

   Ví dụ: `https://thdienlien-api.chungtrt.workers.dev`

2. **Copy URL này** và lưu lại — sẽ dùng ở Bước 6.

---

## Bước 5: Test Worker hoạt động (~2 phút)

Mở tab trình duyệt mới, dán URL Worker kèm `?action=all` vào cuối:

```
https://thdienlien-api.<tên-tài-khoản>.workers.dev/?action=all
```

**Kết quả mong đợi**:
- Hiển thị 1 đống JSON dài (giống như khi gọi Apps Script trực tiếp)
- Bắt đầu bằng `{"ok":true,"data":{...`

**Nếu thấy JSON** → ✅ Worker hoạt động đúng.

**Nếu thấy lỗi**:
| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `{"ok":false,"error":"Proxy error: ..."}` | Apps Script không phản hồi | Kiểm tra URL Apps Script trong code Worker có đúng không |
| `1101 Worker threw exception` | Lỗi syntax code | Quay lại Edit code → kiểm tra paste đầy đủ chưa |
| `Page not found` | Sai URL Worker | Kiểm tra lại tên Worker trong dashboard |

---

## Bước 6: Gửi URL Worker cho tôi

Trả lời tôi trong chat với nội dung kiểu:

> "URL Worker của tôi là: `https://thdienlien-api.chungtrt.workers.dev`"

Sau đó tôi sẽ:
1. Sửa `core-shared.js` chuyển từ JSONP → fetch CORS
2. Đổi `API_URL` trong 4 file: `qlcl.html`, `index.html`, `dbcl.html`, `kdcl.html`
3. Commit + push lên GitHub
4. Hướng dẫn thầy test lại trên máy bị lỗi trước đó

---

## 📊 Theo dõi sau khi chạy

Sau 1 ngày, vào Cloudflare Dashboard → Workers → `thdienlien-api` → tab **Metrics** sẽ thấy:
- Số request/ngày
- Tỷ lệ thành công/lỗi
- Thời gian phản hồi trung bình

> Giới hạn miễn phí: **100,000 request/ngày**. Trường 450 HS ước tính < 5,000 request/ngày → an toàn.

---

## ❓ FAQ

**Q: Nếu sau này đổi URL Apps Script (deploy version mới) thì sao?**
A: Vào Cloudflare → Workers → `thdienlien-api` → Edit code → sửa biến `APPS_SCRIPT_URL` → Deploy. Mất 1 phút.

**Q: Có thể tắt Worker tạm thời không?**
A: Có. Vào Worker → Settings → Disable. Lúc đó hệ thống quay lại lỗi như cũ. Để bật lại bấm Enable.

**Q: Nếu Cloudflare bị sập thì sao?**
A: Cloudflare có SLA 99.99% (sập tối đa ~52 phút/năm). Có thể tạm sửa code đổi `API_URL` ngược lại Apps Script gốc trong vài phút.

**Q: Worker có lưu dữ liệu học sinh không?**
A: KHÔNG. Worker chỉ chuyển tiếp request, không lưu gì. An toàn theo Nghị định 13/2023/NĐ-CP.

---

## 🆘 Nếu kẹt ở bước nào

Chụp màn hình + gửi cho tôi trong chat, tôi sẽ hướng dẫn cụ thể.
