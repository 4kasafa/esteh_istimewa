function validateNumericFields_(data, headers) {
  if (!data || typeof data !== "object") {
    return;
  }

  const allowedHeaders = getNumericHeaders_(headers);
  Object.keys(data).forEach(function (header) {
    if (allowedHeaders.indexOf(header) === -1) {
      return;
    }

    const raw = sanitize_(data[header]);
    if (raw === "") {
      return;
    }

    const normalized = String(raw).replace(",", ".");
    const numeric = Number(normalized);
    if (!isFinite(numeric)) {
      throw new Error("Field '" + header + "' must be a valid number");
    }
    if (numeric < 0) {
      throw new Error("Field '" + header + "' must be greater than or equal to 0");
    }
    data[header] = numeric;
  });
}

function getNumericHeaders_(headers) {
  const configured = Array.isArray(APP_CONFIG.NUMERIC_HEADERS) ? APP_CONFIG.NUMERIC_HEADERS : [];
  const normalized = configured.map(function (item) {
    return sanitize_(item);
  }).filter(function (item) {
    return item !== "";
  });

  if (normalized.length > 0) {
    return normalized;
  }

  const startIndex = 4;
  const endIndex = 27;
  return (headers || []).slice(startIndex, endIndex);
}

function applyAutoCalculatedFields_(sheet, headers, targetObj, source, options) {
  const arusDanaHeader = resolveHeaderByAliases_(headers, ["ARUS DANA"]);
  const stokAwalHeader = resolveHeaderByAliases_(headers, ["STOK AWAL GELAS"]);
  const gelasMasukHeader = resolveHeaderByAliases_(headers, ["GELAS MASUK"]);
  const gelasLakuHeader = resolveHeaderByAliases_(headers, ["GELAS LAKU"]);
  const gelasRusakHeader = resolveHeaderByAliases_(headers, ["GELAS RUSAK"]);
  const stokAkhirHeader = resolveHeaderByAliases_(headers, ["STOK AKHIR GELAS"]);
  const totalNotaHeader = resolveHeaderByAliases_(headers, ["TOTAL NOTA", "TOTALNOTA"]);
  const unagMasukHeader = resolveHeaderByAliases_(headers, ["UNAG MASUK", "UANG MASUK"]);

  const arusDana = arusDanaHeader ? sanitize_(targetObj[arusDanaHeader]) : "";
  const excludeRowIndex = options && options.excludeRowIndex ? options.excludeRowIndex : null;
  if (sheet && arusDana && stokAwalHeader) {
    const latestStockAwal = findLatestStockAkhirByArusDana_(sheet, headers, arusDana, excludeRowIndex);
    if (latestStockAwal !== null) {
      targetObj[stokAwalHeader] = latestStockAwal;
    }
  }

  const stokAwal = stokAwalHeader ? getNumericFieldOrZero_(targetObj, stokAwalHeader) : 0;
  const gelasMasuk = gelasMasukHeader ? getNumericFieldOrZero_(targetObj, gelasMasukHeader) : 0;
  const gelasLaku = gelasLakuHeader ? getNumericFieldOrZero_(targetObj, gelasLakuHeader) : 0;
  const gelasRusak = gelasRusakHeader ? getNumericFieldOrZero_(targetObj, gelasRusakHeader) : 0;

  if (stokAkhirHeader) {
    targetObj[stokAkhirHeader] = stokAwal + gelasMasuk - gelasLaku - gelasRusak;
  }

  if (totalNotaHeader) {
    targetObj[totalNotaHeader] = gelasLaku * 3000;
  }

  const uangMasuk = calculateUangMasukFromDenominasi_(targetObj, headers, source);
  if (unagMasukHeader) {
    targetObj[unagMasukHeader] = uangMasuk;
  }
}

function resolveHeaderByAliases_(headers, aliases) {
  const list = headers || [];
  for (var i = 0; i < list.length; i++) {
    for (var j = 0; j < (aliases || []).length; j++) {
      if (normalizeKey_(list[i]) === normalizeKey_(aliases[j])) {
        return list[i];
      }
    }
  }
  return "";
}

function findLatestStockAkhirByArusDana_(sheet, headers, arusDana, excludeRowIndex) {
  const arusDanaHeader = resolveHeaderByAliases_(headers, ["ARUS DANA"]);
  const stokAkhirHeader = resolveHeaderByAliases_(headers, ["STOK AKHIR GELAS"]);
  if (!arusDanaHeader || !stokAkhirHeader) {
    return null;
  }

  const arusDanaIndex = headers.indexOf(arusDanaHeader);
  const stokAkhirIndex = headers.indexOf(stokAkhirHeader);
  if (arusDanaIndex < 0 || stokAkhirIndex < 0) {
    return null;
  }

  const headerRow = APP_CONFIG.HEADER_ROW || 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return null;
  }

  const values = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, headers.length).getValues();
  const targetArusDana = normalizeLaporanId_(arusDana);
  for (var i = values.length - 1; i >= 0; i--) {
    const absRow = headerRow + 1 + i;
    if (excludeRowIndex && absRow === excludeRowIndex) {
      continue;
    }
    const rowArusDana = normalizeLaporanId_(values[i][arusDanaIndex]);
    if (rowArusDana !== targetArusDana) {
      continue;
    }

    const stokAkhir = values[i][stokAkhirIndex];
    if (stokAkhir === "" || stokAkhir === null || stokAkhir === undefined) {
      continue;
    }
    return parseNonNegativeNumber_("STOK AKHIR GELAS", stokAkhir);
  }

  return null;
}

function getNumericFieldOrZero_(obj, headerName) {
  const raw = obj && Object.prototype.hasOwnProperty.call(obj, headerName) ? obj[headerName] : "";
  if (sanitize_(raw) === "") {
    return 0;
  }
  return parseNonNegativeNumber_(headerName, raw);
}

function calculateUangMasukFromDenominasi_(obj, headers, source) {
  const denominations = [
    { aliases: ["Rp 100.000", "RP100000", "100000"], nominal: 100000 },
    { aliases: ["Rp 75.000", "RP75000", "75000"], nominal: 75000 },
    { aliases: ["Rp 50.000", "RP50000", "50000"], nominal: 50000 },
    { aliases: ["Rp 20.000", "RP20000", "20000"], nominal: 20000 },
    { aliases: ["Rp 10.000", "RP10000", "10000"], nominal: 10000 },
    { aliases: ["Rp 5.000", "RP5000", "5000"], nominal: 5000 },
    { aliases: ["Rp 2.000", "RP2000", "2000"], nominal: 2000 },
    { aliases: ["Rp 1.000", "RP1000", "1000"], nominal: 1000 },
    { aliases: ["Rp 500", "RP500", "500"], nominal: 500 },
    { aliases: ["Rp 200", "RP200", "200"], nominal: 200 },
    { aliases: ["Rp 100", "RP100", "100"], nominal: 100 },
  ];

  let total = 0;
  denominations.forEach(function (item) {
    const header = resolveHeaderByAliases_(headers, item.aliases);
    let qty = 0;

    if (header) {
      qty = getNumericFieldOrZero_(obj, header);
    } else {
      const fromSource = readByAliases_(obj, source, item.aliases);
      if (fromSource !== "") {
        qty = parseNonNegativeNumber_(item.aliases[0], fromSource);
      }
    }

    total += qty * item.nominal;
  });

  return total;
}
