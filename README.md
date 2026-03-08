# 全球天氣平台（靜態部署版）

## 專案介紹

這是一個純前端（HTML/CSS/JavaScript）的全球天氣平台，整合：

- 城市搜尋與 Open-Meteo 天氣查詢
- Leaflet 世界地圖點擊查詢
- 多城市比較（最多 5 個）
- 最近查詢、深色模式、定位查詢

專案可直接以靜態網站方式部署到 GitHub Pages、Vercel、Netlify。

## 功能列表

- 城市關鍵字搜尋（支援 Enter）
- 候選城市清單選擇
- 世界地圖互動點擊查詢（含 marker）
- reverse geocoding 顯示城市與國家（可用時）
- 主天氣資訊 + 未來 7 天預報
- 多城市比較卡片（新增、移除、點擊切換）
- 最近查詢（localStorage）
- 深色模式切換（localStorage）
- 使用我的位置（Geolocation）
- 響應式版面（桌機/手機）

## 本機執行方式

1. 進入專案資料夾。
2. 直接開啟首頁：

```powershell
start index.html
```

首頁入口為 `index.html`，所有資源皆為相對路徑：

- `style.css`
- `script.js`

## GitHub 上傳方式

1. 在 GitHub 建立新 repository（例如：`weather-platform`）。
2. 在專案資料夾執行：

```powershell
git init
git add .
git commit -m "feat: static weather platform ready for deploy"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<你的repo>.git
git push -u origin main
```

## Vercel 部署方式

1. 到 Vercel 匯入 GitHub repository。
2. Framework Preset 選 `Other` 或保持 Auto。
3. Build Command 留空。
4. Output Directory 留空（專案根目錄）。
5. Deploy。

本專案已提供 `vercel.json`，可直接部署靜態頁面。

## Netlify 部署方式

1. 到 Netlify 建立新站點並連接 GitHub repository。
2. Build command 留空。
3. Publish directory 設為 `.`（根目錄）。
4. Deploy。

本專案已提供 `netlify.toml`，預設 publish 目錄為專案根目錄。
