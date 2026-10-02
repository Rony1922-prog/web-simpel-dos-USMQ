# SIMPEL-DOS USMQ — Frontend

Frontend statis (HTML/CSS/JS murni) untuk SIMPEL-DOS USMQ, dideploy ke GitHub Pages.
Backend (Google Apps Script) terpisah — lihat `PANDUAN-INSTALASI.md`.

## ⚠️ Sebelum deploy
Isi `js/config.js` dengan URL Web App GAS Anda (`GAS_URL`) **sebelum** push pertama ke GitHub.

## Struktur
```
index.html
css/style.css
js/config.js   ← isi GAS_URL di sini
js/api.js      ← jembatan fetch() ke backend
js/app.js      ← seluruh logika aplikasi
```
