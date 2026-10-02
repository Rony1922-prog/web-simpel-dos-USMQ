
/* ============================================================
   SIMPEL-DOS USMQ — Frontend (JavaScript.html)
   ============================================================ */

const App = {
  token: null, role: null, username: null, nama: null, dosenId: null, nim: null,
  fotoDataUri: '', logoDataUri: '', currentPage: null, currentParams: {},
  pengaturan: null
};
const Charts = {};

// callServer() kini didefinisikan di js/api.js (fetch ke GAS REST API)

function showToast(title, message, type) {
  const colors = { success: '#0A5A2B', danger: '#DC2626', warning: '#F59E0B', info: '#0284C7' };
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.style.background = colors[type] || colors.info;
  el.innerHTML = `<div class="font-semibold text-sm mb-0.5">${title}</div><div class="opacity-90">${message}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3800);
}

function openModal(innerHtml, maxWidth) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop-app';
  wrap.id = 'activeModal';
  wrap.innerHTML = `<div class="modal-card" style="max-width:${maxWidth || '640px'}">${innerHtml}</div>`;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeModal(); });
  document.getElementById('modalHost').appendChild(wrap);
}
function closeModal() { const m = document.getElementById('activeModal'); if (m) m.remove(); }

function setLoading(btnEl, loading, originalHtml) {
  if (!btnEl) return;
  if (loading) { btnEl.dataset.original = btnEl.innerHTML; btnEl.innerHTML = '<span class="spinner spinner-sm" style="border-color:#ffffff55;border-top-color:#fff;"></span> Menyimpan...'; btnEl.disabled = true; }
  else { btnEl.innerHTML = btnEl.dataset.original || originalHtml || btnEl.innerHTML; btnEl.disabled = false; }
}

function esc(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function fmtDate(d) { if (!d) return '-'; const dt = new Date(d); if (isNaN(dt)) return String(d); return dt.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); }
function fmtDateTime(d) { if (!d) return '-'; const dt = new Date(d); if (isNaN(dt)) return String(d); return dt.toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
function n2(v) { return (v === null || v === undefined || v === '') ? '-' : Number(v).toFixed(2); }

function hurufBadgeClass(huruf) {
  if (!huruf) return 'bg-surface-mint-tint text-on-surface-variant';
  if (huruf === 'A') return 'bg-surface-mint-tint text-primary';
  if (huruf === 'B+' || huruf === 'B') return 'bg-tertiary-container/10 text-tertiary';
  if (huruf === 'C+' || huruf === 'C') return 'bg-status-warning/15 text-status-warning';
  return 'bg-error-container text-error';
}

// ── Unduh file dari base64 ──
function downloadBase64(base64, fileName, mime) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime || 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Kompres foto (untuk foto profil) agar muat di sel spreadsheet
function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxSize / Math.max(w, h));
      canvas.width = w * scale; canvas.height = h * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality || 0.6));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// ROUTER SPA
// ============================================================
function navigateTo(page, params) {
  App.currentPage = page; App.currentParams = params || {};
  updateActiveNav(page);
  const container = document.getElementById('app-container');
  container.innerHTML = renderSkeleton();
  window.scrollTo(0, 0);
  PAGES[page] ? PAGES[page](params || {}) : (container.innerHTML = '<p class="text-on-surface-variant">Halaman tidak ditemukan.</p>');
}

function renderSkeleton() {
  return `<div class="space-y-4">
    <div class="skeleton h-24 w-full"></div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">${'<div class="skeleton h-28"></div>'.repeat(4)}</div>
    <div class="skeleton h-64 w-full"></div>
  </div>`;
}

function updateActiveNav(page) {
  document.querySelectorAll('[data-navpage]').forEach(el => {
    const active = el.dataset.navpage === page;
    el.classList.toggle('bg-primary-container', active);
    el.classList.toggle('text-on-primary', active);
    el.classList.toggle('text-on-surface-variant', !active);
  });
}

// ============================================================
// INISIALISASI APLIKASI
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const cfg = await callServer('getPublicInfo').catch(() => null);
    if (cfg && cfg.success) { App.logoDataUri = cfg.data.logoDataUri; App.version = cfg.data.version; }
  } catch (e) {}

  const savedToken = localStorage.getItem('simpeldos_token');
  if (savedToken) {
    const session = await callServer('validateSession', savedToken).catch(() => null);
    if (session) {
      hydrateSession(savedToken, session);
      hideLoadingOverlay();
      navigateTo(session.role === 'dosen' ? 'dashboard' : 'beranda');
      return;
    } else {
      localStorage.removeItem('simpeldos_token');
    }
  }
  hideLoadingOverlay();
  renderLoginScreen();
});

function hideLoadingOverlay() {
  const el = document.getElementById('loadingOverlay');
  if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('Terjadi Kesalahan', 'Sesuatu gagal dimuat: ' + (event.reason && event.reason.message ? event.reason.message : event.reason), 'danger');
});

function hydrateSession(token, session) {
  App.token = token; App.role = session.role; App.username = session.username;
  App.nama = session.nama; App.dosenId = session.dosenId; App.nim = session.nim;
  App.fotoDataUri = session.fotoDataUri || '';
  document.getElementById('mainContent').className = 'md:pl-72 pt-16 pb-20 md:pb-8 min-h-screen';
  document.getElementById('app-container').className = 'px-4 md:px-gutter-desktop py-5 max-w-[1400px] mx-auto';
  renderSidebar(); renderBottomNav(); renderTopHeader();
}

function doLogoutFlow() {
  callServer('logoutUser', App.token).finally(() => {
    localStorage.removeItem('simpeldos_token');
    location.reload();
  });
}


// ============================================================
// SIDEBAR / HEADER / BOTTOM NAV
// ============================================================
const NAV_DOSEN = [
  { page: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { page: 'semesterMk', label: 'Semester & Mata Kuliah', icon: 'menu_book' },
  { page: 'presensi', label: 'Presensi & Keaktifan', icon: 'how_to_reg' },
  { page: 'materiRps', label: 'Materi & RPS', icon: 'folder_open' },
  { page: 'tugas', label: 'Tugas Mahasiswa', icon: 'assignment' },
  { page: 'penilaian', label: 'Penilaian (UTS/UAS)', icon: 'rate_review' },
  { page: 'rekapKhs', label: 'Rekap & Cetak KHS', icon: 'print' },
  { page: 'dataMahasiswa', label: 'Data Mahasiswa', icon: 'group' },
  { page: 'pengaturan', label: 'Pengaturan', icon: 'settings' }
];
const NAV_MAHASISWA_BOTTOM = [
  { page: 'beranda', label: 'Beranda', icon: 'home' },
  { page: 'presensiSaya', label: 'Presensi', icon: 'how_to_reg' },
  { page: 'tugasSaya', label: 'Tugas', icon: 'assignment' },
  { page: 'nilaiKhs', label: 'Nilai/KHS', icon: 'school' },
  { page: 'profil', label: 'Profil', icon: 'person' }
];

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (App.role !== 'dosen') { sidebar.innerHTML = ''; sidebar.classList.add('force-hide'); return; }
  sidebar.classList.remove('force-hide');
  toggleMobileSidebar(false); // pastikan drawer tertutup saat pertama kali render (di HP)
  const items = NAV_DOSEN.map(i => `
    <a href="javascript:void(0)" onclick="navigateTo('${i.page}'); toggleMobileSidebar(false);" data-navpage="${i.page}"
       class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-on-surface-variant hover:bg-surface-mint-tint hover:text-on-surface transition-colors">
      <span class="material-symbols-outlined text-primary text-[20px]">${i.icon}</span><span>${esc(i.label)}</span>
    </a>`).join('');
  sidebar.innerHTML = `
    <div class="flex flex-col">
      <div class="px-6 py-5 flex items-center gap-3">
        <img src="${App.logoDataUri}" class="h-10 w-auto object-contain" alt="Logo USMQ">
        <div class="flex flex-col min-w-0">
          <span class="font-display text-base text-primary font-bold leading-tight truncate">SIMPEL-DOS</span>
          <span class="text-[11px] text-on-surface-variant truncate">Universitas Syekh Maulana Qori</span>
        </div>
      </div>
      <div class="px-4 py-2"><span class="px-3 text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Navigasi Akademik</span></div>
      <nav class="px-3 space-y-1">${items}</nav>
    </div>
    <div class="p-4">
      <button onclick="doLogoutFlow()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-status-error hover:bg-error-container transition-colors">
        <span class="material-symbols-outlined text-[20px]">logout</span> Keluar
      </button>
    </div>`;
}

function renderBottomNav() {
  const nav = document.getElementById('bottomNav');
  if (App.role !== 'mahasiswa') { nav.classList.add('force-hide'); nav.innerHTML = ''; return; }
  nav.classList.remove('force-hide');
  nav.innerHTML = NAV_MAHASISWA_BOTTOM.map(i => `
    <a href="javascript:void(0)" onclick="navigateTo('${i.page}')" data-navpage="${i.page}"
       class="flex-1 flex flex-col items-center justify-center gap-0.5 text-on-surface-variant text-[11px] font-medium py-1.5">
      <span class="material-symbols-outlined text-[22px]">${i.icon}</span>${esc(i.label)}
    </a>`).join('');
}

function toggleMobileSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (show) {
    sidebar.classList.remove('-translate-x-full'); sidebar.classList.add('translate-x-0');
    backdrop.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full'); sidebar.classList.remove('translate-x-0');
    backdrop.classList.add('hidden');
  }
}

function renderTopHeader() {
  const header = document.getElementById('topHeader');
  const fotoSrc = App.fotoDataUri || placeholderAvatar();
  header.innerHTML = `
    <div class="flex items-center gap-3 flex-1 max-w-md">
      ${App.role === 'dosen' ? `<button onclick="toggleMobileSidebar(true)" class="md:hidden p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-mint-tint"><span class="material-symbols-outlined text-[24px]">menu</span></button>` : ''}
      ${App.role === 'mahasiswa' ? `<img src="${App.logoDataUri}" class="h-8 w-auto md:hidden">` : ''}
      <div class="relative w-full hidden sm:block">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
        <input id="globalSearch" class="w-full pl-9 pr-4 py-2 bg-surface-canvas rounded-lg text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container" placeholder="Cari...">
      </div>
      <span class="font-display font-bold text-primary text-sm sm:hidden">SIMPEL-DOS</span>
    </div>
    <div class="flex items-center gap-3 md:gap-4">
      <button onclick="navigateTo('notifikasi')" class="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-mint-tint transition-colors">
        <span class="material-symbols-outlined text-[22px]">notifications</span>
        <span id="notifDot" class="hidden absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-error"></span>
      </button>
      <div class="flex items-center gap-2 pl-1 cursor-pointer" onclick="navigateTo('profil')">
        <img src="${fotoSrc}" class="w-8 h-8 rounded-full object-cover border border-border-subtle">
        <div class="hidden md:flex flex-col text-left leading-tight">
          <span class="text-sm font-semibold">${esc(App.nama)}</span>
          <span class="text-[11px] text-on-surface-variant">${App.role === 'dosen' ? 'NIDN: ' + esc(App.username) : 'NIM: ' + esc(App.username)}</span>
        </div>
      </div>
      ${App.role === 'dosen' ? '' : `<button onclick="doLogoutFlow()" class="hidden md:block p-2 rounded-lg text-status-error hover:bg-error-container"><span class="material-symbols-outlined text-[20px]">logout</span></button>`}
    </div>`;
  refreshNotifDot();
}

function placeholderAvatar() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="%23EBF5EE"/><text x="32" y="40" font-size="26" text-anchor="middle" fill="%230A5A2B" font-family="Arial">${(App.nama||'?').charAt(0).toUpperCase()}</text></svg>`);
}

async function refreshNotifDot() {
  const res = await callServer('listNotifikasi', App.token).catch(() => null);
  if (res && res.success) {
    const unread = res.data.filter(n => !n.dibaca).length;
    const dot = document.getElementById('notifDot');
    if (dot) dot.classList.toggle('hidden', unread === 0);
  }
}

// ============================================================
// LOGIN
// ============================================================
function renderLoginScreen() {
  document.getElementById('sidebar').classList.add('force-hide');
  document.getElementById('bottomNav').classList.add('force-hide');
  document.getElementById('topHeader').innerHTML = '';
  document.getElementById('mainContent').className = 'min-h-screen';
  document.getElementById('app-container').className = 'w-full min-h-screen flex items-center justify-center px-4';
  document.getElementById('app-container').innerHTML = `
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-6">
        <img src="${App.logoDataUri || ''}" class="h-20 w-auto mb-3">
        <h1 class="font-display text-xl font-bold text-primary text-center">SIMPEL-DOS USMQ</h1>
        <p class="text-xs text-on-surface-variant text-center mt-1">Sistem Informasi Manajemen Pembelajaran Dosen<br>Universitas Syekh Maulana Qori</p>
      </div>
      <div class="bg-surface-card rounded-xl shadow-sm p-6">
        <form id="loginForm" class="space-y-4" onsubmit="return handleLogin(event)">
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Username (NIM / NIDN)</label>
            <input required id="loginUsername" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-surface-mint-tint" placeholder="Masukkan NIM atau NIDN">
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface-variant mb-1">Sandi</label>
            <input required type="password" id="loginPassword" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-surface-mint-tint" placeholder="Masukkan sandi">
          </div>
          <p id="loginError" class="text-status-error text-xs hidden"></p>
          <button type="submit" id="loginBtn" class="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm py-2.5 rounded-lg transition-colors">Masuk</button>
        </form>
        <p class="text-[11px] text-on-surface-variant text-center mt-4">Sandi awal mahasiswa = NIM. Anda akan diminta mengganti sandi saat pertama kali masuk.</p>
      </div>
      <p class="text-center text-[10px] text-outline mt-3">Versi build: ${App.version || '-'}</p>
    </div>`;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  setLoading(btn, true);
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await callServer('doLogin', username, password);
    setLoading(btn, false);
    if (!res.success) { errEl.textContent = res.message; errEl.classList.remove('hidden'); return false; }
    localStorage.setItem('simpeldos_token', res.data.token);
    hydrateSession(res.data.token, { role: res.data.role, username: res.data.username, nama: res.data.nama, dosenId: res.data.profile && res.data.profile.id, nim: res.data.profile && res.data.profile.nim, fotoDataUri: res.data.fotoDataUri });
    if (res.data.mustChangePassword) { showForcedChangePassword(); }
    else { navigateTo(res.data.role === 'dosen' ? 'dashboard' : 'beranda'); }
  } catch (err) {
    setLoading(btn, false);
    errEl.textContent = 'Terjadi kesalahan: ' + (err.message || err);
    errEl.classList.remove('hidden');
  }
  return false;
}

function showForcedChangePassword() {
  openModal(`
    <div class="p-6">
      <h3 class="font-display font-bold text-lg mb-1">Ganti Sandi Wajib</h3>
      <p class="text-sm text-on-surface-variant mb-4">Ini adalah masuk pertama Anda. Silakan buat sandi baru sebelum melanjutkan.</p>
      <form onsubmit="return submitForcedChangePassword(event)" class="space-y-3">
        <input required type="password" id="newPass1" minlength="4" placeholder="Sandi baru" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <input required type="password" id="newPass2" minlength="4" placeholder="Ulangi sandi baru" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <p id="cpError" class="text-status-error text-xs hidden"></p>
        <button id="cpBtn" class="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold text-sm py-2.5 rounded-lg">Simpan & Lanjutkan</button>
      </form>
    </div>`, '420px');
}

async function submitForcedChangePassword(e) {
  e.preventDefault();
  const p1 = document.getElementById('newPass1').value, p2 = document.getElementById('newPass2').value;
  const err = document.getElementById('cpError');
  if (p1 !== p2) { err.textContent = 'Sandi tidak sama.'; err.classList.remove('hidden'); return false; }
  const btn = document.getElementById('cpBtn'); setLoading(btn, true);
  const res = await callServer('changePassword', App.token, null, p1);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); navigateTo(App.role === 'dosen' ? 'dashboard' : 'beranda'); }
  else { err.textContent = res.message; err.classList.remove('hidden'); }
  return false;
}


// ============================================================
// REGISTRY HALAMAN (SPA)
// ============================================================
const PAGES = {};

function pageHeader(title, subtitle, actionHtml) {
  return `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
    <div>
      <h1 class="font-display text-xl md:text-2xl font-bold text-on-surface">${esc(title)}</h1>
      ${subtitle ? `<p class="text-sm text-on-surface-variant mt-0.5">${subtitle}</p>` : ''}
    </div>
    ${actionHtml || ''}
  </div>`;
}

function metricCard(icon, label, value, sub, colorClass) {
  return `<div class="bg-surface-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
    <div class="w-10 h-10 rounded-xl ${colorClass || 'bg-surface-mint-tint text-primary'} flex items-center justify-center">
      <span class="material-symbols-outlined text-[22px]">${icon}</span>
    </div>
    <p class="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold mt-4">${esc(label)}</p>
    <p class="font-display text-2xl font-bold text-on-surface mt-1">${value}</p>
    ${sub ? `<p class="text-xs text-on-surface-variant mt-1">${sub}</p>` : ''}
  </div>`;
}

function emptyState(icon, text) {
  return `<div class="flex flex-col items-center justify-center py-10 text-on-surface-variant">
    <span class="material-symbols-outlined text-[36px] mb-2 opacity-50">${icon}</span>
    <p class="text-sm">${text}</p>
  </div>`;
}

function searchInput(id, placeholder, onInput) {
  return `<div class="relative w-full sm:w-72">
    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
    <input id="${id}" oninput="${onInput}" class="w-full pl-9 pr-3 py-2 bg-surface-canvas rounded-lg text-sm border border-border-subtle focus:ring-1 focus:ring-primary-container" placeholder="${esc(placeholder)}">
  </div>`;
}

// ============================================================
// DASHBOARD DOSEN
// ============================================================
PAGES.dashboard = async function () {
  const c = document.getElementById('app-container');
  const [dash, mkRes] = await Promise.all([callServer('getDashboardDosen', App.token), callServer('listMataKuliah', App.token)]);
  if (!dash.success) { c.innerHTML = errBox(dash.message); return; }
  const d = dash.data;
  c.innerHTML = pageHeader('Selamat Datang, Bapak/Ibu ' + esc(App.nama) + '!', 'Sistem Informasi Manajemen Pembelajaran Dosen — Universitas Syekh Maulana Qori') + `
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      ${metricCard('group', 'Total Mahasiswa Bimbingan', d.totalMahasiswa, 'Dari seluruh mata kuliah ampuan')}
      ${metricCard('menu_book', 'Total Mata Kuliah Ampuan', d.totalMk, 'Semester berjalan', 'bg-surface-container text-tertiary')}
      ${metricCard('how_to_reg', 'Rata-rata Kehadiran', n2(d.rataKehadiran) + '%', 'Akumulasi seluruh pertemuan')}
      ${metricCard('rate_review', 'Tugas Perlu Dinilai', d.perluDinilai, 'Menunggu penilaian', 'bg-status-warning/15 text-status-warning')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-surface-card rounded-xl p-5 shadow-sm">
        <h3 class="font-display font-bold mb-3">Sebaran Nilai Akhir (Dipublikasikan)</h3>
        <canvas id="chartSebaran" height="200"></canvas>
      </div>
      <div class="bg-surface-card rounded-xl p-5 shadow-sm">
        <h3 class="font-display font-bold mb-3">Mahasiswa Belum Mengumpulkan Tugas</h3>
        ${d.belumKumpul.length ? `<div class="overflow-x-auto"><table class="data-table w-full text-sm"><thead><tr class="text-left text-on-surface-variant text-xs uppercase">
          <th class="py-2">Mahasiswa</th><th>Tugas</th><th>Batas</th></tr></thead><tbody>
          ${d.belumKumpul.map(b => `<tr class="border-t border-border-subtle"><td class="py-2">${esc(b.nama)}<div class="text-xs text-on-surface-variant">${esc(b.nim)}</div></td><td>${esc(b.tugas)}</td><td class="text-xs">${esc(b.batasWaktu)}</td></tr>`).join('')}
        </tbody></table></div>` : emptyState('task_alt', 'Semua tugas sudah dikumpulkan.')}
      </div>
    </div>
    <div class="bg-surface-card rounded-xl p-5 shadow-sm">
      <h3 class="font-display font-bold mb-3">Mata Kuliah Ampuan</h3>
      ${mkRes.success && mkRes.data.length ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${mkRes.data.map(mk => `<div class="border border-border-subtle rounded-xl p-4">
          <p class="font-semibold text-sm">${esc(mk.namaMk)}</p>
          <p class="text-xs text-on-surface-variant mt-1">${esc(mk.programStudi)} · Semester ${esc(mk.semesterMhs)} · Kelas ${esc(mk.kelas)}</p>
          <p class="text-xs text-on-surface-variant">${esc(mk.semesterLabel)}</p>
        </div>`).join('')}
      </div>` : emptyState('menu_book', 'Belum ada mata kuliah. Tambahkan di menu Semester & Mata Kuliah.')}
    </div>`;

  const ctx = document.getElementById('chartSebaran');
  if (Charts.sebaran) Charts.sebaran.destroy();
  const labels = Object.keys(d.sebaranHuruf);
  // requestAnimationFrame: memastikan tata letak (grid/flex) sudah selesai dihitung browser
  // sebelum Chart.js mengukur ukuran canvas, supaya grafik tidak salah ukur di render pertama.
  requestAnimationFrame(() => {
    Charts.sebaran = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: labels.length ? labels : ['Belum ada data'], datasets: [{ data: labels.length ? Object.values(d.sebaranHuruf) : [1], backgroundColor: ['#0A5A2B', '#6DB31B', '#0284C7', '#F59E0B', '#DC2626', '#94a3b8'], borderWidth: 0 }] },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
    });
  });
};

function errBox(msg) { return `<div class="bg-error-container text-on-error-container rounded-xl p-4 text-sm">${esc(msg)}</div>`; }


// ============================================================
// SEMESTER & MATA KULIAH
// ============================================================
PAGES.semesterMk = async function () {
  const c = document.getElementById('app-container');
  const [smtRes, mkRes] = await Promise.all([callServer('listSemester', App.token), callServer('listMataKuliah', App.token)]);
  window.__smtCache = smtRes.data || [];
  c.innerHTML = pageHeader('Semester & Mata Kuliah', 'Kelola tahun ajaran dan mata kuliah yang Anda ampu.',
    `<div class="flex gap-2">
      <button onclick="openSemesterForm()" class="px-4 py-2 bg-surface-mint-tint text-primary rounded-lg text-sm font-semibold">+ Semester</button>
      <button onclick="openMkForm()" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">+ Mata Kuliah</button>
    </div>`);

  const smtHtml = (smtRes.data || []).map(s => `
    <div class="flex items-center justify-between border border-border-subtle rounded-lg px-4 py-2.5">
      <div class="flex items-center gap-2">
        <span class="font-medium text-sm">${esc(s.jenis)} ${esc(s.tahunAjaran)}</span>
        ${s.aktif ? '<span class="badge-pill bg-surface-mint-tint text-primary">Aktif</span>' : ''}
      </div>
      <div class="flex gap-1">
        <button onclick='openSemesterForm(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="p-1.5 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[18px]">edit</span></button>
        <button onclick="deleteSemesterConfirm('${s.id}')" class="p-1.5 text-on-surface-variant hover:text-status-error"><span class="material-symbols-outlined text-[18px]">delete</span></button>
      </div>
    </div>`).join('') || emptyState('event', 'Belum ada semester.');

  const mkHtml = (mkRes.data || []).map(mk => `
    <div class="border border-border-subtle rounded-xl p-4">
      <div class="flex justify-between items-start">
        <div>
          <p class="font-semibold text-sm">${esc(mk.namaMk)} <span class="text-on-surface-variant font-normal">(${esc(mk.kodeMk)})</span></p>
          <p class="text-xs text-on-surface-variant mt-1">${esc(mk.programStudi)} · Semester ${esc(mk.semesterMhs)} · Kelas ${esc(mk.kelas)} · ${esc(mk.sks)} SKS</p>
          <p class="text-xs text-on-surface-variant">${esc(mk.semesterLabel)}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          <button onclick='openMkForm(${JSON.stringify(mk).replace(/'/g, "&#39;")})' class="p-1.5 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[18px]">edit</span></button>
          <button onclick="deleteMkConfirm('${mk.id}')" class="p-1.5 text-on-surface-variant hover:text-status-error"><span class="material-symbols-outlined text-[18px]">delete</span></button>
        </div>
      </div>
    </div>`).join('') || emptyState('menu_book', 'Belum ada mata kuliah.');

  c.innerHTML += `<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="bg-surface-card rounded-xl p-5 shadow-sm lg:col-span-1">
      <h3 class="font-display font-bold mb-3">Daftar Semester</h3>
      <div class="space-y-2">${smtHtml}</div>
    </div>
    <div class="bg-surface-card rounded-xl p-5 shadow-sm lg:col-span-2">
      <h3 class="font-display font-bold mb-3">Daftar Mata Kuliah</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${mkHtml}</div>
    </div>
  </div>`;
};

function openSemesterForm(data) {
  const s = data || {};
  openModal(`<div class="p-6">
    <h3 class="font-display font-bold text-lg mb-4">${s.id ? 'Ubah' : 'Tambah'} Semester</h3>
    <form onsubmit="return submitSemesterForm(event, '${s.id || ''}')" class="space-y-3">
      <select id="smtJenis" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <option value="Ganjil" ${s.jenis === 'Ganjil' ? 'selected' : ''}>Ganjil</option>
        <option value="Genap" ${s.jenis === 'Genap' ? 'selected' : ''}>Genap</option>
      </select>
      <input required id="smtTahun" value="${esc(s.tahunAjaran || '')}" placeholder="Tahun Ajaran, mis. 2024/2025" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="smtAktif" ${s.aktif ? 'checked' : ''}> Jadikan semester aktif</label>
      <div class="flex gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
        <button id="smtBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button>
      </div>
    </form></div>`, '420px');
}
async function submitSemesterForm(e, id) {
  e.preventDefault();
  const btn = document.getElementById('smtBtn'); setLoading(btn, true);
  const obj = { id: id || undefined, jenis: document.getElementById('smtJenis').value, tahunAjaran: document.getElementById('smtTahun').value, aktif: document.getElementById('smtAktif').checked };
  const res = await callServer('saveSemester', App.token, obj);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); navigateTo('semesterMk'); } else showToast('Gagal', res.message, 'danger');
  return false;
}
function deleteSemesterConfirm(id) {
  openModal(`<div class="p-6"><p class="text-sm mb-4">Hapus semester ini? Mata kuliah terkait tidak ikut terhapus.</p>
    <div class="flex gap-2"><button onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
    <button onclick="doDeleteSemester('${id}')" class="flex-1 py-2.5 rounded-lg bg-status-error text-white text-sm font-semibold">Hapus</button></div></div>`, '380px');
}
async function doDeleteSemester(id) {
  const res = await callServer('deleteSemester', App.token, id);
  closeModal();
  if (res.success) { showToast('Berhasil', res.message, 'success'); navigateTo('semesterMk'); } else showToast('Gagal', res.message, 'danger');
}

function openMkForm(data) {
  const mk = data || {};
  const smtOptions = (window.__smtCache || []).map(s => `<option value="${s.id}" ${mk.semesterId === s.id ? 'selected' : ''}>${esc(s.jenis)} ${esc(s.tahunAjaran)}</option>`).join('');
  openModal(`<div class="p-6 max-h-[80vh] overflow-y-auto">
    <h3 class="font-display font-bold text-lg mb-4">${mk.id ? 'Ubah' : 'Tambah'} Mata Kuliah</h3>
    <form onsubmit="return submitMkForm(event, '${mk.id || ''}')" class="space-y-3">
      <select required id="mkSemesterId" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm"><option value="">Pilih Semester/Tahun Ajaran</option>${smtOptions}</select>
      <div class="grid grid-cols-2 gap-3">
        <input required id="mkKode" value="${esc(mk.kodeMk || '')}" placeholder="Kode MK" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <input required id="mkSks" type="number" min="1" value="${esc(mk.sks || '')}" placeholder="SKS" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      </div>
      <input required id="mkNama" value="${esc(mk.namaMk || '')}" placeholder="Nama Mata Kuliah" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <input required id="mkProdi" value="${esc(mk.programStudi || '')}" placeholder="Program Studi" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <div class="grid grid-cols-2 gap-3">
        <select required id="mkSemesterMhs" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
          <option value="">Semester Mhs</option>${[1,2,3,4,5,6,7,8].map(n => `<option value="${n}" ${String(mk.semesterMhs) === String(n) ? 'selected' : ''}>Semester ${n}</option>`).join('')}
        </select>
        <input required id="mkKelas" value="${esc(mk.kelas || '')}" placeholder="Kelas (A/B/C)" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      </div>
      <p class="text-xs text-on-surface-variant">Peserta mata kuliah otomatis diambil dari mahasiswa dengan Program Studi, Semester, dan Kelas yang sama.</p>
      <div class="flex gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
        <button id="mkBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button>
      </div>
    </form></div>`, '460px');
}
async function submitMkForm(e, id) {
  e.preventDefault();
  const btn = document.getElementById('mkBtn'); setLoading(btn, true);
  const obj = {
    id: id || undefined, semesterId: document.getElementById('mkSemesterId').value, kodeMk: document.getElementById('mkKode').value,
    namaMk: document.getElementById('mkNama').value, sks: document.getElementById('mkSks').value, programStudi: document.getElementById('mkProdi').value,
    semesterMhs: document.getElementById('mkSemesterMhs').value, kelas: document.getElementById('mkKelas').value, dosenId: App.dosenId
  };
  const res = await callServer('saveMataKuliah', App.token, obj);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); navigateTo('semesterMk'); } else showToast('Gagal', res.message, 'danger');
  return false;
}
function deleteMkConfirm(id) {
  openModal(`<div class="p-6"><p class="text-sm mb-4">Hapus mata kuliah ini?</p>
    <div class="flex gap-2"><button onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
    <button onclick="doDeleteMk('${id}')" class="flex-1 py-2.5 rounded-lg bg-status-error text-white text-sm font-semibold">Hapus</button></div></div>`, '380px');
}
async function doDeleteMk(id) {
  const res = await callServer('deleteMataKuliah', App.token, id);
  closeModal();
  if (res.success) { showToast('Berhasil', res.message, 'success'); navigateTo('semesterMk'); } else showToast('Gagal', res.message, 'danger');
}

// Selector mata kuliah dipakai berulang di beberapa halaman
async function mkSelectorHtml(selectedId, onChangeFn) {
  const res = await callServer('listMataKuliah', App.token);
  const list = res.data || [];
  window.__mkListCache = list;
  return `<select id="mkSelector" onchange="${onChangeFn}(this.value)" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm bg-surface-card w-full sm:w-80">
    <option value="">Pilih Mata Kuliah...</option>
    ${list.map(mk => `<option value="${mk.id}" ${selectedId === mk.id ? 'selected' : ''}>${esc(mk.namaMk)} - ${esc(mk.kelas)} (${esc(mk.semesterLabel)})</option>`).join('')}
  </select>`;
}


// ============================================================
// PRESENSI & KEAKTIFAN
// ============================================================
PAGES.presensi = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Presensi & Keaktifan', 'Isi kehadiran dan skor keaktifan mahasiswa per pertemuan.');
  const selectorHtml = await mkSelectorHtml(params.mkId, 'onPresensiMkChange');
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>${selectorHtml}</div>
    <button onclick="showPesertaDiagnostic()" class="text-xs font-semibold text-primary underline self-start sm:self-auto">Kenapa sebagian mahasiswa tidak muncul?</button>
  </div><div id="presensiBody"></div>`;
  if (params.mkId) onPresensiMkChange(params.mkId, params.pertemuanId);
};

async function showPesertaDiagnostic() {
  const mkId = App.currentParams && App.currentParams.mkId;
  if (!mkId) { showToast('Info', 'Pilih mata kuliah terlebih dahulu.', 'warning'); return; }
  openModal('<div class="p-6"><div class="skeleton h-40"></div></div>', '560px');
  const res = await callServer('getPesertaDiagnostic', App.token, mkId);
  if (!res.success) { openModal(`<div class="p-6">${errBox(res.message)}</div>`, '560px'); return; }
  const { mk, cocok, tidakCocok } = res.data;
  openModal(`<div class="p-6 max-h-[80vh] overflow-y-auto">
    <h3 class="font-display font-bold text-lg mb-1">Diagnostik Peserta</h3>
    <p class="text-xs text-on-surface-variant mb-4">Mata kuliah ini terdaftar dengan: Program Studi <b>${esc(mk.programStudi)}</b>, Semester <b>${esc(mk.semesterMhs)}</b>, Kelas <b>${esc(mk.kelas)}</b>.</p>
    <p class="text-sm font-semibold text-primary mb-2">✓ ${cocok.length} mahasiswa cocok (akan muncul di presensi/tugas/nilai)</p>
    <p class="text-sm font-semibold text-status-error mb-2">✗ ${tidakCocok.length} mahasiswa TIDAK cocok:</p>
    <div class="space-y-2">
      ${tidakCocok.length ? tidakCocok.map(t => `<div class="border border-border-subtle rounded-lg p-3">
        <p class="text-sm font-medium">${esc(t.nama)} <span class="text-xs text-on-surface-variant">(${esc(t.nim)})</span></p>
        <ul class="text-xs text-status-error list-disc pl-4 mt-1">${t.alasan.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>`).join('') : '<p class="text-xs text-on-surface-variant">Semua mahasiswa aktif sudah cocok.</p>'}
    </div>
    <p class="text-xs text-on-surface-variant mt-4">Perbaiki data yang berbeda lewat menu Data Mahasiswa (klik ikon pensil), lalu buka lagi halaman ini.</p>
  </div>`, '560px');
}

async function onPresensiMkChange(mkId, autoPertemuanId) {
  App.currentParams = { mkId };
  if (!mkId) { document.getElementById('presensiBody').innerHTML = ''; return; }
  const body = document.getElementById('presensiBody');
  body.innerHTML = '<div class="skeleton h-40"></div>';
  try {
    const res = await callServer('listPertemuan', App.token, mkId);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    const list = res.data || [];
    const tabs = list.map(p => `<button onclick="loadPresensiPertemuan('${p.id}','${mkId}')" data-pt="${p.id}"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${p.id === autoPertemuanId ? 'bg-primary-container text-on-primary' : 'bg-surface-canvas text-on-surface-variant'}">
        P-${p.nomor}${p.topik ? ': ' + esc(p.topik).slice(0, 16) : ''}</button>`).join('');
    body.innerHTML = `<div class="bg-surface-card rounded-xl p-4 shadow-sm mb-4">
      <p class="text-xs font-semibold text-on-surface-variant mb-2 uppercase">Pilih Pertemuan (1-16)</p>
      <div class="flex gap-2 overflow-x-auto pb-1">${tabs || '<span class="text-xs text-on-surface-variant">Belum ada data pertemuan untuk mata kuliah ini.</span>'}</div>
    </div><div id="presensiGrid"></div>`;
    const target = autoPertemuanId || (list[0] && list[0].id);
    if (target) loadPresensiPertemuan(target, mkId);
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

async function loadPresensiPertemuan(pertemuanId, mkId) {
  document.querySelectorAll('[data-pt]').forEach(b => b.classList.toggle('bg-primary-container', b.dataset.pt === pertemuanId));
  document.querySelectorAll('[data-pt]').forEach(b => b.classList.toggle('text-on-primary', b.dataset.pt === pertemuanId));
  const grid = document.getElementById('presensiGrid');
  grid.innerHTML = '<div class="skeleton h-64"></div>';
  try {
    const res = await callServer('getPresensiPertemuan', App.token, pertemuanId);
    if (!res.success) { grid.innerHTML = errBox(res.message); return; }
    const { pertemuan, rows } = res.data;
  window.__presensiRows = rows;
  grid.innerHTML = `<div class="bg-surface-card rounded-xl p-5 shadow-sm">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2">
        <input type="date" id="ptTanggal" value="${pertemuan.tanggal ? new Date(pertemuan.tanggal).toISOString().slice(0,10) : ''}" class="px-2 py-1.5 border border-border-subtle rounded-lg text-xs">
        <input id="ptTopik" value="${esc(pertemuan.topik || '')}" placeholder="Topik pertemuan ke-${pertemuan.nomor}" class="px-2 py-1.5 border border-border-subtle rounded-lg text-xs flex-1 min-w-[160px]">
        <button onclick="savePertemuanInfo('${pertemuan.id}')" class="px-3 py-1.5 bg-surface-mint-tint text-primary rounded-lg text-xs font-semibold">Simpan Info</button>
      </div>
      <button onclick="setAllStatus('Hadir')" class="px-3 py-1.5 bg-surface-canvas rounded-lg text-xs font-semibold text-on-surface-variant">Set semua Hadir</button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm data-table">
        <thead><tr class="text-left text-xs uppercase text-on-surface-variant border-b border-border-subtle">
          <th class="py-2">Mahasiswa</th><th>Status</th><th>Skor Keaktifan</th></tr></thead>
        <tbody id="presensiTbody">
          ${rows.map((r, idx) => `<tr class="border-b border-border-subtle">
            <td class="py-2"><span class="font-medium">${esc(r.nama)}</span><div class="text-xs text-on-surface-variant">${esc(r.nim)}</div></td>
            <td>
              <select data-idx="${idx}" class="pr-status px-2 py-1.5 border border-border-subtle rounded-lg text-xs">
                ${['Hadir','Izin','Sakit','Alpa'].map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </td>
            <td><input data-idx="${idx}" type="number" min="0" max="100" value="${r.skorKeaktifan}" class="pr-skor w-20 px-2 py-1.5 border border-border-subtle rounded-lg text-xs"></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${rows.length ? `<button onclick="submitPresensiBatch('${pertemuan.id}')" id="savePresensiBtn" class="mt-4 w-full sm:w-auto px-5 py-2.5 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">Simpan Presensi & Keaktifan</button>` : emptyState('group_off', 'Belum ada mahasiswa peserta mata kuliah ini. Periksa apakah Program Studi/Semester/Kelas pada data mahasiswa persis sama dengan mata kuliah ini.')}
  </div>`;
  } catch (err) {
    grid.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

function setAllStatus(status) { document.querySelectorAll('.pr-status').forEach(s => s.value = status); }

async function savePertemuanInfo(id) {
  const res = await callServer('updatePertemuan', App.token, { id, tanggal: document.getElementById('ptTanggal').value, topik: document.getElementById('ptTopik').value });
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
}

async function submitPresensiBatch(pertemuanId) {
  const rows = window.__presensiRows.map((r, idx) => ({
    nim: r.nim,
    status: document.querySelector(`.pr-status[data-idx="${idx}"]`).value,
    skorKeaktifan: document.querySelector(`.pr-skor[data-idx="${idx}"]`).value
  }));
  const btn = document.getElementById('savePresensiBtn'); setLoading(btn, true);
  const res = await callServer('savePresensiBatch', App.token, pertemuanId, rows);
  setLoading(btn, false);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
}


// ============================================================
// MATERI & RPS
// ============================================================
PAGES.materiRps = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Materi & RPS', 'Unggah RPS dan materi per pertemuan untuk mahasiswa.');
  const selectorHtml = await mkSelectorHtml(params.mkId, 'onMateriMkChange');
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">${selectorHtml}</div><div id="materiBody"></div>`;
  if (params.mkId) onMateriMkChange(params.mkId);
};

async function onMateriMkChange(mkId) {
  const body = document.getElementById('materiBody');
  if (!mkId) { body.innerHTML = ''; return; }
  body.innerHTML = '<div class="skeleton h-64"></div>';
  try {
    const [rpsRes, materiRes] = await Promise.all([callServer('getRpsByMk', App.token, mkId), callServer('listMateri', App.token, mkId)]);
    if (!rpsRes.success) { body.innerHTML = errBox(rpsRes.message); return; }
    if (!materiRes.success) { body.innerHTML = errBox(materiRes.message); return; }
    const rps = rpsRes.data;
    body.innerHTML = `
    <div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">
      <div class="flex justify-between items-center mb-2"><h3 class="font-display font-bold">Rencana Pembelajaran Semester (RPS)</h3>
        <button onclick="openRpsForm('${mkId}', ${rps ? JSON.stringify(rps).replace(/"/g,'&quot;') : 'null'})" class="text-xs font-semibold text-primary">${rps ? 'Ubah' : '+ Unggah RPS'}</button></div>
      ${rps ? `<p class="text-sm text-on-surface-variant">${esc(rps.deskripsi || '-')}</p>${rps.fileId ? `<button onclick="previewOrDownload('${rps.fileId}','${esc(rps.fileName)}')" class="mt-2 text-xs text-primary font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">description</span> ${esc(rps.fileName)}</button>` : ''}` : emptyState('description', 'RPS belum diunggah.')}
    </div>
    <div class="bg-surface-card rounded-xl p-5 shadow-sm">
      <h3 class="font-display font-bold mb-3">Materi per Pertemuan</h3>
      <div class="space-y-2">
        ${materiRes.data.map(item => `<div class="border border-border-subtle rounded-lg p-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Pertemuan ${item.pertemuan.nomor}${item.pertemuan.topik ? ': ' + esc(item.pertemuan.topik) : ''}</p>
            <button onclick="openMateriForm('${mkId}','${item.pertemuan.id}')" class="text-xs font-semibold text-primary">+ Materi</button>
          </div>
          ${item.materi.length ? item.materi.map(m => `<div class="flex items-center justify-between mt-1.5 pl-2">
            <button onclick="previewOrDownload('${m.fileId}','${esc(m.fileName)}')" class="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">attach_file</span>${esc(m.judul)}</button>
            <button onclick="deleteMateriConfirm('${m.id}','${mkId}')" class="text-status-error"><span class="material-symbols-outlined text-[16px]">delete</span></button>
          </div>`).join('') : '<p class="text-xs text-on-surface-variant pl-2 mt-1">Belum ada materi.</p>'}
        </div>`).join('')}
      </div>
    </div>`;
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

function openRpsForm(mkId, rps) {
  rps = rps || {};
  openModal(`<div class="p-6"><h3 class="font-display font-bold text-lg mb-4">Unggah RPS</h3>
    <form onsubmit="return submitRpsForm(event, '${mkId}')" class="space-y-3">
      <textarea id="rpsDeskripsi" rows="3" placeholder="Deskripsi singkat RPS" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">${esc(rps.deskripsi || '')}</textarea>
      <textarea id="rpsCapaian" rows="2" placeholder="Capaian pembelajaran" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">${esc(rps.capaian || '')}</textarea>
      <input type="file" id="rpsFile" accept=".pdf,.doc,.docx" class="w-full text-xs">
      <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
      <button id="rpsBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button></div>
    </form></div>`, '440px');
}
async function submitRpsForm(e, mkId) {
  e.preventDefault();
  const btn = document.getElementById('rpsBtn'); setLoading(btn, true);
  const fileInput = document.getElementById('rpsFile');
  let dataUri = null, fileName = null;
  if (fileInput.files[0]) { dataUri = await readFileAsDataUri(fileInput.files[0]); fileName = fileInput.files[0].name; }
  const obj = { mkId, deskripsi: document.getElementById('rpsDeskripsi').value, capaian: document.getElementById('rpsCapaian').value };
  const res = await callServer('saveRps', App.token, obj, dataUri, fileName);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); onMateriMkChange(mkId); } else showToast('Gagal', res.message, 'danger');
  return false;
}

function openMateriForm(mkId, pertemuanId) {
  openModal(`<div class="p-6"><h3 class="font-display font-bold text-lg mb-4">Unggah Materi</h3>
    <form onsubmit="return submitMateriForm(event, '${mkId}','${pertemuanId}')" class="space-y-3">
      <input required id="materiJudul" placeholder="Judul materi" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <input required type="file" id="materiFile" class="w-full text-xs">
      <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
      <button id="materiBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Unggah</button></div>
    </form></div>`, '420px');
}
async function submitMateriForm(e, mkId, pertemuanId) {
  e.preventDefault();
  const btn = document.getElementById('materiBtn'); setLoading(btn, true);
  const file = document.getElementById('materiFile').files[0];
  const dataUri = await readFileAsDataUri(file);
  const res = await callServer('uploadMateri', App.token, { mkId, pertemuanId, judul: document.getElementById('materiJudul').value }, dataUri, file.name);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); onMateriMkChange(mkId); } else showToast('Gagal', res.message, 'danger');
  return false;
}
function deleteMateriConfirm(id, mkId) {
  openModal(`<div class="p-6"><p class="text-sm mb-4">Hapus materi ini?</p>
    <div class="flex gap-2"><button onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
    <button onclick="doDeleteMateri('${id}','${mkId}')" class="flex-1 py-2.5 rounded-lg bg-status-error text-white text-sm font-semibold">Hapus</button></div></div>`, '360px');
}
async function doDeleteMateri(id, mkId) {
  const res = await callServer('deleteMateri', App.token, id);
  closeModal();
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  onMateriMkChange(mkId);
}

// Preview/unduh file umum (materi, RPS, tugas)
async function previewOrDownload(fileId, fileName) {
  showToast('Memuat', 'Menyiapkan file...', 'info');
  const res = await callServer('getFileAsBase64', App.token, fileId);
  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
  downloadBase64(res.data.base64, fileName, res.data.mimeType);
}


// ============================================================
// TUGAS MAHASISWA (SISI DOSEN)
// ============================================================
PAGES.tugas = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Tugas Mahasiswa', 'Buat tugas, pantau pengumpulan, dan beri nilai.', `<div id="tugasHeaderAction"></div>`);
  const selectorHtml = await mkSelectorHtml(params.mkId, 'onTugasMkChange');
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>${selectorHtml}</div>
    <button onclick="showPesertaDiagnostic()" class="text-xs font-semibold text-primary underline self-start sm:self-auto">Kenapa sebagian mahasiswa tidak muncul?</button>
  </div><div id="tugasBody"></div>`;
  if (params.mkId) onTugasMkChange(params.mkId);
};

function renderTugasHeaderAction(mkId) {
  const el = document.getElementById('tugasHeaderAction');
  if (!el) return;
  el.innerHTML = mkId ? `<button onclick="openTugasForm('${mkId}')" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">+ Buat Tugas</button>` : '';
}

PAGES._tugasBodyRenderer = null;
async function renderTugasList(mkId) {
  const body = document.getElementById('tugasBody');
  if (!body) return;
  body.innerHTML = '<div class="skeleton h-52"></div>';
  try {
    const res = await callServer('listTugas', App.token, mkId);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    body.innerHTML = res.data.length ? `<div class="space-y-3">${res.data.map(t => `
      <div class="bg-surface-card rounded-xl p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p class="font-semibold text-sm">${esc(t.judul)}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">${esc(t.instruksi || '')}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">Batas waktu: ${esc(t.batasWaktu)} · Terkumpul ${t.jumlahKumpul} mahasiswa</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button onclick="viewPengumpulan('${t.id}','${mkId}')" class="px-3 py-1.5 bg-surface-mint-tint text-primary rounded-lg text-xs font-semibold">Lihat & Nilai</button>
            <button onclick="kirimPengingat('${t.id}')" class="px-3 py-1.5 bg-surface-canvas text-on-surface-variant rounded-lg text-xs font-semibold">Ingatkan</button>
          </div>
        </div>
      </div>`).join('')}</div>` : emptyState('assignment', 'Belum ada tugas untuk mata kuliah ini. Klik "+ Buat Tugas" di pojok kanan atas untuk membuat tugas baru.');
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}
// dipanggil dari onchange dropdown pemilih mata kuliah
window.onTugasMkChange = function (mkId) {
  App.currentParams = { mkId };
  renderTugasHeaderAction(mkId);
  if (mkId) renderTugasList(mkId);
  else document.getElementById('tugasBody').innerHTML = '';
};

function openTugasForm(mkId) {
  openModal(`<div class="p-6"><h3 class="font-display font-bold text-lg mb-4">Buat Tugas Baru</h3>
    <form onsubmit="return submitTugasForm(event, '${mkId}')" class="space-y-3">
      <input required id="tgJudul" placeholder="Judul tugas" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <textarea id="tgInstruksi" rows="3" placeholder="Instruksi tugas" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm"></textarea>
      <input required type="datetime-local" id="tgBatas" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
      <button id="tgBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button></div>
    </form></div>`, '440px');
}
async function submitTugasForm(e, mkId) {
  e.preventDefault();
  const btn = document.getElementById('tgBtn'); setLoading(btn, true);
  const obj = { mkId, judul: document.getElementById('tgJudul').value, instruksi: document.getElementById('tgInstruksi').value, batasWaktu: document.getElementById('tgBatas').value };
  const res = await callServer('saveTugas', App.token, obj);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); renderTugasList(mkId); } else showToast('Gagal', res.message, 'danger');
  return false;
}

async function viewPengumpulan(tugasId, mkId) {
  openModal('<div class="p-6"><div class="skeleton h-52"></div></div>', '640px');
  const res = await callServer('listPengumpulanTugas', App.token, tugasId);
  if (!res.success) { openModal(`<div class="p-6">${errBox(res.message)}</div>`); return; }
  const { tugas, rows } = res.data;
  openModal(`<div class="p-6">
    <div class="flex justify-between items-start mb-4"><h3 class="font-display font-bold text-lg">${esc(tugas.judul)}</h3>
      <button onclick="closeModal()" class="text-on-surface-variant"><span class="material-symbols-outlined">close</span></button></div>
    <div class="overflow-x-auto"><table class="w-full text-sm data-table"><thead><tr class="text-left text-xs uppercase text-on-surface-variant border-b border-border-subtle">
      <th class="py-2">Mahasiswa</th><th>Berkas</th><th>Nilai</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr class="border-b border-border-subtle">
        <td class="py-2">${esc(r.nama)}<div class="text-xs text-on-surface-variant">${esc(r.nim)}</div></td>
        <td>${r.pengumpulan ? `<button onclick="previewOrDownload('${r.pengumpulan.fileId}','${esc(r.pengumpulan.fileName)}')" class="text-primary text-xs font-semibold">${esc(r.pengumpulan.fileName)}</button><div class="text-[10px] text-on-surface-variant">${fmtDateTime(r.pengumpulan.waktuKumpul)}</div>` : '<span class="text-xs text-status-error">Belum kumpul</span>'}</td>
        <td>${r.pengumpulan ? `<input type="number" min="0" max="100" value="${r.pengumpulan.nilai || ''}" data-pid="${r.pengumpulan.id}" class="w-16 px-2 py-1 border border-border-subtle rounded text-xs nilai-tugas-input">` : '-'}</td>
        <td>${r.pengumpulan ? `<button onclick="saveNilaiTugasInline('${r.pengumpulan.id}')" class="text-xs font-semibold text-primary">Simpan</button>` : ''}</td>
      </tr>`).join('')}
    </tbody></table></div>
  </div>`, '680px');
}
async function saveNilaiTugasInline(pengumpulanId) {
  const input = document.querySelector(`.nilai-tugas-input[data-pid="${pengumpulanId}"]`);
  const res = await callServer('gradeTugas', App.token, pengumpulanId, input.value, '');
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
}
async function kirimPengingat(tugasId) {
  const res = await callServer('kirimPengingatTugas', App.token, tugasId);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
}


// ============================================================
// PENILAIAN (UTS/UAS) & REKAP
// ============================================================
PAGES.penilaian = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Penilaian (UTS/UAS)', 'Input nilai ujian — nilai akhir dan huruf mutu dihitung otomatis.');
  const selectorHtml = await mkSelectorHtml(params.mkId, 'renderPenilaianTable');
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
    <div>${selectorHtml}</div>
    <div class="flex items-center gap-3">
      <button onclick="showPesertaDiagnostic()" class="text-xs font-semibold text-primary underline">Kenapa mahasiswa tidak muncul?</button>
      <div class="flex gap-2">
        <button id="btnHitungUlang" onclick="hitungUlangNilai()" class="px-4 py-2 bg-surface-mint-tint text-primary rounded-lg text-sm font-semibold">Hitung Ulang</button>
        <button id="btnPublish" onclick="publishNilaiConfirm()" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">Publikasikan Nilai</button>
      </div>
    </div>
  </div><div id="penilaianBody"></div>`;
  if (params.mkId) renderPenilaianTable(params.mkId);
};

async function renderPenilaianTable(mkId) {
  App.currentParams = { mkId };
  const body = document.getElementById('penilaianBody');
  if (!mkId) { body.innerHTML = ''; return; }
  body.innerHTML = '<div class="skeleton h-64"></div>';
  try {
    const res = await callServer('getRekapNilai', App.token, mkId);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    window.__rekapCache = res.data;
    body.innerHTML = `<div class="bg-surface-card rounded-xl p-5 shadow-sm overflow-x-auto">
      <table class="w-full text-sm data-table">
        <thead><tr class="text-left text-xs uppercase text-on-surface-variant border-b border-border-subtle">
          <th class="py-2">Mahasiswa</th><th>Kehadiran</th><th>Partisipasi</th><th>Tugas</th><th>UTS</th><th>UAS</th><th>Nilai Akhir</th><th>Mutu</th></tr></thead>
        <tbody>
          ${res.data.map((r, idx) => `<tr class="border-b border-border-subtle">
            <td class="py-2 font-medium">${esc(r.nama)}<div class="text-xs text-on-surface-variant font-normal">${esc(r.nim)}</div></td>
            <td>${n2(r.nKehadiran)}</td><td>${n2(r.nPartisipasi)}</td><td>${n2(r.nTugas)}</td>
            <td><input type="number" min="0" max="100" value="${r.nUts ?? ''}" data-idx="${idx}" data-jenis="UTS" class="uts-uas-input w-16 px-2 py-1 border border-border-subtle rounded text-xs"></td>
            <td><input type="number" min="0" max="100" value="${r.nUas ?? ''}" data-idx="${idx}" data-jenis="UAS" class="uts-uas-input w-16 px-2 py-1 border border-border-subtle rounded text-xs"></td>
            <td class="font-semibold">${n2(r.nilaiAkhir)}</td>
            <td><span class="badge-pill ${hurufBadgeClass(r.huruf)}">${esc(r.huruf || '-')}</span> ${r.published ? '<span class="text-[10px] text-primary block">Terpublikasi</span>' : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${res.data.length ? '' : emptyState('school', 'Belum ada peserta mata kuliah ini. Periksa apakah Program Studi/Semester/Kelas mahasiswa persis sama dengan mata kuliah ini.')}
    </div>`;
    document.querySelectorAll('.uts-uas-input').forEach(inp => {
      inp.addEventListener('change', async () => {
        const idx = inp.dataset.idx, jenis = inp.dataset.jenis;
        const row = window.__rekapCache[idx];
        const res2 = await callServer('saveNilaiUjian', App.token, mkId, row.nim, jenis, inp.value);
        showToast(res2.success ? 'Tersimpan' : 'Gagal', res2.message, res2.success ? 'success' : 'danger');
        if (res2.success) renderPenilaianTable(mkId);
      });
    });
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

async function hitungUlangNilai() {
  const mkId = App.currentParams.mkId;
  if (!mkId) return;
  const btn = document.getElementById('btnHitungUlang'); setLoading(btn, true);
  const res = await callServer('computeNilaiAkhirForMk', App.token, mkId);
  setLoading(btn, false);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) renderPenilaianTable(mkId);
}
function publishNilaiConfirm() {
  const mkId = App.currentParams.mkId;
  if (!mkId) { showToast('Info', 'Pilih mata kuliah terlebih dahulu.', 'warning'); return; }
  openModal(`<div class="p-6"><p class="text-sm mb-4">Publikasikan nilai akhir mata kuliah ini? Mahasiswa akan bisa melihat nilai dan mengunduh KHS.</p>
    <div class="flex gap-2"><button onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
    <button onclick="doPublishNilai('${mkId}')" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Publikasikan</button></div></div>`, '420px');
}
async function doPublishNilai(mkId) {
  const res = await callServer('publishNilai', App.token, mkId);
  closeModal();
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) renderPenilaianTable(mkId);
}

// ============================================================
// REKAP & CETAK KHS
// ============================================================
PAGES.rekapKhs = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Rekap & Cetak KHS', 'Cetak KHS satu mahasiswa atau rekap seluruh kelas dalam satu berkas PDF.');
  const selectorHtml = await mkSelectorHtml(params.mkId, 'renderKhsTable');
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
    <div>${selectorHtml}</div>
    <button id="btnRekapKelas" onclick="cetakRekapKelas()" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">Cetak Rekap Kelas (PDF)</button>
  </div><div id="khsBody"></div>`;
  if (params.mkId) renderKhsTable(params.mkId);
};

async function renderKhsTable(mkId) {
  App.currentParams = { mkId };
  const body = document.getElementById('khsBody');
  if (!mkId) { body.innerHTML = ''; return; }
  body.innerHTML = '<div class="skeleton h-56"></div>';
  try {
    const res = await callServer('getRekapNilai', App.token, mkId);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    body.innerHTML = `<div class="bg-surface-card rounded-xl p-5 shadow-sm overflow-x-auto">
      <table class="w-full text-sm data-table">
        <thead><tr class="text-left text-xs uppercase text-on-surface-variant border-b border-border-subtle"><th class="py-2">Mahasiswa</th><th>Nilai Akhir</th><th>Mutu</th><th>Status</th><th></th></tr></thead>
        <tbody>${res.data.map(r => `<tr class="border-b border-border-subtle">
          <td class="py-2 font-medium">${esc(r.nama)}<div class="text-xs text-on-surface-variant font-normal">${esc(r.nim)}</div></td>
          <td>${n2(r.nilaiAkhir)}</td>
          <td><span class="badge-pill ${hurufBadgeClass(r.huruf)}">${esc(r.huruf || '-')}</span></td>
          <td>${r.published ? '<span class="text-xs text-primary font-semibold">Terpublikasi</span>' : '<span class="text-xs text-status-warning font-semibold">Belum dipublikasikan</span>'}</td>
          <td>${r.published ? `<button onclick="cetakKhsSatuan('${mkId}','${r.nim}')" class="text-xs font-semibold text-primary">Cetak KHS</button>` : ''}</td>
        </tr>`).join('')}</tbody>
      </table>
      ${res.data.length ? '' : emptyState('school', 'Belum ada peserta. Periksa apakah Program Studi/Semester/Kelas mahasiswa persis sama dengan mata kuliah ini.')}
    </div>`;
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

async function cetakKhsSatuan(mkId, nim) {
  showToast('Memproses', 'Membuat berkas KHS...', 'info');
  const res = await callServer('generateKhsPdf', App.token, mkId, nim);
  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
  downloadBase64(res.data.base64, res.data.fileName, 'application/pdf');
  showToast('Berhasil', 'KHS berhasil diunduh.', 'success');
}
async function cetakRekapKelas() {
  const mkId = App.currentParams.mkId;
  if (!mkId) { showToast('Info', 'Pilih mata kuliah terlebih dahulu.', 'warning'); return; }
  const btn = document.getElementById('btnRekapKelas'); setLoading(btn, true);
  const res = await callServer('generateRekapKelasPdf', App.token, mkId);
  setLoading(btn, false);
  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
  downloadBase64(res.data.base64, res.data.fileName, 'application/pdf');
  showToast('Berhasil', 'Rekap KHS kelas berhasil diunduh.', 'success');
}


// ============================================================
// DATA MAHASISWA (TABEL CARI/FILTER + IMPOR EXCEL)
// ============================================================
PAGES.dataMahasiswa = async function () {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Data Mahasiswa', 'Kelola data mahasiswa dan sinkronkan dengan mata kuliah yang diambil.',
    `<div class="flex gap-2">
      <button onclick="downloadTemplateExcel()" class="px-3 py-2 bg-surface-canvas text-on-surface-variant rounded-lg text-xs font-semibold">Unduh Templat</button>
      <button onclick="openImportForm()" class="px-4 py-2 bg-surface-mint-tint text-primary rounded-lg text-sm font-semibold">Impor Excel</button>
      <button onclick="openMahasiswaForm()" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">+ Tambah</button>
    </div>`);
  const mkRes = await callServer('listMataKuliah', App.token);
  window.__mkOptionsCache = mkRes.success ? mkRes.data : [];
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">
    <p class="text-xs font-semibold text-on-surface-variant uppercase mb-2">Tetapkan Mata Kuliah Massal</p>
    <p class="text-xs text-on-surface-variant mb-3">Cari/filter mahasiswa di tabel bawah dulu (misalnya berdasarkan Prodi/Kelas), lalu pilih mata kuliah dan klik tombol — mata kuliah itu akan ditambahkan ke <b>semua mahasiswa yang sedang tampil</b> di tabel (tidak menghapus mata kuliah lain yang sudah mereka miliki).</p>
    <div class="flex flex-col sm:flex-row gap-2">
      <select id="bulkMkSelect" class="flex-1 px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <option value="">Pilih mata kuliah...</option>
        ${window.__mkOptionsCache.map(mk => `<option value="${esc(mk.kodeMk)}">${esc(mk.namaMk)} (${esc(mk.kodeMk)}) — ${esc(mk.semesterLabel)}</option>`).join('')}
      </select>
      <button onclick="submitBulkAssignMatkul()" class="px-4 py-2.5 bg-primary-container text-on-primary rounded-lg text-sm font-semibold whitespace-nowrap">Tetapkan untuk Hasil Tampil</button>
    </div>
  </div>
  <div class="bg-surface-card rounded-xl p-5 shadow-sm">
    <div class="mb-3">${searchInput('mhsSearch', 'Cari nama / NIM / prodi / kelas / matkul...', 'filterMahasiswaTable()')}</div>
    <div class="overflow-x-auto"><table class="w-full text-sm data-table" id="mhsTable">
      <thead><tr class="text-left text-xs uppercase text-on-surface-variant border-b border-border-subtle">
        <th class="py-2">NIM</th><th>Nama</th><th>Matkul</th><th>Prodi</th><th>Smt</th><th>Kelas</th><th>Status</th><th></th></tr></thead>
      <tbody id="mhsTbody"></tbody>
    </table></div>
  </div>`;
  const res = await callServer('listMahasiswa', App.token);
  window.__mhsCache = res.data || [];
  renderMahasiswaRows(window.__mhsCache);
};

function renderMahasiswaRows(list) {
  window.__mhsVisible = list;
  document.getElementById('mhsTbody').innerHTML = list.length ? list.map(m => `
    <tr class="border-b border-border-subtle">
      <td class="py-2">${esc(m.nim)}</td><td>${esc(m.nama)}</td>
      <td>${(m.matkul || '').split(',').filter(Boolean).map(k => `<span class="badge-pill bg-surface-mint-tint text-primary mr-1 mb-1">${esc(k.trim())}<button onclick="hapusMatkulMhs('${esc(m.nim)}','${esc(k.trim())}')" title="Hapus mata kuliah ini dari mahasiswa" class="ml-1 hover:text-status-error font-bold">×</button></span>`).join('') || '<span class="text-xs text-status-warning">Belum ada</span>'}</td>
      <td>${esc(m.programStudi)}</td><td>${esc(m.semester)}</td><td>${esc(m.kelas)}</td>
      <td>${m.statusAktif === false ? '<span class="badge-pill bg-error-container text-error">Nonaktif</span>' : '<span class="badge-pill bg-surface-mint-tint text-primary">Aktif</span>'}</td>
      <td class="flex gap-1 py-2">
        <button onclick='openMahasiswaForm(${JSON.stringify(m).replace(/'/g,"&#39;")})' title="Ubah" class="p-1 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[18px]">edit</span></button>
        <button onclick="resetSandiMhs('${m.nim}')" title="Reset Sandi" class="p-1 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[18px]">key</span></button>
        <button onclick="toggleStatusMhs('${m.nim}', ${m.statusAktif === false})" title="Aktif/Nonaktif" class="p-1 text-on-surface-variant hover:text-status-warning"><span class="material-symbols-outlined text-[18px]">toggle_on</span></button>
      </td>
    </tr>`).join('') : `<tr><td colspan="8">${emptyState('group', 'Belum ada data mahasiswa. Impor dari Excel atau tambah manual.')}</td></tr>`;
}
function filterMahasiswaTable() {
  const q = document.getElementById('mhsSearch').value.toLowerCase();
  renderMahasiswaRows((window.__mhsCache || []).filter(m => [m.nim, m.nama, m.programStudi, m.kelas, m.matkul].join(' ').toLowerCase().includes(q)));
}

async function submitBulkAssignMatkul() {
  const kodeMk = document.getElementById('bulkMkSelect').value;
  if (!kodeMk) { showToast('Info', 'Pilih mata kuliah terlebih dahulu.', 'warning'); return; }
  const nimList = (window.__mhsVisible || []).map(m => m.nim);
  if (!nimList.length) { showToast('Info', 'Tidak ada mahasiswa yang tampil di tabel untuk ditetapkan.', 'warning'); return; }
  const res = await callServer('bulkAssignMatkul', App.token, nimList, kodeMk);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) navigateTo('dataMahasiswa');
}

function openMahasiswaForm(data) {
  const m = data || {};
  const selectedCodes = (m.matkul || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const mkOptions = window.__mkOptionsCache || [];
  openModal(`<div class="p-6 max-h-[85vh] overflow-y-auto"><h3 class="font-display font-bold text-lg mb-4">${m.nim ? 'Ubah' : 'Tambah'} Mahasiswa</h3>
    <form onsubmit="return submitMahasiswaForm(event, ${m.nim ? "'"+m.nim+"'" : 'null'})" class="space-y-3">
      <input required ${m.nim ? 'readonly' : ''} id="mNim" value="${esc(m.nim || '')}" placeholder="NIM" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm ${m.nim ? 'bg-surface-canvas' : ''}">
      <input required id="mNama" value="${esc(m.nama || '')}" placeholder="Nama lengkap" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <div>
        <label class="block text-xs font-semibold text-on-surface-variant mb-1">Mata Kuliah yang Diambil</label>
        <div class="border border-border-subtle rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5">
          ${mkOptions.length ? mkOptions.map(mk => `<label class="flex items-center gap-2 text-sm">
            <input type="checkbox" class="matkul-check" value="${esc(mk.kodeMk)}" ${selectedCodes.indexOf(String(mk.kodeMk).toLowerCase()) > -1 ? 'checked' : ''}>
            ${esc(mk.namaMk)} <span class="text-xs text-on-surface-variant">(${esc(mk.kodeMk)})</span>
          </label>`).join('') : '<p class="text-xs text-on-surface-variant">Belum ada mata kuliah dibuat. Buat dulu di menu Semester & Mata Kuliah.</p>'}
        </div>
      </div>
      <input id="mProdi" value="${esc(m.programStudi || '')}" placeholder="Program Studi" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <div class="grid grid-cols-3 gap-3">
        <input id="mAngkatan" value="${esc(m.angkatan || '')}" placeholder="Angkatan" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <select id="mSemester" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${String(m.semester)===String(n)?'selected':''}>Smt ${n}</option>`).join('')}</select>
        <input id="mKelas" value="${esc(m.kelas || '')}" placeholder="Kelas" class="px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      </div>
      <input id="mEmail" value="${esc(m.email || '')}" type="email" placeholder="Email" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
      <button id="mBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button></div>
    </form></div>`, '460px');
}
async function submitMahasiswaForm(e, existingNim) {
  e.preventDefault();
  const btn = document.getElementById('mBtn'); setLoading(btn, true);
  const matkul = Array.from(document.querySelectorAll('.matkul-check:checked')).map(el => el.value).join(', ');
  const obj = { nim: document.getElementById('mNim').value.trim(), nama: document.getElementById('mNama').value, matkul: matkul, programStudi: document.getElementById('mProdi').value,
    angkatan: document.getElementById('mAngkatan').value, semester: document.getElementById('mSemester').value, kelas: document.getElementById('mKelas').value, email: document.getElementById('mEmail').value };
  const res = await callServer('saveMahasiswaManual', App.token, obj);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); navigateTo('dataMahasiswa'); } else showToast('Gagal', res.message, 'danger');
  return false;
}
function hapusMatkulMhs(nim, kodeMk) {
  openModal(`<div class="p-6"><p class="text-sm mb-4">Hapus mata kuliah <b>${esc(kodeMk)}</b> dari mahasiswa ini? (Data mahasiswa lainnya tidak terpengaruh.)</p>
    <div class="flex gap-2"><button onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
    <button onclick="doHapusMatkulMhs('${esc(nim)}','${esc(kodeMk)}')" class="flex-1 py-2.5 rounded-lg bg-status-error text-white text-sm font-semibold">Hapus</button></div></div>`, '380px');
}
async function doHapusMatkulMhs(nim, kodeMk) {
  const res = await callServer('removeMatkulFromMahasiswa', App.token, nim, kodeMk);
  closeModal();
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) navigateTo('dataMahasiswa');
}
async function resetSandiMhs(nim) {
  const res = await callServer('resetPasswordMahasiswa', App.token, nim);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
}
async function toggleStatusMhs(nim, activate) {
  const res = await callServer('toggleStatusMahasiswa', App.token, nim, activate);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) navigateTo('dataMahasiswa');
}

function downloadTemplateExcel() {
  showToast('Memproses', 'Menyiapkan templat Excel...', 'info');
  callServer('generateTemplateMahasiswaXlsx', App.token).then(res => {
    if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
    downloadBase64(res.data.base64, res.data.fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast('Berhasil', 'Templat Excel diunduh. Isi kolom Matkul dengan Kode Mata Kuliah (pisahkan koma jika lebih dari satu), lalu unggah kembali lewat "Impor Excel".', 'success');
  }).catch(err => showToast('Gagal', String(err), 'danger'));
}

function openImportForm() {
  openModal(`<div class="p-6"><h3 class="font-display font-bold text-lg mb-2">Impor Data Mahasiswa</h3>
    <p class="text-xs text-on-surface-variant mb-4">Kolom wajib: NIM, Nama. Kolom lain: <b>Matkul</b> (Kode Mata Kuliah, pisahkan koma jika lebih dari satu), ProgramStudi, Angkatan, Semester, Kelas, Email. Jika mengimpor ulang NIM yang sama dengan Matkul berbeda, mata kuliahnya akan digabung (tidak menghapus yang lama). Gunakan file Excel/CSV asli (jangan hanya mengganti nama ekstensi file).</p>
    <input type="file" id="importFile" accept=".xlsx,.xls,.csv" class="w-full text-xs mb-4">
    <div id="importResult"></div>
    <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Tutup</button>
    <button id="importBtn" onclick="submitImport()" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Impor Sekarang</button></div>
  </div>`, '460px');
}
async function submitImport() {
  const file = document.getElementById('importFile').files[0];
  if (!file) { showToast('Peringatan', 'Pilih file Excel terlebih dahulu.', 'warning'); return; }
  const btn = document.getElementById('importBtn'); setLoading(btn, true);
  const dataUri = await readFileAsDataUri(file);
  const base64 = dataUri.split(',')[1];
  const res = await callServer('importMahasiswaFromExcel', App.token, base64, file.name);
  setLoading(btn, false);
  const box = document.getElementById('importResult');
  if (res.success) {
    box.innerHTML = `<div class="bg-surface-mint-tint text-primary rounded-lg p-3 text-xs mb-2">Berhasil: ${res.data.added} baru, ${res.data.updated} diperbarui, ${res.data.skipped} dilewati.
      ${res.data.errors.length ? '<ul class="mt-1 list-disc pl-4">' + res.data.errors.slice(0,5).map(e=>'<li>'+esc(e)+'</li>').join('') + '</ul>' : ''}</div>`;
    showToast('Berhasil', 'Impor selesai.', 'success');
  } else { box.innerHTML = errBox(res.message); }
}

// ============================================================
// PENGATURAN
// ============================================================
PAGES.pengaturan = async function () {
  const c = document.getElementById('app-container');
  const [pgRes, dosenRes] = await Promise.all([callServer('getPengaturan', App.token), callServer('getDosenProfile', App.token)]);
  const bobot = pgRes.data.bobot, dosen = dosenRes.data;
  c.innerHTML = pageHeader('Pengaturan', 'Atur bobot penilaian dan tanda tangan elektronik.') + `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-surface-card rounded-xl p-5 shadow-sm">
        <h3 class="font-display font-bold mb-3">Bobot Komponen Nilai (total harus 100%)</h3>
        <form id="bobotForm" onsubmit="return submitBobotForm(event)" class="space-y-2">
          ${['kehadiran','partisipasi','tugas','uts','uas'].map(k => `<div class="flex items-center justify-between gap-3">
            <label class="text-sm capitalize">${k === 'uts' ? 'UTS' : k === 'uas' ? 'UAS' : k}</label>
            <div class="flex items-center gap-1"><input type="number" id="bobot_${k}" value="${bobot[k]}" class="w-20 px-2 py-1.5 border border-border-subtle rounded-lg text-sm text-right"><span class="text-sm">%</span></div>
          </div>`).join('')}
          <button id="bobotBtn" class="w-full mt-3 py-2.5 bg-primary-container text-on-primary rounded-lg text-sm font-semibold">Simpan Bobot</button>
        </form>
      </div>
      <div class="bg-surface-card rounded-xl p-5 shadow-sm">
        <h3 class="font-display font-bold mb-3">Profil Dosen & Tanda Tangan Elektronik</h3>
        <form onsubmit="return submitDosenProfileForm(event)" class="space-y-3">
          <input id="dNama" value="${esc(dosen.nama)}" placeholder="Nama" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
          <input id="dNidn" value="${esc(dosen.nidn)}" readonly class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm bg-surface-canvas">
          <button type="button" onclick="openUbahUsernameForm()" class="text-xs font-semibold text-primary -mt-2">Ubah Username / NIDN Login</button>
          <input id="dJabatan" value="${esc(dosen.jabatan || '')}" placeholder="Jabatan" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
          <input id="dEmail" value="${esc(dosen.email || '')}" placeholder="Email" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
          <button id="dProfilBtn" class="w-full py-2.5 bg-surface-mint-tint text-primary rounded-lg text-sm font-semibold">Simpan Profil</button>
        </form>
        <hr class="my-4 border-border-subtle">
        <p class="text-xs text-on-surface-variant mb-2">Unggah gambar tanda tangan (latar transparan/putih), akan otomatis dipakai di setiap KHS.</p>
        ${dosen.ttdDataUri ? `<img src="${dosen.ttdDataUri}" class="h-14 mb-2 border border-border-subtle rounded p-1">` : ''}
        <input type="file" id="ttdFile" accept="image/*" onchange="uploadTtd(this)" class="w-full text-xs">
      </div>
    </div>`;
};
async function submitBobotForm(e) {
  e.preventDefault();
  const btn = document.getElementById('bobotBtn'); setLoading(btn, true);
  const bobot = {};
  ['kehadiran','partisipasi','tugas','uts','uas'].forEach(k => bobot[k] = Number(document.getElementById('bobot_' + k).value));
  const res = await callServer('updatePengaturan', App.token, bobot, null);
  setLoading(btn, false);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  return false;
}
async function submitDosenProfileForm(e) {
  e.preventDefault();
  const btn = document.getElementById('dProfilBtn'); setLoading(btn, true);
  const res = await callServer('saveDosenProfile', App.token, { nama: document.getElementById('dNama').value, jabatan: document.getElementById('dJabatan').value, email: document.getElementById('dEmail').value });
  setLoading(btn, false);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) App.nama = document.getElementById('dNama').value;
  return false;
}
async function uploadTtd(input) {
  const file = input.files[0];
  if (!file) return;
  const dataUri = await compressImage(file, 400, 0.8);
  const res = await callServer('saveTtdDosen', App.token, dataUri);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) navigateTo('pengaturan');
}

function openUbahUsernameForm() {
  openModal(`<div class="p-6"><h3 class="font-display font-bold text-lg mb-2">Ubah Username / NIDN Login</h3>
    <p class="text-xs text-on-surface-variant mb-4">Ini adalah username yang dipakai untuk masuk ke aplikasi. Masukkan sandi Anda saat ini untuk konfirmasi.</p>
    <form onsubmit="return submitUbahUsername(event)" class="space-y-3">
      <input required id="newUsernameInput" placeholder="Username / NIDN baru" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <input required type="password" id="confirmPassUsername" placeholder="Sandi Anda saat ini" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      <p id="ubahUserErr" class="text-status-error text-xs hidden"></p>
      <div class="flex gap-2 pt-2"><button type="button" onclick="closeModal()" class="flex-1 py-2.5 rounded-lg border border-border-subtle text-sm font-semibold">Batal</button>
      <button id="ubahUserBtn" class="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold">Simpan</button></div>
    </form></div>`, '420px');
}
async function submitUbahUsername(e) {
  e.preventDefault();
  const btn = document.getElementById('ubahUserBtn'); setLoading(btn, true);
  const res = await callServer('updateDosenUsername', App.token, document.getElementById('newUsernameInput').value, document.getElementById('confirmPassUsername').value);
  setLoading(btn, false);
  if (res.success) { closeModal(); showToast('Berhasil', res.message, 'success'); navigateTo('pengaturan'); }
  else { const err = document.getElementById('ubahUserErr'); err.textContent = res.message; err.classList.remove('hidden'); }
  return false;
}


// ============================================================
// PROFIL (BERSAMA DOSEN & MAHASISWA)
// ============================================================
PAGES.profil = async function () {
  const c = document.getElementById('app-container');
  const profileRes = App.role === 'dosen' ? await callServer('getDosenProfile', App.token) : await callServer('getMahasiswaProfile', App.token);
  const p = profileRes.data || {};
  c.innerHTML = pageHeader('Profil Saya', 'Kelola foto profil dan sandi Anda.') + `
    <div class="bg-surface-card rounded-xl p-6 shadow-sm max-w-lg">
      <div class="flex items-center gap-4 mb-5">
        <div class="relative">
          <img id="profilFotoPreview" src="${App.fotoDataUri || placeholderAvatar()}" class="w-20 h-20 rounded-full object-cover border border-border-subtle">
          <label class="absolute -bottom-1 -right-1 bg-primary-container text-on-primary rounded-full p-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">photo_camera</span>
            <input type="file" accept="image/*" class="hidden" onchange="handleProfilFoto(this)">
          </label>
        </div>
        <div><p class="font-display font-bold text-lg">${esc(App.nama)}</p><p class="text-sm text-on-surface-variant">${App.role === 'dosen' ? 'NIDN: ' + esc(p.nidn) : 'NIM: ' + esc(p.nim)}</p></div>
      </div>
      <div class="text-sm space-y-1 mb-5 text-on-surface-variant">
        ${App.role === 'mahasiswa' ? `<p>Program Studi: ${esc(p.programStudi)}</p><p>Semester ${esc(p.semester)} · Kelas ${esc(p.kelas)}</p><p>Email: ${esc(p.email || '-')}</p>` : `<p>Jabatan: ${esc(p.jabatan || '-')}</p><p>Email: ${esc(p.email || '-')}</p>`}
      </div>
      <hr class="border-border-subtle mb-4">
      <h4 class="font-semibold text-sm mb-2">Ganti Sandi</h4>
      <form onsubmit="return submitChangePasswordProfil(event)" class="space-y-2">
        <input required type="password" id="oldPass" placeholder="Sandi lama" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <input required type="password" minlength="4" id="newPassP" placeholder="Sandi baru" class="w-full px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
        <button id="cpProfilBtn" class="w-full py-2.5 bg-surface-mint-tint text-primary rounded-lg text-sm font-semibold">Ganti Sandi</button>
      </form>
      <button onclick="doLogoutFlow()" class="w-full mt-4 py-2.5 bg-error-container text-error rounded-lg text-sm font-semibold md:hidden">Keluar</button>
    </div>`;
};
async function handleProfilFoto(input) {
  const file = input.files[0];
  if (!file) return;
  const dataUri = await compressImage(file, 200, 0.6);
  document.getElementById('profilFotoPreview').src = dataUri;
  const res = await callServer('updateFotoProfil', App.token, dataUri);
  if (res.success) { App.fotoDataUri = dataUri; renderTopHeader(); showToast('Berhasil', 'Foto profil diperbarui.', 'success'); }
  else showToast('Gagal', res.message, 'danger');
}
async function submitChangePasswordProfil(e) {
  e.preventDefault();
  const btn = document.getElementById('cpProfilBtn'); setLoading(btn, true);
  const res = await callServer('changePassword', App.token, document.getElementById('oldPass').value, document.getElementById('newPassP').value);
  setLoading(btn, false);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) e.target.reset();
  return false;
}

// ============================================================
// NOTIFIKASI
// ============================================================
PAGES.notifikasi = async function () {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Notifikasi', '');
  try {
    const res = await callServer('listNotifikasi', App.token);
    if (!res.success) { c.innerHTML += errBox(res.message); return; }
    c.innerHTML += `<div class="bg-surface-card rounded-xl shadow-sm divide-y divide-border-subtle">
      ${res.data.length ? res.data.map(n => `<div class="p-4 flex items-start gap-3 ${n.dibaca ? '' : 'bg-surface-mint-tint/40'}" onclick="markNotifRead('${n.id}')">
        <span class="material-symbols-outlined text-primary mt-0.5">${n.tipe === 'tugas' ? 'assignment' : n.tipe === 'nilai' ? 'grade' : n.tipe === 'materi' ? 'folder' : 'notifications'}</span>
        <div class="flex-1"><p class="text-sm font-semibold">${esc(n.judul)}</p><p class="text-sm text-on-surface-variant">${esc(n.isi)}</p><p class="text-xs text-on-surface-variant mt-1">${fmtDateTime(n.waktu)}</p></div>
      </div>`).join('') : emptyState('notifications_off', 'Belum ada notifikasi.')}
    </div>`;
  } catch (err) {
    c.innerHTML += errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
};
async function markNotifRead(id) { await callServer('markNotifikasiDibaca', App.token, id); refreshNotifDot(); }


// ============================================================
// BERANDA MAHASISWA
// ============================================================
PAGES.beranda = async function () {
  const c = document.getElementById('app-container');
  const dash = await callServer('getDashboardMahasiswa', App.token);
  if (!dash.success) { c.innerHTML = errBox(dash.message); return; }
  const d = dash.data;
  c.innerHTML = `
    <div class="bg-gradient-to-br from-primary-container to-primary rounded-xl p-5 text-on-primary mb-4">
      <div class="flex items-center justify-between mb-3">
        <span class="badge-pill bg-white/15 text-white">Semester ${esc(d.mhs.semester)} · Kelas ${esc(d.mhs.kelas)}</span>
        <span class="text-xs opacity-80">${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}</span>
      </div>
      <p class="text-sm opacity-90">Selamat datang,</p>
      <p class="font-display text-xl font-bold">${esc(d.mhs.nama)}</p>
      <p class="text-xs opacity-80 mt-1">NIM ${esc(d.mhs.nim)} · ${esc(d.mhs.programStudi)}</p>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      ${metricCard('menu_book', 'Mata Kuliah', d.totalMk, 'Diikuti semester ini')}
      ${metricCard('how_to_reg', 'Rata Kehadiran', n2(d.persenKehadiran) + '%', 'Seluruh mata kuliah')}
    </div>
    <div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">
      <h3 class="font-display font-bold mb-3">Tugas Belum Dikumpulkan</h3>
      ${d.tugasBelum.length ? d.tugasBelum.map(t => `<div class="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
        <div><p class="text-sm font-medium">${esc(t.judul)}</p><p class="text-xs text-on-surface-variant">Batas: ${esc(t.batasWaktu)}</p></div>
        <button onclick="navigateTo('tugasSaya')" class="text-xs font-semibold text-primary">Kumpulkan</button>
      </div>`).join('') : emptyState('task_alt', 'Semua tugas sudah dikumpulkan. Mantap!')}
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button onclick="navigateTo('presensiSaya')" class="bg-surface-card rounded-xl p-4 shadow-sm flex flex-col items-center gap-1"><span class="material-symbols-outlined text-primary">how_to_reg</span><span class="text-xs font-medium">Presensi</span></button>
      <button onclick="navigateTo('tugasSaya')" class="bg-surface-card rounded-xl p-4 shadow-sm flex flex-col items-center gap-1"><span class="material-symbols-outlined text-primary">assignment</span><span class="text-xs font-medium">Tugas</span></button>
      <button onclick="navigateTo('nilaiKhs')" class="bg-surface-card rounded-xl p-4 shadow-sm flex flex-col items-center gap-1"><span class="material-symbols-outlined text-primary">school</span><span class="text-xs font-medium">Nilai/KHS</span></button>
      <button onclick="navigateTo('notifikasi')" class="bg-surface-card rounded-xl p-4 shadow-sm flex flex-col items-center gap-1"><span class="material-symbols-outlined text-primary">notifications</span><span class="text-xs font-medium">Notifikasi</span></button>
    </div>`;
};

// ============================================================
// PRESENSI SAYA (MAHASISWA)
// ============================================================
PAGES.presensiSaya = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Presensi Saya', 'Rekap kehadiran Anda per mata kuliah.');
  const mkRes = await callServer('listMataKuliah', App.token);
  if (!mkRes.success) { c.innerHTML += errBox(mkRes.message); return; }
  const selected = params.mkId || (mkRes.data[0] && mkRes.data[0].id);
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">
    <select onchange="loadPresensiSayaDetail(this.value)" class="w-full sm:w-80 px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      ${mkRes.data.map(mk => `<option value="${mk.id}" ${mk.id === selected ? 'selected' : ''}>${esc(mk.namaMk)}</option>`).join('')}
    </select>
  </div><div id="presensiSayaBody"></div>`;
  if (selected) loadPresensiSayaDetail(selected);
  else document.getElementById('presensiSayaBody').innerHTML = emptyState('menu_book', 'Belum ada mata kuliah pada semester Anda.');
};
async function loadPresensiSayaDetail(mkId) {
  const body = document.getElementById('presensiSayaBody');
  body.innerHTML = '<div class="skeleton h-56"></div>';
  try {
    const res = await callServer('getRekapPresensiMahasiswa', App.token, mkId, null);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    const hadir = res.data.filter(d => d.status === 'Hadir').length;
    const total = res.data.filter(d => d.status !== '-').length || res.data.length;
    body.innerHTML = `<div class="bg-surface-card rounded-xl p-5 shadow-sm">
      <p class="text-sm text-on-surface-variant mb-3">Kehadiran: <span class="font-semibold text-primary">${hadir}/${total} pertemuan</span></p>
      <div class="space-y-1.5">
        ${res.data.map(p => `<div class="flex items-center justify-between border-b border-border-subtle py-2 text-sm">
          <span>P-${p.nomor}${p.topik ? ': ' + esc(p.topik) : ''}</span>
          <span class="badge-pill ${p.status === 'Hadir' ? 'bg-surface-mint-tint text-primary' : p.status === 'Alpa' ? 'bg-error-container text-error' : p.status === '-' ? 'bg-surface-canvas text-on-surface-variant' : 'bg-status-warning/15 text-status-warning'}">${esc(p.status)}</span>
        </div>`).join('')}
      </div>
    </div>`;
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}

// ============================================================
// TUGAS SAYA (MAHASISWA)
// ============================================================
PAGES.tugasSaya = async function (params) {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Tugas Saya', 'Kumpulkan tugas sebelum batas waktu.');
  const mkRes = await callServer('listMataKuliah', App.token);
  if (!mkRes.success) { c.innerHTML += errBox(mkRes.message); return; }
  const selected = params.mkId || (mkRes.data[0] && mkRes.data[0].id);
  c.innerHTML += `<div class="bg-surface-card rounded-xl p-5 shadow-sm mb-4">
    <select onchange="loadTugasSaya(this.value)" class="w-full sm:w-80 px-3 py-2.5 border border-border-subtle rounded-lg text-sm">
      ${mkRes.data.map(mk => `<option value="${mk.id}" ${mk.id === selected ? 'selected' : ''}>${esc(mk.namaMk)}</option>`).join('')}
    </select>
  </div><div id="tugasSayaBody"></div>`;
  if (selected) loadTugasSaya(selected);
  else document.getElementById('tugasSayaBody').innerHTML = emptyState('menu_book', 'Belum ada mata kuliah pada semester Anda.');
};
async function loadTugasSaya(mkId) {
  const body = document.getElementById('tugasSayaBody');
  body.innerHTML = '<div class="skeleton h-56"></div>';
  try {
    const res = await callServer('listTugas', App.token, mkId);
    if (!res.success) { body.innerHTML = errBox(res.message); return; }
    body.innerHTML = res.data.length ? `<div class="space-y-3">${res.data.map(t => `
      <div class="bg-surface-card rounded-xl p-4 shadow-sm">
        <p class="font-semibold text-sm">${esc(t.judul)}</p>
        <p class="text-xs text-on-surface-variant mt-0.5">${esc(t.instruksi || '')}</p>
        <p class="text-xs text-on-surface-variant mt-0.5">Batas waktu: ${esc(t.batasWaktu)}</p>
        ${t.pengumpulan ? `<div class="mt-2 flex items-center gap-2 text-xs text-primary font-semibold"><span class="material-symbols-outlined text-[16px]">check_circle</span> Terkumpul: ${esc(t.pengumpulan.fileName)} ${t.pengumpulan.nilai !== '' && t.pengumpulan.nilai != null ? '· Nilai: ' + t.pengumpulan.nilai : '(belum dinilai)'}</div>` : ''}
        <div class="mt-3 flex items-center gap-2">
          <input type="file" id="file_${t.id}" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="text-xs flex-1">
          <button onclick="submitTugasSaya('${t.id}','${mkId}')" class="px-3 py-1.5 bg-primary-container text-on-primary rounded-lg text-xs font-semibold">${t.pengumpulan ? 'Ganti Berkas' : 'Kumpulkan'}</button>
        </div>
      </div>`).join('')}</div>` : emptyState('assignment', 'Belum ada tugas untuk mata kuliah ini.');
  } catch (err) {
    body.innerHTML = errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
}
async function submitTugasSaya(tugasId, mkId) {
  const input = document.getElementById('file_' + tugasId);
  const file = input.files[0];
  if (!file) { showToast('Peringatan', 'Pilih file terlebih dahulu.', 'warning'); return; }
  if (file.size > 8 * 1024 * 1024) { showToast('Peringatan', 'Ukuran file maksimal 8MB.', 'warning'); return; }
  const dataUri = await readFileAsDataUri(file);
  const res = await callServer('submitTugas', App.token, tugasId, dataUri, file.name);
  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) loadTugasSaya(mkId);
}

// ============================================================
// NILAI & KHS (MAHASISWA)
// ============================================================
PAGES.nilaiKhs = async function () {
  const c = document.getElementById('app-container');
  c.innerHTML = pageHeader('Nilai & KHS', 'Lihat nilai dan unduh KHS setelah dipublikasikan dosen.');
  try {
    const mkRes = await callServer('listMataKuliah', App.token);
    if (!mkRes.success) { c.innerHTML += errBox(mkRes.message); return; }
    const rows = await Promise.all(mkRes.data.map(async mk => ({ mk, nilai: (await callServer('getNilaiMahasiswa', App.token, mk.id)).data })));
    c.innerHTML += `<div class="space-y-3">${rows.length ? rows.map(({ mk, nilai }) => `
      <div class="bg-surface-card rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div><p class="font-semibold text-sm">${esc(mk.namaMk)}</p><p class="text-xs text-on-surface-variant">${esc(mk.semesterLabel)}</p></div>
        ${nilai ? `<div class="flex items-center gap-3">
          <span class="badge-pill ${hurufBadgeClass(nilai.huruf)}">${esc(nilai.huruf)} · ${n2(nilai.nilaiAkhir)}</span>
          <button onclick="unduhKhsSaya('${mk.id}')" class="px-3 py-1.5 bg-primary-container text-on-primary rounded-lg text-xs font-semibold">Unduh KHS</button>
        </div>` : '<span class="text-xs text-on-surface-variant">Belum dipublikasikan</span>'}
      </div>`).join('') : emptyState('school', 'Belum ada mata kuliah pada semester Anda.')}</div>`;
  } catch (err) {
    c.innerHTML += errBox('Terjadi kesalahan tak terduga: ' + (err && err.message ? err.message : err));
  }
};
async function unduhKhsSaya(mkId) {
  showToast('Memproses', 'Menyiapkan KHS...', 'info');
  const res = await callServer('generateKhsPdf', App.token, mkId, null);
  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
  downloadBase64(res.data.base64, res.data.fileName, 'application/pdf');
  showToast('Berhasil', 'KHS berhasil diunduh.', 'success');
}
