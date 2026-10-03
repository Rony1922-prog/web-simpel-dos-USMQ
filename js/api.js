// ============================================================
// API BRIDGE — menggantikan google.script.run dengan fetch() REST
// ============================================================
// Dipakai persis seperti sebelumnya di seluruh app.js:
//   const res = await callServer('namaFungsi', arg1, arg2, ...);
// sehingga seluruh logika halaman di app.js TIDAK perlu diubah sama sekali.

// ── Cache ringan di sisi browser ──
// Beberapa data (daftar mata kuliah, pengaturan) jarang berubah tapi sering diminta ulang
// setiap pindah halaman. Menyimpannya sebentar membuat navigasi terasa instan, dan hanya
// benar-benar menghubungi server lagi setelah cache kedaluwarsa atau sengaja dibersihkan
// (misalnya setelah menyimpan data baru).
const CACHEABLE_ACTIONS = { listMataKuliah: 20000, getPengaturan: 60000, getPublicInfo: 300000 };
const __cacheStore = {};
function cacheKey(fnName, args) { return fnName + ':' + JSON.stringify(args); }
function invalidateCache(fnName) {
  Object.keys(__cacheStore).forEach(k => { if (k.indexOf(fnName + ':') === 0) delete __cacheStore[k]; });
}
function clearAllCache() { Object.keys(__cacheStore).forEach(k => delete __cacheStore[k]); }

function callServer(fnName, ...args) {
  if (!GAS_URL || GAS_URL.indexOf('PASTE_URL') > -1) {
    console.error('GAS_URL belum diisi di js/config.js');
    return Promise.resolve({ success: false, data: null, message: 'Aplikasi belum terhubung ke backend. Hubungi admin (GAS_URL belum diisi).' });
  }
  const ttl = CACHEABLE_ACTIONS[fnName];
  const key = ttl ? cacheKey(fnName, args) : null;
  if (key && __cacheStore[key] && (Date.now() - __cacheStore[key].time) < ttl) {
    return Promise.resolve(__cacheStore[key].data);
  }
  return fetch(GAS_URL, {
    method: 'POST',
    // WAJIB text/plain — kalau pakai application/json, browser mengirim
    // CORS preflight (OPTIONS) yang tidak direspons Google Apps Script.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: fnName, params: args })
  })
    .then(res => res.json())
    .then(json => {
      if (json === null || json === undefined) {
        console.warn('[callServer] ' + fnName + ' mengembalikan respon kosong.');
        return { success: false, data: null, message: 'Server tidak memberi respon untuk "' + fnName + '". Coba muat ulang halaman.' };
      }
      if (key && json.success) { __cacheStore[key] = { data: json, time: Date.now() }; }
      return json;
    })
    .catch(err => {
      console.error('[callServer] ' + fnName + ' gagal:', err);
      return { success: false, data: null, message: 'Gagal menghubungi server: ' + err.message };
    });
}
