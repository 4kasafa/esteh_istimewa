/**
 * Router utama Google Apps Script (doGet & doPost)
 * Sistem Operasional & Laporan Staff "Es Teh Istimewa"
 */

function doGet(e) {
  try {
    const payload = e && e.parameter ? e.parameter : {};
    const action = sanitize_(payload.action).toLowerCase();

    if (!action) {
      return jsonResponse_(true, { status: "ONLINE", app: "Es Teh Istimewa Backend" }, "Backend aktif dan siap.");
    }

    if (action === "read" || action === "read_reports") {
      const session = requireAuthSession_(e, payload);
      return handleReadReports_(payload, session);
    }

    if (action === "read_database" || action === "get_summary") {
      const session = requireAuthSession_(e, payload);
      return handleGetSummary_(payload, session);
    }

    if (action === "get_initial_form_data") {
      const session = requireAuthSession_(e, payload);
      return handleGetInitialFormData_(payload, session);
    }

    if (action === "read_master") {
      const session = requireAuthSession_(e, payload);
      return handleReadMaster_(session);
    }

    if (action === "refresh_rekap" || action === "setup_rekap") {
      const session = requireAuthSession_(e, payload);
      ensureAdmin_(session);
      const targetPeriod = sanitize_(payload.period || getCurrentPeriod_());
      const ss = getOrCreateMonthlySpreadsheet_(targetPeriod);
      setupRekapitulasiSheet_(ss, targetPeriod);
      return jsonResponse_(true, null, "Rekapitulasi periode " + targetPeriod + " berhasil diperbarui.");
    }

    if (action === "sync_monthly_sheets" || action === "sync_headers") {
      return jsonResponse_(true, null, syncAndMigrateMonthlySheets());
    }

    if (action === "fix_headers" || action === "format_headers") {
      return jsonResponse_(true, null, fixAllHeadersAndColumnWidths());
    }

    if (action === "cleanup_duplicates") {
      return jsonResponse_(true, null, cleanupDuplicateMonthlySpreadsheets());
    }

    if (action === "reset_all_sheets" || action === "clean_all_sheets") {
      return jsonResponse_(true, null, resetAndCleanAllSheets());
    }

    if (action === "setup") {
      return jsonResponse_(true, null, setupMasterSpreadsheet());
    }

    return jsonResponse_(false, null, "Aksi GET tidak didukung: " + action);
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}

function doPost(e) {
  try {
    const payload = getPayload_(e);
    const action = sanitize_(payload.action).toLowerCase();

    if (action === "login") {
      return handleLogin_(payload);
    }

    if (action === "logout") {
      const logoutSession = requireAuthSession_(e, payload);
      return handleLogout_(logoutSession);
    }

    // Seluruh aksi lain membutuhkan otentikasi sesi aktif
    const session = requireAuthSession_(e, payload);

    switch (action) {
      case "get_initial_form_data":
        return handleGetInitialFormData_(payload, session);

      case "create_report":
      case "create":
      case "create_database":
        return handleCreateReport_(payload, session);

      case "update_report":
      case "update":
        return handleUpdateReport_(payload, session);

      case "delete_report":
      case "delete_transaction":
      case "delete":
        ensureAdmin_(session);
        return handleDeleteReport_(payload, session);

      case "read_reports":
      case "read":
        return handleReadReports_(payload, session);

      case "get_summary":
      case "read_database":
        return handleGetSummary_(payload, session);

      case "read_master":
        return handleReadMaster_(session);

      case "update_master":
        return handleUpdateMaster_(payload, session);

      case "refresh_rekap":
      case "setup_rekap":
        ensureAdmin_(session);
        const targetPeriod = sanitize_(payload.period || getCurrentPeriod_());
        const ss = getOrCreateMonthlySpreadsheet_(targetPeriod);
        setupRekapitulasiSheet_(ss, targetPeriod);
        return jsonResponse_(true, null, "Rekapitulasi periode " + targetPeriod + " berhasil diperbarui.");

      case "setup":
        ensureAdmin_(session);
        return jsonResponse_(true, null, setupMasterSpreadsheet());

      case "cleanup_duplicates":
        ensureAdmin_(session);
        return jsonResponse_(true, null, cleanupDuplicateMonthlySpreadsheets());

      case "sync_monthly_sheets":
      case "sync_headers":
        ensureAdmin_(session);
        return jsonResponse_(true, null, syncAndMigrateMonthlySheets());

      case "fix_headers":
      case "format_headers":
        ensureAdmin_(session);
        return jsonResponse_(true, null, fixAllHeadersAndColumnWidths());

      case "reset_all_sheets":
      case "clean_all_sheets":
        ensureAdmin_(session);
        return jsonResponse_(true, null, resetAndCleanAllSheets());

      default:
        return jsonResponse_(false, null, "Aksi POST tidak didukung: " + action);
    }
  } catch (error) {
    return jsonResponse_(false, null, error.message);
  }
}
