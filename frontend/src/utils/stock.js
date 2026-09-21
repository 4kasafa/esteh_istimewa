/**
 * Stock calculation utilities for Es Teh Lay
 */

export function getBahanHeaderPrefix(namaBahan) {
  const upper = String(namaBahan || "").toUpperCase().trim();
  if (upper === "GELAS CUP" || upper === "GELAS") {
    return "GELAS";
  }
  return upper;
}

export function normalizeBahanItem(b, index = 0) {
  if (!b) {
    return {
      id: `BAHAN-${String(index + 1).padStart(2, "0")}`,
      nama: `Bahan ${index + 1}`,
      satuan: "Pcs",
    };
  }
  if (typeof b === "string") {
    return {
      id: `BAHAN-${String(index + 1).padStart(2, "0")}`,
      nama: b.trim(),
      satuan: "Pcs",
    };
  }
  return {
    id: String(b.ID_BAHAN || b.id || `BAHAN-${String(b._rowIndex || index + 1).padStart(2, "0")}`),
    nama: String(b.NAMA_BAHAN || b.nama || "").trim(),
    satuan: String(b.SATUAN || b.satuan || "Pcs").trim(),
  };
}

export function parseRowTimestamp(row) {
  const tsStr = row["TANGGAL"] || row["TIME STAMP INPUT"] || row["TIMESTAMP INPUT"] || "";
  if (!tsStr) return 0;
  const d = new Date(tsStr);
  const time = d.getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Calculates stock balance and usage per bahan baku across branches and transaction reports
 *
 * @param {Array} masterBahan - Array of raw master bahan items
 * @param {Array} transactionRows - Array of daily report/transaction rows
 * @param {Array} branchList - Array of branch names
 * @param {string} selectedBranch - Branch filter from topbar ("Semua" or branch name)
 * @returns {Array} Processed stock item objects
 */
export function calculateStockBalances(
  masterBahan = [],
  transactionRows = [],
  branchList = [],
  selectedBranch = "Semua"
) {
  const normalizedMaster = (Array.isArray(masterBahan) ? masterBahan : [])
    .map((b, idx) => normalizeBahanItem(b, idx))
    .filter((b) => Boolean(b.nama));

  const validRows = Array.isArray(transactionRows) ? transactionRows : [];
  const validBranches = Array.isArray(branchList) ? branchList.filter(Boolean) : [];

  // Sort rows chronologically ascending so that later rows overwrite earlier rows
  const sortedRows = [...validRows].sort((a, b) => {
    const tA = (a.TANGGAL || "") + " " + (a["WAKTU INPUT"] || "");
    const tB = (b.TANGGAL || "") + " " + (b["WAKTU INPUT"] || "");
    return tA.localeCompare(tB);
  });

  // Group latest report by branch
  const latestReportByBranch = new Map();
  sortedRows.forEach((r) => {
    const branchName = String(r.CABANG || r["ARUS DANA"] || "").trim();
    if (branchName) {
      latestReportByBranch.set(branchName.toLowerCase(), r);
    }
  });

  return normalizedMaster.map((bahan) => {
    const pfx = getBahanHeaderPrefix(bahan.nama);

    // Calculate remaining stock per branch
    const branchBalances = [];
    let aggregatedSisa = 0;

    // Determine target branches to evaluate
    const targets = validBranches.length > 0
      ? validBranches
      : Array.from(latestReportByBranch.keys());

    targets.forEach((branchName) => {
      const rep = latestReportByBranch.get(branchName.toLowerCase());
      let sisa = 0;

      if (rep) {
        if (rep[pfx + " SISA"] !== undefined && rep[pfx + " SISA"] !== "") {
          sisa = Number(rep[pfx + " SISA"]) || 0;
        } else if (pfx === "GELAS" && rep["GELAS SISA"] !== undefined) {
          sisa = Number(rep["GELAS SISA"]) || 0;
        }
      }

      branchBalances.push({
        cabang: branchName,
        sisa,
      });

      aggregatedSisa += sisa;
    });

    // Calculate total consumed in current rows (filtered by selectedBranch if applicable)
    let totalTerpakai = 0;
    const scopedRows = (!selectedBranch || selectedBranch.toLowerCase() === "semua")
      ? validRows
      : validRows.filter((r) => {
          const br = String(r.CABANG || r["ARUS DANA"] || "").trim().toLowerCase();
          return br === selectedBranch.toLowerCase();
        });

    scopedRows.forEach((r) => {
      let used = 0;
      if (r[pfx + " TERPAKAI"] !== undefined && r[pfx + " TERPAKAI"] !== "") {
        used = Number(r[pfx + " TERPAKAI"]) || 0;
      } else if (pfx === "GELAS" && (r["GELAS LAKU"] !== undefined || r["GELAS TERPAKAI"] !== undefined)) {
        used = Number(r["GELAS LAKU"] ?? r["GELAS TERPAKAI"]) || 0;
      } else {
        const awal = Number(r[pfx + " AWAL"]) || 0;
        const sisa = Number(r[pfx + " SISA"]) || 0;
        if (awal > 0) {
          used = Math.max(0, awal - sisa);
        }
      }
      totalTerpakai += used;
    });

    // Determine display sisa based on selectedBranch
    let currentSisa = aggregatedSisa;
    if (selectedBranch && selectedBranch.toLowerCase() !== "semua") {
      const matchBranch = branchBalances.find(
        (b) => b.cabang.toLowerCase() === selectedBranch.toLowerCase()
      );
      currentSisa = matchBranch ? matchBranch.sisa : 0;
    }

    const isAvailable = currentSisa > 0;

    return {
      id: bahan.id,
      nama: bahan.nama,
      satuan: bahan.satuan,
      sisa: currentSisa,
      totalTerpakai,
      branchBalances,
      status: isAvailable ? "Tersedia" : "Habis",
    };
  });
}
