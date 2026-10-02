// ============================================================
// API BRIDGE — menggantikan google.script.run dengan fetch() REST
// ============================================================
// Dipakai persis seperti sebelumnya di seluruh app.js:
//   const res = await callServer('namaFungsi', arg1, arg2, ...);
// sehingga seluruh logika halaman di app.js TIDAK perlu diubah sama sekali.

function callServer(fnName, ...args) {
  if (!GAS_URL || GAS_URL.indexOf('PASTE_URL') > -1) {
    console.error('GAS_URL belum diisi di js/config.js');
    return Promise.resolve({ success: false, data: null, message: 'Aplikasi belum terhubung ke backend. Hubungi admin (GAS_URL belum diisi).' });
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
      return json;
    })
    .catch(err => {
      console.error('[callServer] ' + fnName + ' gagal:', err);
      return { success: false, data: null, message: 'Gagal menghubungi server: ' + err.message };
    });
}
