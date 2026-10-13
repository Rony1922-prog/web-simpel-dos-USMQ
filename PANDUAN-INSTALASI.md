## 🔄 Update ke v3.5-api (baca ini dulu kalau situs Anda SUDAH online)
File yang berubah: **`Kode.gs`** dan **`js/app.js`**.

**Langkah update:**
1. Tempel ulang `Kode.gs` → Deploy versi baru.
2. **Jalankan `setupAppEnvironment` sekali lagi** (ada kolom baru: `linkMeeting` dan `waktuMeeting` di sheet Pertemuan — aman, tidak menghapus data).
3. Timpa `js/app.js` → `git add . && git commit -m "Update v3.5-api" && git push` → Ctrl+Shift+R.

**Yang baru di v3.5-api — Meeting Online (Zoom/Google Meet/dll):**
- Di halaman **Presensi & Keaktifan**, setiap pertemuan sekarang punya kolom **tautan meeting** (tempel link Zoom, Google Meet, Teams, atau platform apa saja yang Anda pakai) dan **jam**-nya.
- Mahasiswa otomatis melihat tombol **"Gabung Meeting"** di menu Materi mereka, per pertemuan yang ada tautannya.
- Mahasiswa mendapat **notifikasi otomatis** begitu tautan meeting ditambahkan/diubah dosen.
- Di **Dashboard** (dosen) dan **Beranda** (mahasiswa) ada sorotan **"Meeting Hari Ini"** di bagian paling atas, menampilkan semua pertemuan yang jadwalnya hari ini dan punya tautan meeting, lengkap tombol "Gabung Sekarang".

> **Catatan jujur:** ini bukan integrasi API resmi Zoom/Google Meet (itu perlu akun developer terpisah, API key, dan biasanya berbayar) — melainkan tempat menyimpan & menampilkan tautan meeting yang sudah Anda buat sendiri di Zoom/Meet/dll, supaya mahasiswa tidak perlu dikirimi link manual lewat WhatsApp/grup lagi. Anda tetap membuat jadwal meeting-nya seperti biasa di aplikasi Zoom/Google Meet, lalu tempel link-nya ke sini.

---

## 🔄 Update ke v3.4-api (baca ini dulu kalau situs Anda SUDAH online)
File yang berubah: **`Kode.gs`** dan **`js/app.js`**. File lain tidak berubah.

**Langkah update:** tempel ulang `Kode.gs` → Deploy versi baru (tidak perlu jalankan `setupAppEnvironment` kali ini, tidak ada kolom baru). Timpa `js/app.js` → `git add . && git commit -m "Update v3.4-api" && git push` → Ctrl+Shift+R.

**Yang baru di v3.4-api:**
- **Navigasi antar menu lebih responsif.** Data yang sering dibaca berulang (daftar mata kuliah, data mahasiswa, semester) sekarang disimpan sebentar (±20 detik) di sisi server juga — bukan cuma di browser seperti sebelumnya — sehingga pembacaan dari Google Sheets yang biasanya lambat bisa dilewati. Otomatis dibersihkan setiap kali ada perubahan data (tambah/ubah/hapus) supaya tidak ada data basi.
- **Tombol "Lupa sandi?"** di halaman Masuk — baik dosen maupun mahasiswa bisa minta sandi sementara dikirim ke email yang terdaftar (kalau emailnya ada di data). Tidak perlu lagi selalu minta tolong direset manual.
- **Ikon mata (👁)** di semua kolom sandi di seluruh aplikasi — klik untuk menampilkan/menyembunyikan sandi yang sedang diketik, supaya tidak salah ketik.
- **Perbaikan bug tersembunyi:** tombol Aktif/Nonaktif mahasiswa di Data Mahasiswa ternyata tidak benar-benar berfungsi sebelumnya (hanya menampilkan pesan berhasil tanpa benar-benar mengubah status) — sudah diperbaiki.

---

## 🔄 Update ke v3.3.1-api — PERBAIKAN (wajib kalau tautan Scholar/SINTA/SISTER tidak bisa tersimpan)
Jika Anda sudah pasang v3.3-api tapi tautan Scholar/SINTA/SISTER tidak mau tersimpan, dan domain SINTA/SISTER yang terbuka error "This site can't be reached" — ini dua hal sekaligus:

1. **Tautan tidak tersimpan**: kolom data barunya belum terbentuk di database Anda. **Setelah deploy ulang `Kode.gs` versi ini, WAJIB jalankan sekali lagi fungsi `setupAppEnvironment`** dari editor Apps Script (dropdown fungsi → pilih `setupAppEnvironment` → Run). Ini aman, tidak menghapus data apa pun — hanya menambahkan kolom baru yang belum ada. Setelah itu baru coba simpan tautan lagi.
2. **Domain SINTA/SISTER error "tidak ditemukan"**: domain resminya memang baru saja pindah dari `kemdikbud.go.id` menjadi **`kemdiktisaintek.go.id`** (mengikuti perubahan nama Kementerian). Tautan bawaan di aplikasi sudah saya perbaiki ke domain baru ini di `js/app.js` — jadi pastikan Anda juga menimpa `js/app.js` dengan yang terbaru.

**Langkah lengkap:**
1. Backend: tempel ulang `Kode.gs` → Deploy versi baru → **jalankan `setupAppEnvironment` sekali lagi**.
2. Frontend: timpa `js/app.js` → `git add . && git commit -m "Fix v3.3.1-api" && git push`.
3. Ctrl+Shift+R di browser, lalu coba simpan tautan Scholar/SINTA/SISTER lagi di menu Portal Akademik.

---

## 🔄 Update ke v3.3-api (baca ini dulu kalau situs Anda SUDAH online)
File yang berubah: **`Kode.gs`** dan **`js/app.js`** saja. File lain tidak berubah, `GAS_URL` tetap dipakai.

**Langkah update:** sama seperti sebelumnya — tempel ulang `Kode.gs` di Apps Script lalu Deploy versi baru; timpa `js/app.js` di folder project lalu `git add . && git commit -m "Update v3.3-api" && git push`.

**Yang baru di v3.3-api:**
- **Topik 16 pertemuan bisa diisi sekaligus** saat unggah RPS — ketik 16 baris topik (satu baris = satu pertemuan, sesuai urutan RPS Anda), otomatis mengisi topik Pertemuan 1 s/d 16. Tidak perlu buka dan edit satu per satu lagi.
- **Menu "Portal Akademik" baru** (sidebar dosen) — pintasan satu-klik ke profil Google Scholar, SINTA, dan SISTER Anda (tempel tautannya sekali lewat tombol "Atur/ubah tautan profil saya"), plus tombol langsung ke direktori pencarian jurnal resmi SINTA.

> **Catatan jujur:** aplikasi ini tidak bisa benar-benar menyatukan login Scholar/SINTA/SISTER menjadi satu (itu sistem terpisah milik Google/Kemdikbud dengan autentikasi sendiri) — yang disediakan adalah tautan pintasan satu-klik. Begitu juga, daftar jurnal SINTA 1-6 beserta biaya publikasinya tidak disimpan di dalam aplikasi karena datanya sangat banyak dan sering berubah; tombol yang disediakan mengarah langsung ke direktori resmi SINTA supaya informasinya selalu akurat.

---

## 🔄 Update ke v3.2-api (baca ini dulu kalau situs Anda SUDAH online)
File yang berubah kali ini: **`Kode.gs`** (backend) dan **`js/app.js`** saja (frontend). `index.html`, `css/style.css`, `js/config.js`, `js/api.js` **tidak berubah** — `GAS_URL` Anda tetap dipakai.

**Langkah update:**
1. **Backend**: tempel ulang `Kode.gs` yang baru di proyek Apps Script Anda → **Deploy → Kelola Deployment → Edit (pensil) → Version: New Version → Deploy**.
2. **Frontend**: timpa hanya file **`js/app.js`** dari ZIP baru ini ke folder project Anda.
3. Di PowerShell, folder project seperti biasa:
   ```powershell
   git add .
   git commit -m "Update ke v3.2-api"
   git push
   ```
4. Buka situsnya, **Ctrl+Shift+R** untuk hard refresh.

**Yang baru di v3.2-api:**
- **RPS otomatis muncul di setiap pertemuan.** Setelah Anda unggah RPS sekali di menu Materi & RPS, file itu otomatis tersedia sebagai panduan di SEMUA 16 pertemuan — tidak perlu lagi upload materi satu per satu kalau isinya sudah tercakup di RPS. Materi tambahan per pertemuan tetap bisa diunggah seperti biasa untuk melengkapi.
- **Halaman "Materi" baru untuk mahasiswa** (sebelumnya belum ada sama sekali di sisi mahasiswa — ini kekurangan dari versi lama yang sudah diperbaiki). Mahasiswa sekarang punya menu Materi di navigasi bawah, bisa melihat dan mengunduh materi/RPS per pertemuan untuk setiap mata kuliah yang diambilnya.
- **Nada dering notifikasi.** Mahasiswa (dan dosen) sekarang akan mendengar bunyi notifikasi singkat saat ada tugas baru, materi baru, nilai keluar, dll — selama aplikasi sedang terbuka di tab browser (dicek otomatis tiap 30 detik). Catatan: karena kebijakan browser, suara baru aktif setelah pengguna pertama kali mengetuk/klik layar (ini wajar dan hanya berlaku sekali per sesi).

---

## 🔄 Update ke v3.1-api (baca ini dulu kalau situs Anda SUDAH online)
File yang berubah kali ini: **`Kode.gs`** (backend) dan **`js/app.js`, `js/api.js`** (frontend). File `index.html`, `css/style.css`, `js/config.js` **tidak berubah** — artinya **`GAS_URL` yang sudah Anda isi sebelumnya TETAP DIPAKAI, tidak perlu diisi ulang.**

**Langkah update (lebih singkat dari instalasi pertama):**
1. **Backend**: buka proyek Apps Script Anda yang sudah ada → tempel ulang isi `Kode.gs` yang baru → **Deploy → Kelola Deployment → Edit (pensil) → Version: New Version → Deploy** (URL `/exec` tetap sama).
2. **Frontend**: salin file `js/app.js` dan `js/api.js` dari ZIP baru ini, **timpa** file lama di folder project Anda (folder yang sama tempat Anda `git init` sebelumnya). **Jangan timpa `js/config.js`** (biarkan yang lama, sudah ada URL Anda).
3. Di PowerShell, masuk ke folder project seperti biasa, lalu:
   ```powershell
   git add .
   git commit -m "Update ke v3.1-api"
   git push
   ```
4. Tunggu 1 menit, buka situs Anda, tekan **Ctrl+Shift+R** (hard refresh) untuk memastikan bukan versi lama yang ter-cache browser.

**Yang baru di v3.1-api:**
- Navigasi antar menu terasa lebih cepat (data yang sering dipakai disimpan sementara di browser).
- Dosen baru bisa mendaftar sendiri lewat tautan "Daftar di sini" di halaman Masuk — setiap dosen punya data mata kuliah & mahasiswa bimbingan sendiri-sendiri, tidak campur dengan dosen lain.

---

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
