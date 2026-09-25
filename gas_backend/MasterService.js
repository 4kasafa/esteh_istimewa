/**
 * Layanan CRUD data master: User, Cabang, Bahan Baku, Tipe Pengeluaran, Sumber Pemasukan
 */

function handleReadMaster_(session) {
  // Hanya admin yang bisa membaca seluruh data master
  ensureAdmin_(session);

  // ponytail: snapshot 5 tab dari cache (TTL 300s) — 5 getValues → 1 cache.get.
  const snap = readMasterSnapshot_();

  // ponytail: tanpa backfill tulis di jalur baca (hemat 2 scan + N setValue + flush).
  // Backfill eksplisit via update_master / setup saja.
  const rawUsers = snap.user;
  const safeUsers = rawUsers.map(u => {
    const rawRole = String(u.ROLE || u.role || "Staff").trim().toLowerCase();
    const resolvedRole = rawRole.includes("admin") ? "Admin" : "Staff";
    const rawNama = u["NAMA / USERNAME"] ?? u["NAMA/USERNAME"] ?? u.NAMA ?? u.USERNAME ?? u.username ?? "";
    const nama = String(rawNama || "").trim();
    const id = String(u.ID ?? u.id ?? "").trim();
    const rawTelepon = u["NO. TELEPON"] ?? u["NO_TELEPON"] ?? u.TELEPON ?? u.telepon ?? "";
    const telepon = String(rawTelepon || "").trim();
    const status = String(u.STATUS || u.status || "Aktif").trim();

    return {
      _rowIndex: u._rowIndex,
      ID: id,
      id: id,
      "NAMA / USERNAME": nama,
      USERNAME: nama,
      username: nama,
      NAMA: nama,
      nama: nama,
      "NO. TELEPON": telepon,
      telepon: telepon,
      ROLE: resolvedRole,
      role: resolvedRole,
      STATUS: (status.toLowerCase() === "aktif" || status.toLowerCase() === "active") ? "Aktif" : "Non Aktif",
      status: (status.toLowerCase() === "aktif" || status.toLowerCase() === "active") ? "Aktif" : "Non Aktif"
    };
  });

  return jsonResponse_(true, {
    users: safeUsers,
    cabang: snap.cabang,
    bahanBaku: snap.bahanBaku,
    tipePengeluaran: snap.tipePengeluaran,
    sumberPemasukan: snap.sumberPemasukan
  }, "Data master berhasil dimuat.");
}

function handleUpdateMaster_(payload, session) {
  ensureAdmin_(session);

  const target = sanitize_(payload.target).toLowerCase();
  const operation = sanitize_(payload.operation || payload.action).toLowerCase();
  const item = Object.assign({}, payload.data || {});

  let tabName = "";
  let idField = "";

  switch (target) {
    case "user":
      tabName = APP_CONFIG.MASTER_TABS.USER;
      idField = "ID";
      break;
    case "cabang":
      tabName = APP_CONFIG.MASTER_TABS.CABANG;
      idField = "ID_CABANG";
      break;
    case "bahan_baku":
    case "bahan":
      tabName = APP_CONFIG.MASTER_TABS.BAHAN_BAKU;
      idField = "ID_BAHAN";
      delete item.STATUS;
      delete item.status;
      break;
    case "tipe_pengeluaran":
    case "pengeluaran":
      tabName = APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN;
      idField = "ID_TIPE";
      delete item.STATUS;
      delete item.status;
      break;
    case "sumber_pemasukan":
    case "pemasukan":
      tabName = APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN;
      idField = "ID_SUMBER";
      break;
    default:
      return jsonResponse_(false, null, "Target master tidak valid: " + target);
  }

  const sheet = getMasterSheet_(tabName);
  const headers = getTableHeaders_(sheet);
  const rows = readTable_(sheet);

  // ponytail: bulk create (SetupWizard) — 1 request ganti N request serial.
  if (Array.isArray(payload.data)) {
    return handleCreateManyMaster_(session, target, tabName, idField, sheet, headers, rows, payload.data);
  }

  // Normalisasi data khusus per target
  // Normalisasi data khusus per target
  if (target === "user") {
    if (!item.ID || !String(item.ID).toUpperCase().startsWith("USR-")) {
      let maxNum = 0;
      rows.forEach(r => {
        const m = String(r.ID || "").match(/USR-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      item.ID = "USR-" + String(maxNum + 1).padStart(3, "0");
    }

    const namaVal = item["NAMA / USERNAME"] || item.nama || item.USERNAME || item.username;
    if (namaVal) {
      item["NAMA / USERNAME"] = namaVal;
    }
    const teleponVal = item["NO. TELEPON"] || item["NO TELEPON"] || item.telepon || item.phone || "-";
    item["NO. TELEPON"] = teleponVal;

    const rawRole = String(item.ROLE || item.role || "Staff").toLowerCase();
    item.ROLE = rawRole.includes("admin") ? "Admin" : "Staff";

    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";

    item.PASSWORD = String(item.PASSWORD || item.password || item.sandi || item.SANDI || "123456").trim();
  } else if (target === "cabang") {
    item.NAMA_CABANG = item.NAMA_CABANG || item.nama || item.NAMA || item.kode || "";
    item.ALAMAT = item.ALAMAT || item.alamat || "-";
    if (!item.ID_CABANG || !String(item.ID_CABANG).toUpperCase().startsWith("CAB-")) {
      let maxNum = 0;
      rows.forEach(r => {
        const m = String(r.ID_CABANG || "").match(/CAB-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      item.ID_CABANG = "CAB-" + String(maxNum + 1).padStart(2, "0");
    }
    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";
  } else if (target === "bahan_baku" || target === "bahan") {
    item.NAMA_BAHAN = item.NAMA_BAHAN || item.nama || item.NAMA || "";
    item.SATUAN = item.SATUAN || item.satuan || "Pcs";
    if (!item.ID_BAHAN || !String(item.ID_BAHAN).toUpperCase().startsWith("BAHAN-")) {
      let maxNum = 0;
      rows.forEach(r => {
        const m = String(r.ID_BAHAN || "").match(/BAHAN-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      item.ID_BAHAN = "BAHAN-" + String(maxNum + 1).padStart(2, "0");
    }
  } else if (target === "tipe_pengeluaran" || target === "pengeluaran") {
    item.NAMA_TIPE = item.NAMA_TIPE || item.nama || item.NAMA || "";
    if (!item.ID_TIPE || !String(item.ID_TIPE).toUpperCase().startsWith("EXP-")) {
      let maxNum = 0;
      rows.forEach(r => {
        const m = String(r.ID_TIPE || "").match(/EXP-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      item.ID_TIPE = "EXP-" + String(maxNum + 1).padStart(2, "0");
    }
  } else if (target === "sumber_pemasukan" || target === "pemasukan") {
    item.NAMA_SUMBER = item.NAMA_SUMBER || item.nama || item.NAMA || "";
    if (!item.ID_SUMBER || !String(item.ID_SUMBER).toUpperCase().startsWith("INC-")) {
      let maxNum = 0;
      rows.forEach(r => {
        const m = String(r.ID_SUMBER || "").match(/INC-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      item.ID_SUMBER = "INC-" + String(maxNum + 1).padStart(2, "0");
    }
    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";
  }

  if (operation === "create") {
    // Validasi duplikasi ID atau Nama untuk seluruh entitas master
    const existing = rows.find(r => {
      const matchId = item[idField] && String(r[idField] || "").toLowerCase() === String(item[idField] || "").toLowerCase();
      if (matchId) return true;
      if (target === "user") {
        const uName = String(r["NAMA / USERNAME"] || r.USERNAME || "").trim().toLowerCase();
        const curName = String(item["NAMA / USERNAME"] || item.USERNAME || "").trim().toLowerCase();
        return uName && curName && uName === curName;
      }
      if (target === "cabang") {
        const cName = String(r.NAMA_CABANG || "").trim().toLowerCase();
        const curName = String(item.NAMA_CABANG || "").trim().toLowerCase();
        return cName && curName && cName === curName;
      }
      if (target === "bahan_baku" || target === "bahan") {
        const bName = String(r.NAMA_BAHAN || "").trim().toLowerCase();
        const curName = String(item.NAMA_BAHAN || "").trim().toLowerCase();
        return bName && curName && bName === curName;
      }
      if (target === "tipe_pengeluaran" || target === "pengeluaran") {
        const tName = String(r.NAMA_TIPE || "").trim().toLowerCase();
        const curName = String(item.NAMA_TIPE || "").trim().toLowerCase();
        return tName && curName && tName === curName;
      }
      if (target === "sumber_pemasukan" || target === "pemasukan") {
        const sName = String(r.NAMA_SUMBER || "").trim().toLowerCase();
        const curName = String(item.NAMA_SUMBER || "").trim().toLowerCase();
        return sName && curName && sName === curName;
      }
      return false;
    });

    if (existing) {
      // ponytail: idempoten — retry yang dobel dianggap sukses, bukan error.
      return jsonResponse_(true, existing, "Data " + target + " sudah tersimpan sebelumnya.");
    }

    appendTableRow_(sheet, headers, item);

    // Auto-sync Cabang -> Sumber Pemasukan
    if (target === "cabang") {
      syncCabangToSumberPemasukan_(item.NAMA_CABANG, item.STATUS || "Aktif");
    }

    // Auto-sync Bahan Baku -> Tipe Pengeluaran & Header Transaksi
    if (target === "bahan_baku" || target === "bahan") {
      syncBahanBakuToTipePengeluaran_(item.NAMA_BAHAN);
      try {
        const curSs = getOrCreateMonthlySpreadsheet_(getCurrentPeriod_(), { skipEnsure: true });
        const tSheet = curSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
        if (tSheet) syncMonthlyTransaksiHeaders_(tSheet);
      } catch (eBahanSync) {
        console.warn("Gagal sinkronisasi kolom transaksi saat tambah bahan:", eBahanSync);
      }
    }

    invalidateMasterCache_();
    return jsonResponse_(true, item, "Data master " + target + " berhasil ditambahkan.");
  }

  if (operation === "update") {
    const targetId = sanitize_(item[idField] || item.id || payload.id);
    const existing = rows.find(r => {
      if (String(r[idField] || "").toLowerCase() === targetId.toLowerCase()) return true;
      if (target === "user") {
        const uName = String(r["NAMA / USERNAME"] || r.USERNAME || "").toLowerCase();
        return uName === targetId.toLowerCase();
      }
      return false;
    });

    if (!existing) {
      return jsonResponse_(false, null, "Data master " + target + " dengan ID " + targetId + " tidak ditemukan.");
    }

    // Cegah duplikasi nama pada baris lain saat update
    const duplicate = rows.find(r => {
      if (r._rowIndex === existing._rowIndex) return false;
      if (target === "user") {
        const uName = String(r["NAMA / USERNAME"] || r.USERNAME || "").trim().toLowerCase();
        const curName = String(item["NAMA / USERNAME"] || item.USERNAME || "").trim().toLowerCase();
        return uName && curName && uName === curName;
      }
      if (target === "cabang") {
        const cName = String(r.NAMA_CABANG || "").trim().toLowerCase();
        const curName = String(item.NAMA_CABANG || "").trim().toLowerCase();
        return cName && curName && cName === curName;
      }
      if (target === "bahan_baku" || target === "bahan") {
        const bName = String(r.NAMA_BAHAN || "").trim().toLowerCase();
        const curName = String(item.NAMA_BAHAN || "").trim().toLowerCase();
        return bName && curName && bName === curName;
      }
      if (target === "tipe_pengeluaran" || target === "pengeluaran") {
        const tName = String(r.NAMA_TIPE || "").trim().toLowerCase();
        const curName = String(item.NAMA_TIPE || "").trim().toLowerCase();
        return tName && curName && tName === curName;
      }
      if (target === "sumber_pemasukan" || target === "pemasukan") {
        const sName = String(r.NAMA_SUMBER || "").trim().toLowerCase();
        const curName = String(item.NAMA_SUMBER || "").trim().toLowerCase();
        return sName && curName && sName === curName;
      }
      return false;
    });

    if (duplicate) {
      return jsonResponse_(false, null, "Data master " + target + " dengan nama tersebut sudah digunakan oleh data lain.");
    }

    const updated = Object.assign({}, existing, item);
    updateTableRow_(sheet, headers, existing._rowIndex, updated);

    // ponytail: Non Aktif / ganti password → cabut sesi permanen seketika.
    if (target === "user") {
      const wasNonAktif = String(updated.STATUS || updated.status || "").toLowerCase().indexOf("non") !== -1;
      const oldPass = String(existing.PASSWORD || existing.password || "").trim();
      const newPass = String(updated.PASSWORD || updated.password || "").trim();
      const passChanged = newPass && oldPass && newPass !== oldPass;
      if (wasNonAktif || passChanged) {
        revokeUserSessions_(existing["NAMA / USERNAME"] || existing.USERNAME || existing.username || updated["NAMA / USERNAME"] || updated.USERNAME);
      }
    }

    // Auto-sync jika Cabang diupdate (mendukung rename)
    if (target === "cabang") {
      syncCabangToSumberPemasukan_(updated.NAMA_CABANG, updated.STATUS || "Aktif", existing.NAMA_CABANG);
      // Sebarkan perubahan nama ke seluruh file bulanan & rebuild Rekapitulasi
      if (String(existing.NAMA_CABANG || "").trim() !== String(updated.NAMA_CABANG || "").trim()) {
        try {
          syncCabangRenameToMonthlyFiles_(existing.NAMA_CABANG, updated.NAMA_CABANG);
        } catch (renameErr) {
          console.error("Gagal sinkronisasi rename cabang ke file bulanan:", renameErr);
        }
      }
    }

    // Auto-sync jika Bahan Baku diupdate (mendukung rename)
    if (target === "bahan_baku" || target === "bahan") {
      syncBahanBakuToTipePengeluaran_(updated.NAMA_BAHAN, existing.NAMA_BAHAN);
      try {
        const curSs = getOrCreateMonthlySpreadsheet_(getCurrentPeriod_(), { skipEnsure: true });
        const tSheet = curSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
        if (tSheet) syncMonthlyTransaksiHeaders_(tSheet);
      } catch (eBahanSync) {
        console.warn("Gagal sinkronisasi kolom transaksi saat update bahan:", eBahanSync);
      }
    }

    invalidateMasterCache_();
    return jsonResponse_(true, updated, "Data master " + target + " berhasil diperbarui.");
  }

  if (operation === "delete") {
    const targetId = sanitize_(item[idField] || item.id || payload.id);
    const rowIndex = parseNumber_(payload.rowIndex || payload._rowIndex || item.rowIndex || item._rowIndex || 0);

    // Primary lookup by Stable ID
    let existing = rows.find(r => {
      if (targetId && String(r[idField] || "").toLowerCase() === targetId.toLowerCase()) return true;
      if (target === "user") {
        const uName = String(r["NAMA / USERNAME"] || r.USERNAME || "").toLowerCase();
        return uName && uName === targetId.toLowerCase();
      }
      return false;
    });

    // Fallback: physical row index (for legacy or strictly indexed rows)
    if (!existing && rowIndex > 1) {
      existing = rows.find(r => r._rowIndex === rowIndex);
    }

    // Last resort: natural name match (best effort)
    if (!existing) {
      const targetName = String(item.NAMA_CABANG || item.NAMA_BAHAN || item["NAMA / USERNAME"] || item.USERNAME || "").trim().toLowerCase();
      if (targetName) {
        existing = rows.find(r => {
          const rowName = String(r.NAMA_CABANG || r.NAMA_BAHAN || r["NAMA / USERNAME"] || r.USERNAME || "").trim().toLowerCase();
          return rowName && rowName === targetName;
        });
      }
    }

    if (!existing) {
      return jsonResponse_(false, null, "Data master " + target + " dengan ID " + (targetId || rowIndex) + " tidak ditemukan.");
    }

    // Proteksi khusus user
    if (target === "user") {
      const curUser = String(session.username || session.nama || "").trim().toLowerCase();
      const targetUser = String(existing["NAMA / USERNAME"] || existing.USERNAME || "").trim().toLowerCase();
      if (curUser && targetUser && curUser === targetUser) {
        return jsonResponse_(false, null, "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.");
      }

      const role = String(existing.ROLE || "").toLowerCase();
      if (role === "admin") {
        const activeAdmins = rows.filter(r => 
          String(r.ROLE || "").toLowerCase() === "admin" && 
          String(r.STATUS || "").toLowerCase() === "aktif"
        );
        if (activeAdmins.length <= 1) {
          return jsonResponse_(false, null, "Tidak dapat menghapus akun admin terakhir pada sistem.");
        }
      }
    }

    // Proteksi khusus cabang
    if (target === "cabang") {
      if (rows.length <= 1) {
        return jsonResponse_(false, null, "Tidak dapat menghapus outlet cabang terakhir pada sistem.");
      }
    }

    deleteTableRow_(sheet, existing._rowIndex);

    // ponytail: user dihapus → cabut sesi juga (anti orphan login permanen).
    if (target === "user") {
      revokeUserSessions_(existing["NAMA / USERNAME"] || existing.USERNAME || existing.username);
    }

    // Jika Cabang dihapus, nonaktifkan di Sumber Pemasukan
    if (target === "cabang" && existing.NAMA_CABANG) {
      syncCabangToSumberPemasukan_(existing.NAMA_CABANG, "Non Aktif");
    }

    // Jika Bahan Baku dihapus, sinkronkan dan pangkas kolom di Transaksi
    if (target === "bahan_baku" || target === "bahan") {
      try {
        const curSs = getOrCreateMonthlySpreadsheet_(getCurrentPeriod_(), { skipEnsure: true });
        const tSheet = curSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
        if (tSheet) syncMonthlyTransaksiHeaders_(tSheet);
      } catch (eBahanSync) {
        console.warn("Gagal sinkronisasi kolom transaksi saat hapus bahan:", eBahanSync);
      }
    }

    invalidateMasterCache_();
    return jsonResponse_(true, null, "Data master " + target + " berhasil dihapus.");
  }

  return jsonResponse_(false, null, "Operasi master tidak valid: " + operation);
}

/**
 * ponytail: cabut semua sesi permanen milik username (Non Aktif / ganti password).
 * Scan L2 Properties prefix sess_, cocokkan username, hapus L1+L2.
 */
function revokeUserSessions_(username) {
  if (!username) return 0;
  try {
    const props = PropertiesService.getScriptProperties();
    const all = props.getProperties();
    const prefix = (APP_CONFIG.SESSION_CONFIG && APP_CONFIG.SESSION_CONFIG.PROPERTY_PREFIX) || "sess_";
    const cachePrefix = (APP_CONFIG.SESSION_CONFIG && APP_CONFIG.SESSION_CONFIG.CACHE_PREFIX) || APP_CONFIG.CACHE_PREFIX || "esteh_sess_";
    const target = String(username).trim().toLowerCase();
    if (!target) return 0;
    let cache = null;
    try { cache = getSessionCache_(); } catch (eCache) { cache = null; }
    let revoked = 0;
    Object.keys(all).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      try {
        const data = JSON.parse(all[k]);
        if (data && String(data.username || "").trim().toLowerCase() === target) {
          props.deleteProperty(k);
          if (cache) {
            try { cache.remove(cachePrefix + k.slice(prefix.length)); } catch (eRm) {}
          }
          revoked++;
        }
      } catch (eParse) {}
    });
    return revoked;
  } catch (err) {
    console.warn("Gagal revokasi sesi user " + username + ":", err);
    return 0;
  }
}

/**
 * ponytail: bulk create 1 request (SetupWizard) — 1x baca + 1x setValues + sync 1x.
 * Item duplikat (nama/ID sudah ada, termasuk retry) dilewati sebagai skipped,
 * bukan error, sehingga retry aman dan wizard bisa lanjut.
 */
function masterIdPrefix_(target) {
  if (target === "user") return "USR-";
  if (target === "cabang") return "CAB-";
  if (target === "bahan_baku" || target === "bahan") return "BAHAN-";
  if (target === "tipe_pengeluaran" || target === "pengeluaran") return "EXP-";
  return "INC-";
}

function masterNameKey_(target, obj) {
  if (!obj) return "";
  if (target === "user") return String(obj["NAMA / USERNAME"] || obj.USERNAME || obj.username || "").trim().toLowerCase();
  if (target === "cabang") return String(obj.NAMA_CABANG || "").trim().toLowerCase();
  if (target === "bahan_baku" || target === "bahan") return String(obj.NAMA_BAHAN || "").trim().toLowerCase();
  if (target === "tipe_pengeluaran" || target === "pengeluaran") return String(obj.NAMA_TIPE || "").trim().toLowerCase();
  return String(obj.NAMA_SUMBER || "").trim().toLowerCase();
}

function normalizeBulkMasterItem_(target, raw) {
  const item = Object.assign({}, raw);
  if (target === "user") {
    const namaVal = item["NAMA / USERNAME"] || item.nama || item.USERNAME || item.username || "";
    item["NAMA / USERNAME"] = String(namaVal).trim();
    item["NO. TELEPON"] = String(item["NO. TELEPON"] || item.telepon || "-").trim() || "-";
    const rawRole = String(item.ROLE || item.role || "Staff").toLowerCase();
    item.ROLE = rawRole.includes("admin") ? "Admin" : "Staff";
    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";
    item.PASSWORD = String(item.PASSWORD || item.password || "123456").trim();
  } else if (target === "cabang") {
    item.NAMA_CABANG = String(item.NAMA_CABANG || item.nama || item.NAMA || "").trim();
    item.ALAMAT = String(item.ALAMAT || item.alamat || "-").trim() || "-";
    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";
  } else if (target === "bahan_baku" || target === "bahan") {
    item.NAMA_BAHAN = String(item.NAMA_BAHAN || item.nama || item.NAMA || "").trim();
    item.SATUAN = String(item.SATUAN || item.satuan || "Pcs").trim() || "Pcs";
  } else if (target === "tipe_pengeluaran" || target === "pengeluaran") {
    item.NAMA_TIPE = String(item.NAMA_TIPE || item.nama || item.NAMA || "").trim();
  } else {
    item.NAMA_SUMBER = String(item.NAMA_SUMBER || item.nama || item.NAMA || "").trim();
    const rawStatus = String(item.STATUS || item.status || "Aktif").toLowerCase();
    item.STATUS = rawStatus.includes("non") ? "Non Aktif" : "Aktif";
  }
  return item;
}

function handleCreateManyMaster_(session, target, tabName, idField, sheet, headers, rows, rawItems) {
  const prefix = masterIdPrefix_(target);
  const padLen = target === "user" ? 3 : 2;

  const seen = new Set();
  let counter = 0;
  const idRe = new RegExp(prefix.replace("-", "\\-") + "(\\d+)", "i");
  rows.forEach(r => {
    const idk = String(r[idField] || "").trim().toLowerCase();
    if (idk) seen.add("id:" + idk);
    const nk = masterNameKey_(target, r);
    if (nk) seen.add("nm:" + nk);
    const m = String(r[idField] || "").match(idRe);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > counter) counter = n;
    }
  });

  const added = [];
  const skipped = [];
  (rawItems || []).forEach(raw => {
    if (!raw || typeof raw !== "object") return;
    const item = normalizeBulkMasterItem_(target, raw);
    const nameKey = masterNameKey_(target, item);
    if (!nameKey) return; // baris kosong → abaikan
    const idKey = String(item[idField] || "").trim().toLowerCase();
    if ((idKey && seen.has("id:" + idKey)) || seen.has("nm:" + nameKey)) {
      skipped.push(nameKey);
      return;
    }
    if (!String(item[idField] || "").toUpperCase().startsWith(prefix)) {
      counter++;
      item[idField] = prefix + String(counter).padStart(padLen, "0");
    }
    seen.add("nm:" + nameKey);
    seen.add("id:" + String(item[idField] || "").trim().toLowerCase());
    added.push(item);
  });

  if (added.length > 0) {
    appendRowsBatch_(sheet, headers, added);
  }

  // Side-sync sekali saja (bukan per item)
  try {
    if (target === "cabang") {
      added.forEach(a => syncCabangToSumberPemasukan_(a.NAMA_CABANG, a.STATUS || "Aktif"));
    }
    if (target === "bahan_baku" || target === "bahan") {
      added.forEach(a => syncBahanBakuToTipePengeluaran_(a.NAMA_BAHAN));
      const curSs = getOrCreateMonthlySpreadsheet_(getCurrentPeriod_(), { skipEnsure: true });
      const tSheet = curSs.getSheetByName(APP_CONFIG.MONTHLY_TABS.TRANSAKSI);
      if (tSheet) syncMonthlyTransaksiHeaders_(tSheet);
    }
  } catch (syncErr) {
    console.warn("Gagal sinkronisasi bulk master " + target + ":", syncErr);
  }

  invalidateMasterCache_();
  return jsonResponse_(true, { added: added, skipped: skipped },
    "Data master " + target + " berhasil ditambahkan (" + added.length + " baru" +
    (skipped.length > 0 ? ", " + skipped.length + " sudah ada" : "") + ").");
}

/**
 * Otomatis menambahkan / memperbarui Cabang di Tab Sumber Pemasukan
 */
function syncCabangToSumberPemasukan_(namaCabang, status = "Aktif", oldNamaCabang = null) {
  if (!namaCabang || !String(namaCabang).trim()) return;
  try {
    const sumberSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN);
    const sumberRows = readTable_(sumberSheet);
    const sumberHeaders = getTableHeaders_(sumberSheet);
    const trimmedName = String(namaCabang).trim();
    const cleanStatus = String(status || "Aktif").toLowerCase().includes("non") ? "Non Aktif" : "Aktif";
    const oldNameTrimmed = oldNamaCabang ? String(oldNamaCabang).trim().toLowerCase() : null;

    // Cek apakah sudah ada sumber pemasukan yang cocok (case-insensitive, mendukung rename)
    const match = sumberRows.find(s => {
      const sName = String(s.NAMA_SUMBER || "").trim().toLowerCase();
      if (oldNameTrimmed && (sName === oldNameTrimmed || sName === ("penjualan outlet " + oldNameTrimmed) || sName === ("penjualan " + oldNameTrimmed))) {
        return true;
      }
      return sName === trimmedName.toLowerCase() ||
             sName === ("penjualan outlet " + trimmedName).toLowerCase() ||
             sName === ("penjualan " + trimmedName).toLowerCase();
    });

    if (match) {
      if (match.STATUS !== cleanStatus || match.NAMA_SUMBER !== trimmedName) {
        updateTableRow_(sumberSheet, sumberHeaders, match._rowIndex, {
          ID_SUMBER: match.ID_SUMBER,
          NAMA_SUMBER: trimmedName,
          STATUS: cleanStatus
        });
      }
    } else {
      let maxId = 0;
      sumberRows.forEach(r => {
        const m = String(r.ID_SUMBER || "").match(/INC-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxId) maxId = num;
        }
      });
      const nextId = "INC-" + String(maxId + 1).padStart(2, "0");
      appendTableRow_(sumberSheet, sumberHeaders, {
        "ID_SUMBER": nextId,
        "NAMA_SUMBER": trimmedName,
        "STATUS": cleanStatus
      });
    }
  } catch (err) {
    console.error("Gagal sinkronisasi Cabang ke Sumber Pemasukan:", err);
  }
}

/**
 * Otomatis menambahkan / memperbarui Bahan Baku di Tab Tipe Pengeluaran
 */
function syncBahanBakuToTipePengeluaran_(namaBahan, oldNamaBahan = null) {
  if (!namaBahan || !String(namaBahan).trim()) return;
  try {
    const expSheet = getMasterSheet_(APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN);
    const expRows = readTable_(expSheet);
    const expHeaders = getTableHeaders_(expSheet);
    const trimmedName = String(namaBahan).trim();
    const oldNameTrimmed = oldNamaBahan ? String(oldNamaBahan).trim().toLowerCase() : null;

    // Cek apakah sudah ada tipe pengeluaran yang cocok (case-insensitive, mendukung rename)
    const match = expRows.find(e => {
      const eName = String(e.NAMA_TIPE || "").trim().toLowerCase();
      if (oldNameTrimmed && (eName === oldNameTrimmed || eName === ("beli " + oldNameTrimmed))) {
        return true;
      }
      return eName === trimmedName.toLowerCase() ||
             eName === ("beli " + trimmedName).toLowerCase();
    });

    if (match) {
      if (match.NAMA_TIPE !== trimmedName) {
        updateTableRow_(expSheet, expHeaders, match._rowIndex, {
          ID_TIPE: match.ID_TIPE,
          NAMA_TIPE: trimmedName
        });
      }
    } else {
      let maxId = 0;
      expRows.forEach(r => {
        const m = String(r.ID_TIPE || "").match(/EXP-(\d+)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxId) maxId = num;
        }
      });
      const nextId = "EXP-" + String(maxId + 1).padStart(2, "0");
      appendTableRow_(expSheet, expHeaders, {
        "ID_TIPE": nextId,
        "NAMA_TIPE": trimmedName
      });
    }
  } catch (err) {
    console.error("Gagal sinkronisasi Bahan Baku ke Tipe Pengeluaran:", err);
  }
}

/**
 * One-off migration: backfill missing IDs in all master tabs
 * Scans each master tab, finds rows with blank ID columns, assigns next sequential ID
 * Run once from Apps Script editor, then delete or mark complete
 */
function backfillMissingIds() {
  const ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  const logs = [];

  const tabs = [
    { name: APP_CONFIG.MASTER_TABS.USER, idField: "ID", prefix: "USR-", padLen: 3 },
    { name: APP_CONFIG.MASTER_TABS.CABANG, idField: "ID_CABANG", prefix: "CAB-", padLen: 2 },
    { name: APP_CONFIG.MASTER_TABS.BAHAN_BAKU, idField: "ID_BAHAN", prefix: "BAHAN-", padLen: 2 },
    { name: APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN, idField: "ID_TIPE", prefix: "EXP-", padLen: 2 },
    { name: APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN, idField: "ID_SUMBER", prefix: "INC-", padLen: 2 }
  ];

  tabs.forEach(tab => {
    try {
      const sheet = ss.getSheetByName(tab.name);
      if (!sheet || sheet.getLastRow() <= 1) return;

      const rows = readTable_(sheet);
      const headers = getTableHeaders_(sheet);
      const idColIdx = headers.indexOf(tab.idField);
      if (idColIdx < 0) {
        logs.push(`${tab.name}: kolom ${tab.idField} tidak ditemukan`);
        return;
      }

      let maxNum = 0;
      let needsBackfill = [];

      rows.forEach((r, idx) => {
        const idVal = String(r[tab.idField] || "").trim();
        const regex = new RegExp(tab.prefix.replace("-", "\\-") + "(\\d+)", "i");
        const m = idVal.match(regex);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
        if (!idVal) {
          needsBackfill.push(r._rowIndex);
        }
      });

      if (needsBackfill.length === 0) {
        logs.push(`${tab.name}: semua baris sudah punya ID (${rows.length} baris)`);
        return;
      }

      needsBackfill.forEach(rowIdx => {
        maxNum++;
        sheet.getRange(rowIdx, idColIdx + 1).setValue(tab.prefix + String(maxNum).padStart(tab.padLen, "0"));
      });

      logs.push(`${tab.name}: berhasil backfill ${needsBackfill.length} baris (${rows.length} total)`);
    } catch (err) {
      logs.push(`${tab.name}: ERROR - ${err.message}`);
    }
  });

  return logs.join("\n");
}

/**
 * Internal helper: backfill missing IDs in a specific sheet
 */
function backfillSheetIds_(sheet, idField, prefix, padLen) {
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  try {
    const rows = readTable_(sheet);
    const headers = getTableHeaders_(sheet);
    const idColIdx = headers.indexOf(idField);
    if (idColIdx < 0) return 0;

    let maxNum = 0;
    let backfilled = 0;

    rows.forEach(r => {
      const idVal = String(r[idField] || "").trim();
      const regex = new RegExp(prefix.replace("-", "\\-") + "(\\d+)", "i");
      const m = idVal.match(regex);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    rows.forEach(r => {
      const idVal = String(r[idField] || "").trim();
      if (!idVal && r._rowIndex > 1) {
        maxNum++;
        sheet.getRange(r._rowIndex, idColIdx + 1).setValue(prefix + String(maxNum).padStart(padLen, "0"));
        backfilled++;
      }
    });

    if (backfilled > 0) SpreadsheetApp.flush();
    return backfilled;
  } catch (err) {
    console.warn(`backfillSheetIds_ gagal di ${sheet.getName()}:`, err);
    return 0;
  }
}

/**
 * Trigger onEdit Spreadsheet untuk sinkronisasi otomatis dan auto-ID saat user mengedit langsung di Google Sheet
 * Dioptimalkan untuk paste multi-baris agar tidak menghasilkan ID duplikat.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  try {
    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();
    const startRow = e.range.getRow();
    const numRows = e.range.getNumRows();

    // Hitung maxId sekali di awal sebelum loop multi-baris
    let maxId = 0;
    const initialRows = readTable_(sheet);

    if (sheetName === APP_CONFIG.MASTER_TABS.USER) {
      initialRows.forEach(u => {
        const m = String(u.ID || "").match(/USR-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxId) maxId = n;
        }
      });
    } else if (sheetName === APP_CONFIG.MASTER_TABS.CABANG) {
      initialRows.forEach(c => {
        const m = String(c.ID_CABANG || "").match(/CAB-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxId) maxId = n;
        }
      });
    } else if (sheetName === APP_CONFIG.MASTER_TABS.BAHAN_BAKU) {
      initialRows.forEach(b => {
        const m = String(b.ID_BAHAN || "").match(/BAHAN-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxId) maxId = n;
        }
      });
    } else if (sheetName === APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN) {
      initialRows.forEach(ex => {
        const m = String(ex.ID_TIPE || "").match(/EXP-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxId) maxId = n;
        }
      });
    } else if (sheetName === APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN) {
      initialRows.forEach(s => {
        const m = String(s.ID_SUMBER || "").match(/INC-(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxId) maxId = n;
        }
      });
    }

    let modified = false;
    const oldVal = (numRows === 1 && e.oldValue) ? String(e.oldValue).trim() : null;

    for (let r = 0; r < numRows; r++) {
      const currentRow = startRow + r;
      if (currentRow <= 1) continue; // Lewati Header

      if (sheetName === APP_CONFIG.MASTER_TABS.USER) {
        // Tab User: Kolom 2 adalah NAMA / USERNAME, Kolom 1 adalah ID (USR-xxx)
        const nama = sheet.getRange(currentRow, 2).getValue();
        const existingId = sheet.getRange(currentRow, 1).getValue();
        if (nama && !existingId) {
          maxId++;
          sheet.getRange(currentRow, 1).setValue("USR-" + String(maxId).padStart(3, "0"));
          modified = true;
        }
        if (nama) {
          if (!sheet.getRange(currentRow, 3).getValue()) {
            sheet.getRange(currentRow, 3).setValue("-");
            modified = true;
          }
          if (!sheet.getRange(currentRow, 4).getValue()) {
            sheet.getRange(currentRow, 4).setValue("123456");
            modified = true;
          }
          if (!sheet.getRange(currentRow, 5).getValue()) {
            sheet.getRange(currentRow, 5).setValue("Staff");
            modified = true;
          }
          if (!sheet.getRange(currentRow, 6).getValue()) {
            sheet.getRange(currentRow, 6).setValue("Aktif");
            modified = true;
          }
        }
      } else if (sheetName === APP_CONFIG.MASTER_TABS.CABANG) {
        // Tab Cabang: Kolom 2 adalah NAMA_CABANG, Kolom 4 adalah STATUS, Kolom 1 adalah ID_CABANG
        const namaCabang = sheet.getRange(currentRow, 2).getValue();
        let status = sheet.getRange(currentRow, 4).getValue();
        const existingId = sheet.getRange(currentRow, 1).getValue();
        if (namaCabang && !existingId) {
          maxId++;
          sheet.getRange(currentRow, 1).setValue("CAB-" + String(maxId).padStart(2, "0"));
          modified = true;
        }
        if (namaCabang && !status) {
          status = "Aktif";
          sheet.getRange(currentRow, 4).setValue("Aktif");
          modified = true;
        }
        if (namaCabang) {
          syncCabangToSumberPemasukan_(namaCabang, status || "Aktif", oldVal);
        }
      } else if (sheetName === APP_CONFIG.MASTER_TABS.BAHAN_BAKU) {
        // Tab Bahan Baku: Kolom 2 adalah NAMA_BAHAN, Kolom 1 adalah ID_BAHAN
        const namaBahan = sheet.getRange(currentRow, 2).getValue();
        const existingId = sheet.getRange(currentRow, 1).getValue();
        if (namaBahan && !existingId) {
          maxId++;
          sheet.getRange(currentRow, 1).setValue("BAHAN-" + String(maxId).padStart(2, "0"));
          modified = true;
        }
        if (namaBahan) {
          syncBahanBakuToTipePengeluaran_(namaBahan, oldVal);
        }
      } else if (sheetName === APP_CONFIG.MASTER_TABS.TIPE_PENGELUARAN) {
        // Tab Tipe Pengeluaran: Kolom 2 adalah NAMA_TIPE, Kolom 1 adalah ID_TIPE
        const namaTipe = sheet.getRange(currentRow, 2).getValue();
        const existingId = sheet.getRange(currentRow, 1).getValue();
        if (namaTipe && !existingId) {
          maxId++;
          sheet.getRange(currentRow, 1).setValue("EXP-" + String(maxId).padStart(2, "0"));
          modified = true;
        }
      } else if (sheetName === APP_CONFIG.MASTER_TABS.SUMBER_PEMASUKAN) {
        // Tab Sumber Pemasukan: Kolom 2 adalah NAMA_SUMBER, Kolom 3 adalah STATUS, Kolom 1 adalah ID_SUMBER
        const namaSumber = sheet.getRange(currentRow, 2).getValue();
        const status = sheet.getRange(currentRow, 3).getValue();
        const existingId = sheet.getRange(currentRow, 1).getValue();
        if (namaSumber && !existingId) {
          maxId++;
          sheet.getRange(currentRow, 1).setValue("INC-" + String(maxId).padStart(2, "0"));
          modified = true;
        }
        if (namaSumber && !status) {
          sheet.getRange(currentRow, 3).setValue("Aktif");
          modified = true;
        }
      } else if (sheetName === APP_CONFIG.MONTHLY_TABS.PENGELUARAN) {
        // Jika user mengedit tab Pengeluaran di spreadsheet bulanan, refresh tab Rekapitulasi
        try {
          const ss = sheet.getParent();
          const ssName = ss.getName();
          const pMatch = ssName.match(/(\d{4}-\d{2})/);
          const pPeriod = pMatch ? pMatch[1] : getCurrentPeriod_();
          setupRekapitulasiSheet_(ss, pPeriod);
        } catch (eRekap) {}
      }
    }

    if (modified) {
      SpreadsheetApp.flush();
    }
  } catch (err) {
    console.error("Error pada trigger onEdit:", err);
  }
}
