# 🎬 NothingP • TMDB Tiếng Việt — Stremio & Nuvio Addon

Addon Catalog & Metadata dành cho **Stremio** và **Nuvio**, lấy dữ liệu trực tiếp từ **TMDB API** với ngôn ngữ **Tiếng Việt (`vi-VN`)** (tự động fallback sang `en-US` nếu phim chưa có mô tả tiếng Việt), chạy 100% trên **Cloudflare Workers**.

---

## 🌐 Link Addon Trực Tiếp (Cloudflare Workers)

- 📋 **Manifest URL (Cài vào Stremio / Nuvio)**:
  ```text
  https://tmdb-vi-addon.notthingp.workers.dev/manifest.json
  ```
- 🟣 **Cài đặt 1-chạm Stremio**: [Cài vào Stremio](stremio://tmdb-vi-addon.notthingp.workers.dev/manifest.json)
- 📍 **Giao diện Web Addon**: [https://tmdb-vi-addon.notthingp.workers.dev](https://tmdb-vi-addon.notthingp.workers.dev)
- 🐙 **GitHub Repository**: [https://github.com/anpham14121993-cloud/NothingP-TMDB-Vi](https://github.com/anpham14121993-cloud/NothingP-TMDB-Vi)

---

## 📑 3 Danh Mục (Catalogs)

1. **NothingP • Phim Mới Có Bản Phát Hành (Digital)** (`tmdb_digital_release`, type `movie`):
   - Lấy phim lẻ đã có bản phát hành kỹ thuật số (`with_release_type=4` trên TMDB) trong 90 ngày gần nhất, sắp xếp theo độ phổ biến.
   - Hỗ trợ lọc theo **Thể loại** (tiếng Việt), **Tìm kiếm** và phân trang (`skip`).
2. **NothingP • Trending Today - Phim Lẻ** (`tmdb_trending_movie_day`, type `movie`):
   - Top phim lẻ thịnh hành hôm nay trên TMDB (`/trending/movie/day`).
3. **NothingP • Trending Today - Phim Bộ** (`tmdb_trending_tv_day`, type `series`):
   - Top phim bộ thịnh hành hôm nay trên TMDB (`/trending/tv/day`).

---

## ✨ Tính Năng Metadata (`meta`)

- Hỗ trợ cả ID dạng `tmdb:<id>` và IMDb `tt<id>`.
- Tự động trả về `imdb_id` và `behaviorHints.defaultVideoId` để tương thích với các Addon nguồn phát (Torrentio, Nuvio Streams, Xem20, Fiml4K, PhimLongTieng...).
- Tối ưu tốc độ tải Meta nhờ Edge Cache đa tầng (`caches.default`), đồng bộ snapshot `imdb <-> tmdb`, rút gọn `append_to_response` khi đã có sẵn mô tả tiếng Việt, và pre-warm danh sách phim đầu trang.
- Hiển thị đầy đủ Poster, Backdrop HD, ClearLogo (`vi`/`en`), Thể loại tiếng Việt, Diễn viên, Đạo diễn, Biên kịch, Trailer YouTube và danh sách Tập phim (Seasons & Episodes, tối đa 8 mùa) cho phim bộ.

---

## 🚀 Chạy Local (Tùy chọn)

```bash
npm start
# Mở http://localhost:7000/manifest.json
```
