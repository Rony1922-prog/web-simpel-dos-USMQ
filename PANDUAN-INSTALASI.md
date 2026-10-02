# Panduan Instalasi — SIMPEL-DOS USMQ (Backend GAS + Frontend GitHub Pages)

Aplikasi ini sekarang terbagi dua:
- **Backend** (`Kode.gs`) → Google Apps Script, berjalan sebagai REST API (JSON murni, tanpa tampilan).
- **Frontend** (folder ini: `index.html`, `css/`, `js/`) → situs statis, dideploy ke **GitHub Pages**.

Ikuti urutannya: **backend dulu**, catat URL-nya, baru **frontend**.

---

## BAGIAN 1 — Deploy Backend (Google Apps Script)

### Langkah 1 — Buat Proyek Apps Script
1. Buka https://script.google.com → **Proyek Baru**.
2. Hapus isi `Code.gs` bawaan, **ganti nama file menjadi `Kode.gs`**, tempel isi `Kode.gs` yang diberikan terpisah di chat (bukan di dalam ZIP ini).
3. Proyek ini **hanya butuh satu file** (`Kode.gs`) — tidak perlu file HTML apa pun lagi, karena tampilan sekarang ada di GitHub Pages, bukan di Apps Script.

### Langkah 2 — Aktifkan Layanan Lanjutan "Drive API"
Diperlukan untuk fitur impor Excel:
1. Klik **Layanan (Services)** di sidebar kiri editor → **+ Tambahkan Layanan** → pilih **Drive API** → **Tambah**.

### Langkah 3 — Jalankan Setup Otomatis
1. Pilih fungsi `setupAppEnvironment` di dropdown atas → **Jalankan (Run)**.
2. Setujui semua izin yang diminta (Lanjutan → Buka [nama proyek] (tidak aman) → Izinkan).
3. Lihat Log Eksekusi, pastikan muncul "✅ Setup selesai".

### Langkah 4 — Deploy sebagai Web App (API)
1. **Deploy** → **Deployment baru**.
2. Jenis: **Aplikasi Web (Web app)**.
3. **Execute as**: Saya (akun Anda). **Who has access**: Siapa saja (Anyone).
4. Klik **Deploy**, **salin URL `/exec`** yang muncul — ini **GAS_URL** yang dibutuhkan frontend.
5. Uji di browser: buka URL tersebut langsung. Harus muncul teks JSON seperti:
   ```json
   {"success":true,"data":{"status":"SIMPEL-DOS USMQ API aktif.","version":"v3.0-api"},"message":"OK"}
   ```
   Kalau ini muncul, backend sudah siap. **Ini normal** — tidak akan ada tampilan visual di sini, karena ini memang backend API saja.

> Setiap kali kode `Kode.gs` diubah, buat **Deployment baru** (Deploy → Kelola Deployment → Edit (pensil) → Version: New Version → Deploy) agar URL yang sama memuat kode terbaru.

---

## BAGIAN 2 — Deploy Frontend (GitHub Pages)

### Langkah 5 — Isi URL Backend
Sebelum melakukan apa pun di Git, buka file **`js/config.js`** di folder ini dengan Notepad/text editor, dan ganti:
```js
const GAS_URL = 'PASTE_URL_WEB_APP_GAS_DI_SINI';
```
menjadi URL `/exec` yang Anda salin di Langkah 4, contoh:
```js
const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```
Simpan filenya.

### Langkah 6 — Install Git (kalau belum ada)
- **Windows**: unduh di `https://git-scm.com/download/win`, install dengan pengaturan default, lalu buka **PowerShell**.
- **Mac**: buka Terminal, ketik `git --version` — kalau belum ada, macOS menawarkan instalasi otomatis.

Verifikasi:
```bash
git --version
```

### Langkah 7 — Buat Akun & Repository GitHub
1. Daftar di `https://github.com` kalau belum punya akun (username akan jadi bagian alamat situs: `username.github.io`).
2. Setup identitas Git (sekali saja):
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github-anda.com"
   ```
3. Di github.com: tombol **+** → **New repository** → beri nama (misal `simpel-dos-usmq`) → pilih **Public** → **JANGAN** centang README/.gitignore/license → **Create repository**. Biarkan halaman instruksinya tetap terbuka.

### Langkah 8 — Masuk ke Folder Ini & Push
**Penting:** pastikan Anda sudah **mengekstrak ZIP** dan berada **persis di folder yang berisi `index.html` ini** (bukan folder lain yang membungkusnya).

```bash
cd "lokasi/folder/hasil-ekstrak-zip-ini"
dir
```
*(Pastikan `index.html`, folder `css`, dan folder `js` terlihat langsung — bukan di dalam subfolder lagi.)*

Lalu jalankan satu per satu:
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
Ganti `USERNAME` dan `NAMA-REPO` sesuai repository Anda. Saat diminta Username/Password: Password diisi dengan **Personal Access Token** (bukan password akun biasa) — buat di `https://github.com/settings/tokens` → **Generate new token (classic)** → centang scope **repo** → Generate → salin token → tempel sebagai password (layar akan terlihat kosong saat mengetik, itu normal).

### Langkah 9 — Aktifkan GitHub Pages
1. Di repo GitHub Anda: **Settings** → **Pages** (sidebar kiri).
2. **Source**: Deploy from a branch. **Branch**: `main` / `(root)`. Centang **Enforce HTTPS**.
3. **Save**, tunggu 1-2 menit, refresh. Situs akan online di `https://USERNAME.github.io/NAMA-REPO/`.
4. Buka situsnya — halaman Masuk SIMPEL-DOS USMQ harus tampil dengan logo.

### Langkah 10 — Update Selanjutnya
Setiap ada perubahan file frontend, cukup:
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Kalau halaman masih terlihat lama, tekan **Ctrl+Shift+R** (hard refresh).

---

## Troubleshooting Singkat
| Gejala | Penyebab | Solusi |
|---|---|---|
| Situs 404 | `index.html` tidak di root repo | Pastikan `git init` dijalankan di folder yang berisi `index.html` langsung |
| Halaman tampil tapi polos tanpa gaya | Folder `css`/`js` tidak ikut ter-upload | Cek repo di GitHub: harus ada folder `css/` dan `js/`, bukan file rata di root |
| Login gagal / data tidak muncul sama sekali | `GAS_URL` di `js/config.js` belum diisi/salah | Buka Console browser (F12) untuk lihat pesan error, perbaiki `js/config.js`, commit & push ulang |
| `Password authentication is not supported` | GitHub menolak password biasa | Buat Personal Access Token, gunakan sebagai password |

Lihat juga catatan migrasi dan fitur-fitur lain pada `PANDUAN_INSTALASI.md` backend (bagian Data Mahasiswa, Matkul, dsb — tidak berubah, hanya cara deploy backend-nya yang berubah seperti di atas).
