// ============= KODE.GS =============
function doGet() {
  return HtmlService
    .createHtmlOutput(getHtmlContent())
    .setTitle('Input Kas - Toko Lay')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi untuk mendapatkan konten HTML
function getHtmlContent() {
  var html = `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Input Kas</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px; 
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }
    .container { 
      max-width: 1200px;
      margin: auto; 
      background: white; 
      padding: 25px; 
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
    }
    .header-section {
      text-align: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #3498db;
      position: relative;
    }
    .main-title {
      color: #2c3e50; 
      margin-bottom: 5px;
      font-size: 24px;
    }
    .watermark {
      color: #7f8c8d;
      font-size: 12px;
      font-style: italic;
      margin-top: 5px;
    }
    .main-content {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .menu-section {
      flex: 0 0 180px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e9ecef;
    }
    .form-section {
      flex: 1;
      min-width: 280px;
    }
    .uang-section {
      flex: 0 0 350px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e9ecef;
    }
    .form-group { 
      margin-bottom: 15px; 
    }
    label { 
      display: block; 
      margin-bottom: 6px; 
      font-weight: bold;
      color: #34495e;
      font-size: 13px;
    }
    input, select { 
      width: 100%; 
      padding: 10px; 
      border: 2px solid #ddd; 
      border-radius: 6px;
      font-size: 13px;
      box-sizing: border-box;
      transition: border-color 0.3s;
    }
    input:focus, select:focus { 
      outline: none; 
      border-color: #3498db; 
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
    button { 
      padding: 12px; 
      background: linear-gradient(to right, #2ecc71, #27ae60); 
      color: white; 
      border: none; 
      border-radius: 6px; 
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    button:hover { 
      background: linear-gradient(to right, #27ae60, #219653);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(39, 174, 96, 0.3);
    }
    button:disabled { 
      background: #95a5a6; 
      cursor: not-allowed;
      transform: none;
    }
    .result { 
      padding: 10px; 
      margin-top: 15px; 
      text-align: center;
      border-radius: 6px;
      font-weight: bold;
      font-size: 13px;
      clear: both;
    }
    .success { 
      background: #d4edda; 
      color: #155724; 
      border: 1px solid #c3e6cb;
    }
    .error { 
      background: #f8d7da; 
      color: #721c24; 
      border: 1px solid #f5c6cb;
    }
    .loading { 
      color: #3498db; 
      font-style: italic;
    }
    .uang-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0;
      padding: 10px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .uang-nominal {
      font-weight: 600;
      color: #2c3e50;
      font-size: 12px;
      min-width: 80px;
    }
    .uang-input-container {
      display: flex;
      align-items: center;
      gap: 5px;
      flex: 1;
      justify-content: center;
    }
    .uang-input {
      width: 70px !important;
      text-align: center;
      padding: 6px !important;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .uang-hasil-container {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 150px;
      justify-content: flex-end;
    }
    .uang-hasil {
      background: #e8f4fc;
      padding: 6px 12px;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
      color: #2c3e50;
      font-size: 11px;
      border: 1px solid #c3e6cb;
      min-width: 100px;
    }
    .uang-total {
      font-size: 10px;
      color: #27ae60;
      margin-top: 1px;
      font-weight: normal;
    }
    .total-display-container {
      background: #e8f4fc;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      border: 2px solid #3498db;
    }
    .total-section {
      text-align: center;
    }
    .total-label {
      font-size: 12px;
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .total-amount {
      font-size: 16px;
      color: #2c3e50;
      font-weight: bold;
    }
    .section-title {
      color: #3498db;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #3498db;
    }
    .section-title::before {
      content: "▶";
      font-size: 10px;
    }
    .multiply-sign {
      color: #666;
      font-size: 14px;
      font-weight: bold;
      margin: 0 3px;
    }
    .separator {
      margin: 15px 0;
      border: none;
      height: 1px;
      background: linear-gradient(to right, transparent, #ddd, transparent);
    }
    .currency-input {
      position: relative;
    }
    .currency-prefix {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-weight: bold;
      pointer-events: none;
      font-size: 12px;
    }
    .currency-input input {
      padding-left: 40px !important;
      text-align: right;
      font-weight: bold;
      color: #2c3e50;
      font-size: 13px;
    }
    .footer-note {
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      color: #7f8c8d;
      font-size: 10px;
      font-style: italic;
    }
    .menu-item {
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 6px;
      border: 2px solid #3498db;
      text-align: center;
      font-weight: bold;
      color: #2c3e50;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 13px;
    }
    .menu-item:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
    }
    .menu-item.active {
      background: #3498db;
      color: white;
    }
    /* WARNA KHUSUS UNTUK MENU KAS KELUAR */
    .menu-item.keluar {
      border: 2px solid #e74c3c;
    }
    .menu-item.keluar:hover, 
    .menu-item.keluar.active {
      background: linear-gradient(to right, #e74c3c, #c0392b);
      color: white;
      box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
    }
    .menu-title {
      color: #3498db;
      margin-bottom: 12px;
      text-align: center;
      font-size: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #3498db;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .report-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e9ecef;
    }
    .report-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    .report-label {
      font-weight: bold;
      color: #2c3e50;
      font-size: 13px;
    }
    .report-value {
      font-weight: bold;
      color: #3498db;
      font-size: 13px;
    }
    .setoran-message {
      text-align: center;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
    }
    .setoran-lebih {
      background: #d4edda;
      color: #155724;
      border: 2px solid #c3e6cb;
    }
    .setoran-pas {
      background: #fff3cd;
      color: #856404;
      border: 2px solid #ffeaa7;
    }
    .setoran-kurang {
      background: #f8d7da;
      color: #721c24;
      border: 2px solid #f5c6cb;
    }
    .report-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .report-buttons button {
      flex: 1;
    }
    .btn-preview {
      background: linear-gradient(to right, #3498db, #2980b9);
    }
    .btn-preview:hover {
      background: linear-gradient(to right, #2980b9, #2573a7);
    }
    .rincian-uang {
      margin-top: 20px;
    }
    .rincian-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: white;
      border-radius: 4px;
      margin: 5px 0;
      border-left: 4px solid #3498db;
    }
    /* STYLE KHUSUS UNTUK KAS KELUAR DUA KOLOM (SEKARANG DI SIDEBAR) */
    .ikat-container {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      justify-content: center;
    }
    .ikat-label {
      font-size: 11px;
      color: #7f8c8d;
      font-weight: bold;
      min-width: 40px;
    }
    .ikat-input {
      width: 60px !important;
      text-align: center;
      padding: 6px !important;
      border: 2px solid #3498db;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      background: #e8f4fc;
    }
    .lembar-input {
      width: 60px !important;
      text-align: center;
      padding: 6px !important;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
    }
    .ikat-info {
      font-size: 10px;
      color: #27ae60;
      margin-top: 2px;
      font-style: italic;
    }
    .pecahan-besar-title, .pecahan-kecil-title {
      color: #3498db;
      margin: 15px 0 8px 0;
      font-size: 13px;
      font-weight: bold;
      padding-bottom: 5px;
      border-bottom: 1px solid #e9ecef;
    }
    /* STYLE UNTUK FORM KAS KELUAR YANG LEBIH SEDERHANA */
    .kas-keluar-simple {
      background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
      padding: 20px;
      border-radius: 10px;
      margin-top: 15px;
      border: 2px solid #ffcccc;
    }
    .kas-keluar-simple .form-group {
      margin-bottom: 12px;
    }
    .kas-keluar-simple label {
      color: #c0392b;
    }
    .info-note {
      font-size: 11px;
      color: #7f8c8d;
      font-style: italic;
      margin-top: 5px;
      display: block;
    }
    /* WARNA KHUSUS UNTUK SECTION UANG KAS KELUAR */
    .uang-section.keluar {
      background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
      border: 2px solid #ffcccc;
    }
    .uang-section.keluar .section-title {
      color: #c0392b;
      border-bottom: 2px solid #c0392b;
    }
    .uang-section.keluar .ikat-input {
      border: 2px solid #c0392b;
      background: #ffeaea;
    }
    .uang-section.keluar .uang-hasil {
      border: 1px solid #ffcccc;
      background: #ffeaea;
    }
    .uang-section.keluar .total-display-container {
      background: #ffeaea;
      border: 2px solid #c0392b;
    }
    @media (max-width: 992px) {
      .main-content {
        flex-direction: column;
      }
      .menu-section {
        order: 1;
        flex: 1;
      }
      .form-section {
        order: 2;
      }
      .uang-section {
        order: 3;
        flex: 1;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-section">
      <div class="main-title">💼 KAS TOKO LAY</div>
      <div class="watermark">Dibuat Oleh Darfin Abu Nu'Man</div>
    </div>
    
    <div class="main-content">
      <!-- MENU SAMPING KIRI -->
      <div class="menu-section">
        <div class="menu-title">📋 MENU UTAMA</div>
        <div class="menu-item active" id="menu-masuk" onclick="setActiveMenu('masuk')">
          💰 KAS MASUK
        </div>
        <div class="menu-item keluar" id="menu-keluar" onclick="setActiveMenu('keluar')">
          📤 KAS KELUAR
        </div>
        <div class="menu-item" id="menu-laporan" onclick="setActiveMenu('laporan')">
          📊 LAPORAN
        </div>
      </div>
      
      <!-- TAB KAS MASUK/KELUAR -->
      <div class="form-section tab-content active" id="tab-kas">
        <div class="form-group">
          <label for="tanggal">📅 Tanggal:</label>
          <input type="date" id="tanggal" required>
        </div>
        
        <div class="form-group">
          <label for="shift">🕐 Shift:</label>
          <select id="shift" required>
            <option value="">Pilih Shift</option>
            <option value="Pagi">Pagi</option>
            <option value="Siang">Siang</option>
            <option value="Malam">Malam</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="cabang">🏢 Cabang Lay:</label>
          <select id="cabang" required>
            <option value="">Loading data cabang...</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="kasir">👤 Nama Kasir:</label>
          <select id="kasir" required>
            <option value="">Loading data kasir...</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="keterangan">📝 Keterangan (opsional):</label>
          <input type="text" id="keterangan" placeholder="Masukkan keterangan tambahan...">
        </div>
        
        <div class="separator"></div>
        
        <!-- KAS MASUK FIELDS -->
        <div id="fields-masuk">
          <div class="form-group currency-input">
            <label for="penjualan">💻 Total Penjualan Komputer:</label>
            <span class="currency-prefix">Rp</span>
            <input type="text" id="penjualan" placeholder="0" value="0">
          </div>
          
          <div class="form-group currency-input">
            <label for="pengeluaran">📤 Pengeluaran:</label>
            <span class="currency-prefix">Rp</span>
            <input type="text" id="pengeluaran" placeholder="0" value="0">
          </div>
        </div>
        
        <!-- KAS KELUAR FIELDS -->
        <div id="fields-keluar" style="display: none;">
          <div class="kas-keluar-simple">
            <div class="form-group currency-input">
              <label for="jumlah-keluar">💰 Jumlah Kas Keluar (Opsional):</label>
              <span class="currency-prefix">Rp</span>
              <input type="text" id="jumlah-keluar" placeholder="0" value="0">
              <span class="info-note">Isi jika ada jumlah kas keluar selain dari rincian uang di samping</span>
            </div>
          </div>
        </div>
        
        <button onclick="simpanData()" id="btnSimpan" style="width: 100%;">💾 SIMPAN KAS MASUK</button>
        
        <div id="result" class="result"></div>
      </div>
      
      <!-- TAB LAPORAN -->
      <div class="form-section tab-content" id="tab-laporan">
        <div class="report-section">
          <div class="section-title">📊 LAPORAN KAS</div>
          
          <div class="form-group">
            <label for="report-tanggal">📅 Tanggal:</label>
            <input type="date" id="report-tanggal">
          </div>
          
          <div class="form-group">
            <label for="report-shift">🕐 Shift:</label>
            <select id="report-shift">
              <option value="">Semua Shift</option>
              <option value="Pagi">Pagi</option>
              <option value="Siang">Siang</option>
              <option value="Malam">Malam</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="report-cabang">🏢 Cabang Lay:</label>
            <select id="report-cabang">
              <option value="">Semua Cabang</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="report-kasir">👤 Nama Kasir:</label>
            <select id="report-kasir">
              <option value="">Semua Kasir</option>
            </select>
          </div>
          
          <div class="report-buttons">
            <button onclick="previewLaporan()" class="btn-preview" style="width: 100%;">
              👁️ PREVIEW LAPORAN
            </button>
          </div>
          
          <div id="report-result" class="result"></div>
          
          <!-- TEMPAT PREVIEW LAPORAN -->
          <div id="report-preview" style="display: none; margin-top: 20px;">
            <div class="separator"></div>
            
            <div class="report-row">
              <span class="report-label">Tanggal:</span>
              <span class="report-value" id="preview-tanggal">-</span>
            </div>
            
            <div class="report-row">
              <span class="report-label">Shift:</span>
              <span class="report-value" id="preview-shift">-</span>
            </div>
            
            <div class="report-row">
              <span class="report-label">Cabang Lay:</span>
              <span class="report-value" id="preview-cabang">-</span>
            </div>
            
            <div class="report-row">
              <span class="report-label">Nama Kasir:</span>
              <span class="report-value" id="preview-kasir">-</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="report-row">
              <span class="report-label">Total Penjualan Komputer:</span>
              <span class="report-value" id="preview-penjualan">Rp 0</span>
            </div>
            
            <div class="report-row">
              <span class="report-label">Total Pengeluaran:</span>
              <span class="report-value" id="preview-pengeluaran">Rp 0</span>
            </div>
            
            <div class="report-row">
              <span class="report-label">Total Uang Fisik:</span>
              <span class="report-value" id="preview-fisik">Rp 0</span>
            </div>
            
            <div id="preview-setoran" class="setoran-message">
              SETORAN PAS
            </div>
            
            <div class="rincian-uang" id="rincian-uang-container">
              <!-- Rincian uang akan ditampilkan di sini -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- PECAHAN UANG KANAN -->
      <div class="uang-section tab-content active" id="tab-uang">
        <div class="section-title" id="uang-section-title">💰 PECAHAN UANG KAS MASUK</div>
        <div id="pecahanContainer"></div>
        
        <div class="total-display-container">
          <div class="total-section">
            <div class="total-label" id="total-label">TOTAL KAS MASUK</div>
            <div class="total-amount">Rp <span id="total">0</span></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-note">
      Sistem Input Kas Lay - Versi 52.0 (Darfin Abu Nu'Man)
    </div>
  </div>

  <script>
    // Daftar pecahan uang
    const pecahan = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const container = document.getElementById("pecahanContainer");
    let activeMenu = 'masuk';
    
    // Fungsi untuk membuat tampilan pecahan berdasarkan menu aktif
    function buatTampilanPecahan() {
      container.innerHTML = '';
      
      if (activeMenu === 'masuk') {
        // TAMPILAN KAS MASUK (1 kolom) - DI SIDEBAR KANAN
        document.getElementById('uang-section-title').textContent = '💰 PECAHAN UANG KAS MASUK';
        
        // Hapus kelas keluar dari sidebar jika ada
        const uangSection = document.querySelector('.uang-section');
        uangSection.classList.remove('keluar');
        
        pecahan.forEach((nilai, index) => {
          const div = document.createElement('div');
          div.className = 'uang-item';
          div.id = \`uang-item-\${index}\`;
          
          div.innerHTML = \`
            <div class="uang-nominal">Rp \${nilai.toLocaleString('id-ID')}</div>
            <div class="uang-input-container">
              <span class="multiply-sign">×</span>
              <input type="number" 
                     id="uang-\${index}"
                     class="uang-input" 
                     value="0" 
                     min="0" 
                     oninput="hitungPerNominal(\${index})"
                     placeholder="0">
            </div>
            <div class="uang-hasil-container">
              <div class="uang-hasil" id="hasil-\${index}">
                = Rp 0
                <div class="uang-total" id="detail-\${index}">0 lembar</div>
              </div>
            </div>
          \`;
          container.appendChild(div);
        });
      } else if (activeMenu === 'keluar') {
        // TAMPILAN KAS KELUAR (2 kolom untuk pecahan besar, 1 kolom untuk kecil) - DI SIDEBAR KANAN
        document.getElementById('uang-section-title').textContent = '💰 PECAHAN UANG KAS KELUAR';
        
        // Tambahkan kelas keluar ke sidebar
        const uangSection = document.querySelector('.uang-section');
        uangSection.classList.add('keluar');
        
        // Pecahan besar (1000 ke atas) - 2 kolom
        const pecahanBesar = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000];
        
        // Judul pecahan besar
        const titleBesar = document.createElement('div');
        titleBesar.className = 'pecahan-besar-title';
        titleBesar.textContent = 'PECAHAN BESAR (Dapat Diikat 100 Lembar/Ikat)';
        container.appendChild(titleBesar);
        
        pecahanBesar.forEach((nilai, index) => {
          const div = document.createElement('div');
          div.className = 'uang-item';
          div.id = \`uang-item-\${index}\`;
          
          const totalPerIkat = nilai * 100;
          
          div.innerHTML = \`
            <div class="uang-nominal">Rp \${nilai.toLocaleString('id-ID')}</div>
            <div class="ikat-container">
              <span class="ikat-label">IKAT:</span>
              <input type="number" 
                     id="ikat-\${index}"
                     class="ikat-input" 
                     value="0" 
                     min="0" 
                     oninput="hitungPerNominalKeluar(\${index})"
                     placeholder="0"
                     title="1 ikat = 100 lembar = Rp \${totalPerIkat.toLocaleString('id-ID')}">
              <span class="multiply-sign">+</span>
              <span class="ikat-label">LEMBAR:</span>
              <input type="number" 
                     id="lembar-\${index}"
                     class="lembar-input" 
                     value="0" 
                     min="0" 
                     max="99"
                     oninput="hitungPerNominalKeluar(\${index})"
                     placeholder="0"
                     title="Sisa lembar (0-99)">
            </div>
            <div class="uang-hasil-container">
              <div class="uang-hasil" id="hasil-\${index}">
                = Rp 0
                <div class="ikat-info" id="detail-\${index}">0 ikat + 0 lembar</div>
              </div>
            </div>
          \`;
          container.appendChild(div);
        });
        
        // Pecahan kecil (500, 200, 100) - 1 kolom
        const pecahanKecil = [500, 200, 100];
        
        // Judul pecahan kecil
        const titleKecil = document.createElement('div');
        titleKecil.className = 'pecahan-kecil-title';
        titleKecil.textContent = 'PECAHAN KECIL (per lembar)';
        container.appendChild(titleKecil);
        
        pecahanKecil.forEach((nilai, index) => {
          const idx = index + pecahanBesar.length;
          const div = document.createElement('div');
          div.className = 'uang-item';
          div.id = \`uang-item-\${idx}\`;
          
          div.innerHTML = \`
            <div class="uang-nominal">Rp \${nilai.toLocaleString('id-ID')}</div>
            <div class="uang-input-container">
              <span class="multiply-sign">×</span>
              <input type="number" 
                     id="uang-\${idx}"
                     class="uang-input" 
                     value="0" 
                     min="0" 
                     oninput="hitungPerNominalKeluarKecil(\${idx})"
                     placeholder="0">
            </div>
            <div class="uang-hasil-container">
              <div class="uang-hasil" id="hasil-\${idx}">
                = Rp 0
                <div class="uang-total" id="detail-\${idx}">0 lembar</div>
              </div>
            </div>
          \`;
          container.appendChild(div);
        });
      }
      
      // Hitung ulang total setelah membuat tampilan
      hitungTotal();
    }
    
    // Set menu aktif
    function setActiveMenu(menu) {
      activeMenu = menu;
      
      // Update tampilan menu
      document.getElementById('menu-masuk').classList.remove('active');
      document.getElementById('menu-keluar').classList.remove('active');
      document.getElementById('menu-laporan').classList.remove('active');
      document.getElementById('menu-' + menu).classList.add('active');
      
      // Update tab yang aktif
      document.getElementById('tab-kas').classList.remove('active');
      document.getElementById('tab-uang').classList.remove('active');
      document.getElementById('tab-laporan').classList.remove('active');
      
      if (menu === 'laporan') {
        // Tampilkan tab laporan saja
        document.getElementById('tab-laporan').classList.add('active');
        // Sembunyikan section uang
        document.getElementById('tab-uang').style.display = 'none';
        
        // Load data untuk filter laporan
        loadReportCabangData();
        loadReportKasirData();
      } else {
        // Tampilkan tab kas dan uang
        document.getElementById('tab-kas').classList.add('active');
        document.getElementById('tab-uang').classList.add('active');
        document.getElementById('tab-uang').style.display = 'block';
        
        // Update tampilan form berdasarkan menu
        if (menu === 'masuk') {
          document.getElementById('fields-masuk').style.display = 'block';
          document.getElementById('fields-keluar').style.display = 'none';
          document.getElementById('total-label').textContent = 'TOTAL KAS MASUK';
          
          // Update tombol simpan
          const btnSimpan = document.getElementById('btnSimpan');
          btnSimpan.innerHTML = '💾 SIMPAN KAS MASUK';
          btnSimpan.style.background = 'linear-gradient(to right, #2ecc71, #27ae60)';
          
          // Reset input kas keluar
          document.getElementById('jumlah-keluar').value = '0';
        } else {
          document.getElementById('fields-masuk').style.display = 'none';
          document.getElementById('fields-keluar').style.display = 'block';
          document.getElementById('total-label').textContent = 'TOTAL KAS KELUAR';
          
          // Update tombol simpan
          const btnSimpan = document.getElementById('btnSimpan');
          btnSimpan.innerHTML = '💾 SIMPAN KAS KELUAR';
          btnSimpan.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
          
          // Reset input kas masuk
          document.getElementById('penjualan').value = '0';
          document.getElementById('pengeluaran').value = '0';
        }
        
        // Buat tampilan pecahan sesuai menu (DI SIDEBAR KANAN)
        buatTampilanPecahan();
      }
    }
    
    // Hitung per nominal untuk kas masuk (SIDEBAR KANAN)
    function hitungPerNominal(index) {
      if (activeMenu !== 'masuk') return;
      
      const input = document.getElementById('uang-' + index);
      const hasilDiv = document.getElementById('hasil-' + index);
      const detailDiv = document.getElementById('detail-' + index);
      
      const jumlah = parseInt(input.value) || 0;
      const total = jumlah * pecahan[index];
      
      // Update tampilan hasil
      hasilDiv.innerHTML = \`
        = Rp \${total.toLocaleString('id-ID')}
        <div class="uang-total">\${jumlah} lembar</div>
      \`;
      
      // Update total keseluruhan
      hitungTotal();
    }
    
    // Hitung per nominal untuk kas keluar (pecahan besar - 2 kolom) - DI SIDEBAR KANAN
    function hitungPerNominalKeluar(index) {
      if (activeMenu !== 'keluar') return;
      
      const ikatInput = document.getElementById('ikat-' + index);
      const lembarInput = document.getElementById('lembar-' + index);
      const hasilDiv = document.getElementById('hasil-' + index);
      
      let jumlahIkat = parseInt(ikatInput.value) || 0;
      let jumlahLembar = parseInt(lembarInput.value) || 0;
      
      // Validasi: lembar tidak boleh lebih dari 99
      if (jumlahLembar > 99) {
        lembarInput.value = 99;
        jumlahLembar = 99;
      }
      
      const nilai = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000][index];
      const totalIkat = jumlahIkat * nilai * 100; // 1 ikat = 100 lembar
      const totalLembar = jumlahLembar * nilai;
      const total = totalIkat + totalLembar;
      
      // Update tampilan hasil
      hasilDiv.innerHTML = \`
        = Rp \${total.toLocaleString('id-ID')}
        <div class="ikat-info">\${jumlahIkat} ikat + \${jumlahLembar} lembar</div>
      \`;
      
      // Update total keseluruhan
      hitungTotal();
    }
    
    // Hitung per nominal untuk kas keluar (pecahan kecil - 1 kolom) - DI SIDEBAR KANAN
    function hitungPerNominalKeluarKecil(index) {
      if (activeMenu !== 'keluar') return;
      
      const input = document.getElementById('uang-' + index);
      const hasilDiv = document.getElementById('hasil-' + index);
      
      const jumlah = parseInt(input.value) || 0;
      // Index 8, 9, 10 untuk pecahan kecil (500, 200, 100)
      const nilaiIndex = [500, 200, 100][index - 8];
      const total = jumlah * nilaiIndex;
      
      // Update tampilan hasil
      hasilDiv.innerHTML = \`
        = Rp \${total.toLocaleString('id-ID')}
        <div class="uang-total">\${jumlah} lembar</div>
      \`;
      
      // Update total keseluruhan
      hitungTotal();
    }
    
    // Hitung total uang keseluruhan (DARI SIDEBAR KANAN)
    function hitungTotal() {
      let total = 0;
      
      if (activeMenu === 'masuk') {
        // Hitung untuk kas masuk dari sidebar kanan
        for (let i = 0; i < pecahan.length; i++) {
          const input = document.getElementById('uang-' + i);
          if (input) {
            const jumlah = parseInt(input.value) || 0;
            total += jumlah * pecahan[i];
          }
        }
      } else if (activeMenu === 'keluar') {
        // Hitung untuk kas keluar dari sidebar kanan
        // Pecahan besar (2 kolom)
        for (let i = 0; i < 8; i++) { // 100000 sampai 1000
          const ikatInput = document.getElementById('ikat-' + i);
          const lembarInput = document.getElementById('lembar-' + i);
          
          if (ikatInput && lembarInput) {
            const jumlahIkat = parseInt(ikatInput.value) || 0;
            const jumlahLembar = parseInt(lembarInput.value) || 0;
            const nilai = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000][i];
            
            total += (jumlahIkat * nilai * 100) + (jumlahLembar * nilai);
          }
        }
        
        // Pecahan kecil (1 kolom)
        for (let i = 8; i < 11; i++) { // 500, 200, 100
          const input = document.getElementById('uang-' + i);
          if (input) {
            const jumlah = parseInt(input.value) || 0;
            const nilai = [500, 200, 100][i - 8];
            total += jumlah * nilai;
          }
        }
      }
      
      // Update total kas di sidebar kanan
      document.getElementById('total').textContent = total.toLocaleString('id-ID');
      
      return total;
    }
    
    // Format angka dengan pemisah ribuan
    function formatRupiah(angka) {
      if (!angka) return '0';
      
      // Hapus semua karakter non-digit
      let number_string = angka.toString().replace(/[^\\d]/g, '');
      
      // Konversi ke number
      let number = parseInt(number_string);
      if (isNaN(number)) return '0';
      
      // Format dengan pemisah ribuan
      return number.toLocaleString('id-ID');
    }
    
    // Fungsi untuk mengatur input dengan format rupiah
    function setupCurrencyInput(inputId) {
      const input = document.getElementById(inputId);
      
      // Format saat input berubah
      input.addEventListener('input', function(e) {
        let value = this.value;
        
        // Hapus semua karakter non-digit
        let number_string = value.replace(/[^\\d]/g, '');
        
        // Konversi ke number
        let number = parseInt(number_string);
        if (isNaN(number)) number = 0;
        
        // Format dengan pemisah ribuan
        this.value = number.toLocaleString('id-ID');
      });
      
      // Saat input mendapatkan fokus, hapus format untuk memudahkan editing
      input.addEventListener('focus', function(e) {
        let value = this.value.replace(/[^\\d]/g, '');
        this.value = value || '0';
      });
      
      // Saat input kehilangan fokus, format kembali
      input.addEventListener('blur', function(e) {
        let value = this.value;
        let number_string = value.replace(/[^\\d]/g, '');
        let number = parseInt(number_string);
        if (isNaN(number)) number = 0;
        this.value = number.toLocaleString('id-ID');
      });
    }
    
    // Fungsi untuk mendapatkan nilai numerik dari input terformat
    function getNumericValue(inputId) {
      const input = document.getElementById(inputId);
      const value = input.value.replace(/[^\\d]/g, '');
      return parseInt(value) || 0;
    }
    
    // Load data cabang
    function loadCabangData() {
      const selectCabang = document.getElementById('cabang');
      selectCabang.innerHTML = '<option value="">Memuat data cabang...</option>';
      
      google.script.run
        .withSuccessHandler(function(data) {
          if (data && data.length > 0) {
            selectCabang.innerHTML = '<option value="">Pilih Cabang Lay</option>';
            data.forEach(item => {
              if (item && item.trim()) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectCabang.appendChild(option);
              }
            });
          } else {
            selectCabang.innerHTML = '<option value="">Data tidak ditemukan</option>';
          }
        })
        .withFailureHandler(function(error) {
          selectCabang.innerHTML = '<option value="">Gagal memuat data</option>';
          console.error('Error cabang:', error);
        })
        .getDataCabang();
    }
    
    // Load data kasir
    function loadKasirData() {
      const selectKasir = document.getElementById('kasir');
      selectKasir.innerHTML = '<option value="">Memuat data kasir...</option>';
      
      google.script.run
        .withSuccessHandler(function(data) {
          if (data && data.length > 0) {
            selectKasir.innerHTML = '<option value="">Pilih Nama Kasir</option>';
            data.forEach(item => {
              if (item && item.trim()) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectKasir.appendChild(option);
              }
            });
          } else {
            selectKasir.innerHTML = '<option value="">Data tidak ditemukan</option>';
          }
        })
        .withFailureHandler(function(error) {
          selectKasir.innerHTML = '<option value="">Gagal memuat data</option>';
          console.error('Error kasir:', error);
        })
        .getDataKasir();
    }
    
    // Load data cabang untuk laporan
    function loadReportCabangData() {
      const selectCabang = document.getElementById('report-cabang');
      
      google.script.run
        .withSuccessHandler(function(data) {
          if (data && data.length > 0) {
            data.forEach(item => {
              if (item && item.trim()) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectCabang.appendChild(option);
              }
            });
          }
        })
        .withFailureHandler(function(error) {
          console.error('Error report cabang:', error);
        })
        .getDataCabang();
    }
    
    // Load data kasir untuk laporan
    function loadReportKasirData() {
      const selectKasir = document.getElementById('report-kasir');
      
      google.script.run
        .withSuccessHandler(function(data) {
          if (data && data.length > 0) {
            data.forEach(item => {
              if (item && item.trim()) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectKasir.appendChild(option);
              }
            });
          }
        })
        .withFailureHandler(function(error) {
          console.error('Error report kasir:', error);
        })
        .getDataKasir();
    }
    
    // Simpan data
    function simpanData() {
      const tanggal = document.getElementById('tanggal').value;
      const shift = document.getElementById('shift').value;
      const cabang = document.getElementById('cabang').value;
      const kasir = document.getElementById('kasir').value;
      const keterangan = document.getElementById('keterangan').value;
      const subtotal = hitungTotal(); // Dari sidebar kanan
      
      // Validasi
      if (!tanggal || !shift || !cabang || !kasir) {
        showMessage('Harap lengkapi semua kolom wajib!', 'error');
        return;
      }
      
      // Siapkan data berdasarkan jenis
      const data = {
        tanggal: tanggal,
        jam: new Date().toTimeString().slice(0, 5),
        shift: shift,
        cabang: cabang,
        kasir: kasir,
        keterangan: keterangan,
        subtotal: subtotal,
        jenis: activeMenu // 'masuk' atau 'keluar'
      };
      
      // Tambahkan data khusus berdasarkan jenis
      if (activeMenu === 'masuk') {
        data.penjualan = getNumericValue('penjualan');
        data.pengeluaran = getNumericValue('pengeluaran');
        
        // Siapkan data pecahan uang untuk kas masuk (dari sidebar kanan)
        const pecahanData = [];
        for (let i = 0; i < pecahan.length; i++) {
          const input = document.getElementById('uang-' + i);
          const jumlah = parseInt(input.value) || 0;
          if (jumlah > 0) {
            pecahanData.push({
              nominal: pecahan[i],
              jumlah: jumlah,
              total: jumlah * pecahan[i]
            });
          }
        }
        data.pecahan = pecahanData;
        
      } else if (activeMenu === 'keluar') {
        data.jumlah_keluar = getNumericValue('jumlah-keluar');
        
        // Siapkan data pecahan uang untuk kas keluar (dari sidebar kanan)
        const pecahanData = [];
        
        // Pecahan besar (2 kolom)
        const pecahanBesar = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000];
        for (let i = 0; i < pecahanBesar.length; i++) {
          const ikatInput = document.getElementById('ikat-' + i);
          const lembarInput = document.getElementById('lembar-' + i);
          
          if (ikatInput && lembarInput) {
            const jumlahIkat = parseInt(ikatInput.value) || 0;
            const jumlahLembar = parseInt(lembarInput.value) || 0;
            const totalLembar = (jumlahIkat * 100) + jumlahLembar;
            
            if (totalLembar > 0) {
              pecahanData.push({
                nominal: pecahanBesar[i],
                jumlah: totalLembar, // Total lembar (ikat + lembar)
                total: totalLembar * pecahanBesar[i]
              });
            }
          }
        }
        
        // Pecahan kecil (1 kolom)
        const pecahanKecil = [500, 200, 100];
        for (let i = 0; i < pecahanKecil.length; i++) {
          const idx = i + 8; // Index 8, 9, 10
          const input = document.getElementById('uang-' + idx);
          if (input) {
            const jumlah = parseInt(input.value) || 0;
            if (jumlah > 0) {
              pecahanData.push({
                nominal: pecahanKecil[i],
                jumlah: jumlah,
                total: jumlah * pecahanKecil[i]
              });
            }
          }
        }
        
        data.pecahan = pecahanData;
      }
      
      // Tampilkan loading
      const btn = document.getElementById('btnSimpan');
      const btnText = btn.innerHTML;
      btn.innerHTML = '⏳ Menyimpan...';
      btn.disabled = true;
      
      // Kirim ke server
      google.script.run
        .withSuccessHandler(function(response) {
          showMessage(response, 'success');
          resetForm();
          btn.innerHTML = btnText;
          btn.disabled = false;
        })
        .withFailureHandler(function(error) {
          showMessage('Error: ' + error.message, 'error');
          btn.innerHTML = btnText;
          btn.disabled = false;
        })
        .simpanData(data);
    }
    
    // Preview laporan
    function previewLaporan() {
      const tanggal = document.getElementById('report-tanggal').value;
      const shift = document.getElementById('report-shift').value;
      const cabang = document.getElementById('report-cabang').value;
      const kasir = document.getElementById('report-kasir').value;
      
      if (!tanggal) {
        showReportMessage('Harap pilih tanggal!', 'error');
        return;
      }
      
      // Tampilkan loading
      const resultDiv = document.getElementById('report-result');
      resultDiv.textContent = '⏳ Memuat laporan...';
      resultDiv.className = 'result loading';
      resultDiv.style.display = 'block';
      
      const data = {
        tanggal: tanggal,
        shift: shift,
        cabang: cabang,
        kasir: kasir
      };
      
      google.script.run
        .withSuccessHandler(function(response) {
          if (response.error) {
            showReportMessage(response.error, 'error');
            return;
          }
          
          // Tampilkan preview
          displayReportPreview(response);
          showReportMessage('Laporan berhasil dimuat!', 'success');
        })
        .withFailureHandler(function(error) {
          showReportMessage('Error: ' + error.message, 'error');
        })
        .getLaporanData(data);
    }
    
    // Tampilkan preview laporan
    function displayReportPreview(data) {
      const previewDiv = document.getElementById('report-preview');
      previewDiv.style.display = 'block';
      
      // Isi data laporan
      document.getElementById('preview-tanggal').textContent = data.tanggal;
      document.getElementById('preview-shift').textContent = data.shift || 'Semua Shift';
      document.getElementById('preview-cabang').textContent = data.cabang || 'Semua Cabang';
      document.getElementById('preview-kasir').textContent = data.kasir || 'Semua Kasir';
      
      // Format nilai uang
      document.getElementById('preview-penjualan').textContent = 'Rp ' + formatRupiah(data.totalPenjualan);
      document.getElementById('preview-pengeluaran').textContent = 'Rp ' + formatRupiah(data.totalPengeluaran);
      document.getElementById('preview-fisik').textContent = 'Rp ' + formatRupiah(data.totalFisik);
      
      // HITUNG SETORAN: Total Penjualan - Total Pengeluaran - Total Uang Fisik
      var setoran = data.totalPenjualan - data.totalPengeluaran - data.totalFisik;
      
      // Tentukan status setoran sesuai permintaan
      const setoranDiv = document.getElementById('preview-setoran');
      if (setoran === 0) {
        setoranDiv.textContent = 'SETORAN PAS';
        setoranDiv.className = 'setoran-message setoran-pas';
      } else if (setoran > 0) {
        setoranDiv.textContent = 'SETORAN KURANG Rp ' + formatRupiah(setoran);
        setoranDiv.className = 'setoran-message setoran-kurang';
      } else {
        setoranDiv.textContent = 'SETORAN LEBIH Rp ' + formatRupiah(Math.abs(setoran));
        setoranDiv.className = 'setoran-message setoran-lebih';
      }
      
      // Tampilkan rincian uang
      displayRincianUang(data.rincianUang);
    }
    
    // Tampilkan rincian uang
    function displayRincianUang(rincian) {
      const container = document.getElementById('rincian-uang-container');
      container.innerHTML = '';
      
      // Buat judul
      const title = document.createElement('div');
      title.className = 'section-title';
      title.textContent = '💰 RINCIAN UANG';
      container.appendChild(title);
      
      // Tampilkan hanya pecahan yang ada isinya
      const pecahanLabels = [
        { nominal: 100000, label: '100.000' },
        { nominal: 75000, label: '75.000' },
        { nominal: 50000, label: '50.000' },
        { nominal: 20000, label: '20.000' },
        { nominal: 10000, label: '10.000' },
        { nominal: 5000, label: '5.000' },
        { nominal: 2000, label: '2.000' },
        { nominal: 1000, label: '1.000' },
        { nominal: 500, label: '500' },
        { nominal: 200, label: '200' },
        { nominal: 100, label: '100' }
      ];
      
      pecahanLabels.forEach(item => {
        const jumlah = rincian[item.nominal] || 0;
        if (jumlah > 0) {
          const total = jumlah * item.nominal;
          const div = document.createElement('div');
          div.className = 'rincian-item';
          div.innerHTML = \`
            <div>\${item.label} × \${jumlah} lembar</div>
            <div><strong>Rp \${total.toLocaleString('id-ID')}</strong></div>
          \`;
          container.appendChild(div);
        }
      });
      
      // Jika tidak ada rincian
      if (container.children.length === 1) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'rincian-item';
        emptyDiv.textContent = 'Tidak ada rincian uang';
        container.appendChild(emptyDiv);
      }
    }
    
    // Tampilkan pesan
    function showMessage(msg, type) {
      const resultDiv = document.getElementById('result');
      resultDiv.textContent = msg;
      resultDiv.className = 'result ' + type;
      resultDiv.style.display = 'block';
      
      // Auto hide setelah 5 detik untuk success
      if (type === 'success') {
        setTimeout(() => {
          resultDiv.style.display = 'none';
        }, 5000);
      }
    }
    
    // Tampilkan pesan untuk laporan
    function showReportMessage(msg, type) {
      const resultDiv = document.getElementById('report-result');
      resultDiv.textContent = msg;
      resultDiv.className = 'result ' + type;
      resultDiv.style.display = 'block';
    }
    
    // Reset form setelah simpan
    function resetForm() {
      // Reset tanggal ke hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('tanggal').value = today;
      
      // Reset shift ke pilihan pertama (kosong)
      document.getElementById('shift').selectedIndex = 0;
      
      // Reset cabang ke pilihan pertama (kosong)
      document.getElementById('cabang').selectedIndex = 0;
      
      // Reset kasir ke pilihan pertama (kosong)
      document.getElementById('kasir').selectedIndex = 0;
      
      // Reset keterangan
      document.getElementById('keterangan').value = '';
      
      // Reset penjualan dan pengeluaran
      if (activeMenu === 'masuk') {
        document.getElementById('penjualan').value = '0';
        document.getElementById('pengeluaran').value = '0';
      } else {
        document.getElementById('jumlah-keluar').value = '0';
      }
      
      // Reset input uang dan tampilan hasil (DI SIDEBAR KANAN)
      if (activeMenu === 'masuk') {
        for (let i = 0; i < pecahan.length; i++) {
          const input = document.getElementById('uang-' + i);
          if (input) {
            input.value = '0';
            const hasilDiv = document.getElementById('hasil-' + i);
            if (hasilDiv) {
              hasilDiv.innerHTML = \`
                = Rp 0
                <div class="uang-total">0 lembar</div>
              \`;
            }
          }
        }
      } else if (activeMenu === 'keluar') {
        // Reset pecahan besar (2 kolom)
        for (let i = 0; i < 8; i++) {
          const ikatInput = document.getElementById('ikat-' + i);
          const lembarInput = document.getElementById('lembar-' + i);
          
          if (ikatInput && lembarInput) {
            ikatInput.value = '0';
            lembarInput.value = '0';
            const hasilDiv = document.getElementById('hasil-' + i);
            if (hasilDiv) {
              hasilDiv.innerHTML = \`
                = Rp 0
                <div class="ikat-info">0 ikat + 0 lembar</div>
              \`;
            }
          }
        }
        
        // Reset pecahan kecil (1 kolom)
        for (let i = 8; i < 11; i++) {
          const input = document.getElementById('uang-' + i);
          if (input) {
            input.value = '0';
            const hasilDiv = document.getElementById('hasil-' + i);
            if (hasilDiv) {
              hasilDiv.innerHTML = \`
                = Rp 0
                <div class="uang-total">0 lembar</div>
              \`;
            }
          }
        }
      }
      
      // Hitung ulang total (DI SIDEBAR KANAN)
      hitungTotal();
    }
    
    // Inisialisasi
    window.onload = function() {
      // Set tanggal hari ini
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('tanggal').value = today;
      document.getElementById('report-tanggal').value = today;
      
      // Setup input dengan format rupiah
      setupCurrencyInput('penjualan');
      setupCurrencyInput('pengeluaran');
      setupCurrencyInput('jumlah-keluar');
      
      // Format nilai awal
      document.getElementById('penjualan').value = '0';
      document.getElementById('pengeluaran').value = '0';
      document.getElementById('jumlah-keluar').value = '0';
      
      // Buat tampilan pecahan awal (kas masuk) - DI SIDEBAR KANAN
      buatTampilanPecahan();
      
      // Load data dari spreadsheet
      loadCabangData();
      loadKasirData();
    };
  </script>
</body>
</html>`;
  
  return html;
}

// ============= FUNGSI DATA CABANG =============
function getDataCabang() {
  try {
    console.log("Mengambil data cabang...");
    
    // Coba buka spreadsheet
    var ss;
    try {
      ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    } catch (e) {
      console.error("Gagal membuka spreadsheet:", e.message);
      return ["Cabang 1", "Cabang 2", "Cabang 3"];
    }
    
    // Cari sheet "Nama"
    var sheet = ss.getSheetByName("Nama");
    if (!sheet) {
      console.log("Sheet 'Nama' tidak ditemukan");
      return ["Cabang 1", "Cabang 2", "Cabang 3"];
    }
    
    // Ambil data dari kolom E (kolom 5) mulai baris 3
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) {
      console.log("Data kurang dari 3 baris");
      return ["Cabang 1", "Cabang 2", "Cabang 3"];
    }
    
    var range = sheet.getRange(3, 5, lastRow - 2, 1); // E3:E
    var values = range.getValues();
    
    var data = [];
    var seen = {};
    
    for (var i = 0; i < values.length; i++) {
      var value = values[i][0];
      if (value && typeof value === 'string' && value.trim() !== '') {
        var trimmed = value.trim();
        if (!seen[trimmed]) {
          data.push(trimmed);
          seen[trimmed] = true;
        }
      }
    }
    
    // Urutkan data
    data.sort();
    
    console.log("Data cabang ditemukan: " + data.length + " item");
    
    if (data.length === 0) {
      data = ["Cabang 1", "Cabang 2", "Cabang 3"];
    }
    
    return data;
    
  } catch (error) {
    console.error("Error getDataCabang:", error.message);
    return ["Cabang 1", "Cabang 2", "Cabang 3"];
  }
}

// ============= FUNGSI DATA KASIR =============
function getDataKasir() {
  try {
    console.log("Mengambil data kasir...");
    
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var sheet = ss.getSheetByName("Nama");
    
    if (!sheet) {
      console.log("Sheet 'Nama' tidak ditemukan");
      return ["Kasir 1", "Kasir 2", "Kasir 3"];
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 3) {
      return ["Kasir 1", "Kasir 2", "Kasir 3"];
    }
    
    var range = sheet.getRange(3, 2, lastRow - 2, 1); // B3:B
    var values = range.getValues();
    
    var data = [];
    var seen = {};
    
    for (var i = 0; i < values.length; i++) {
      var value = values[i][0];
      if (value && typeof value === 'string' && value.trim() !== '') {
        var trimmed = value.trim();
        if (!seen[trimmed]) {
          data.push(trimmed);
          seen[trimmed] = true;
        }
      }
    }
    
    data.sort();
    
    console.log("Data kasir ditemukan: " + data.length + " item");
    
    if (data.length === 0) {
      data = ["Kasir 1", "Kasir 2", "Kasir 3"];
    }
    
    return data;
    
  } catch (error) {
    console.error("Error getDataKasir:", error.message);
    return ["Kasir 1", "Kasir 2", "Kasir 3"];
  }
}

// ============= FUNGSI SIMPAN DATA DENGAN BORDER =============
function simpanData(d) {
  try {
    console.log("Menyimpan data:", JSON.stringify(d));
    
    // Validasi
    if (!d.tanggal || !d.shift || !d.cabang || !d.kasir) {
      throw new Error("Data wajib tidak lengkap");
    }
    
    // Buka spreadsheet
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    
    // Format tanggal
    var tanggalTransaksi = new Date(d.tanggal);
    if (d.jam) {
      var timeParts = d.jam.split(':');
      if (timeParts.length >= 2) {
        tanggalTransaksi.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
      }
    }
    
    // PROSES BERDASARKAN JENIS
    if (d.jenis === "masuk") {
      // ======== SIMPAN KAS MASUK ========
      return simpanKasMasuk(d, ss, tanggalTransaksi);
    } else if (d.jenis === "keluar") {
      // ======== SIMPAN KAS KELUAR ========
      return simpanKasKeluar(d, ss, tanggalTransaksi);
    } else {
      throw new Error("Jenis transaksi tidak valid");
    }
    
  } catch (error) {
    console.error("Error simpanData:", error.message);
    return "❌ Error: " + error.message;
  }
}

// Fungsi untuk menyimpan kas masuk dengan border
function simpanKasMasuk(d, ss, tanggalTransaksi) {
  try {
    var sheetDB = ss.getSheetByName("Database");
    var sheetRincian = ss.getSheetByName("Rincian");
    
    if (!sheetDB) {
      throw new Error("Sheet 'Database' tidak ditemukan");
    }
    
    if (!sheetRincian) {
      throw new Error("Sheet 'Rincian' tidak ditemukan");
    }
    
    // Hitung nomor transaksi dengan format LAY-000001
    var lastRowDB = sheetDB.getLastRow();
    var noTransaksi;
    
    if (lastRowDB <= 1) {
      noTransaksi = "LAY-000001";
    } else {
      // Cari nomor transaksi terakhir
      var lastNoCell = sheetDB.getRange(lastRowDB, 2).getValue();
      if (lastNoCell && lastNoCell.toString().startsWith("LAY-")) {
        var lastNoStr = lastNoCell.toString().replace("LAY-", "");
        var lastNo = parseInt(lastNoStr) || 0;
        var nextNo = lastNo + 1;
        noTransaksi = "LAY-" + nextNo.toString().padStart(6, '0');
      } else {
        // Jika format tidak sesuai, mulai dari LAY-000001
        noTransaksi = "LAY-000001";
      }
    }
    
    // ======== SIMPAN KE SHEET DATABASE (15 KOLOM) ========
    var rowDataDB = [
      new Date(), // Kolom A: Timestamp
      noTransaksi, // Kolom B: No Transaksi (LAY-000001)
      tanggalTransaksi, // Kolom C: Tanggal
      d.jam || "", // Kolom D: Jam
      d.shift, // Kolom E: Shift
      d.cabang, // Kolom F: Cabang Lay
      d.kasir, // Kolom G: Nama Kasir
      d.keterangan || "", // Kolom H: Keterangan
      parseFloat(d.penjualan) || 0, // Kolom I: Penjualan
      parseFloat(d.pengeluaran) || 0, // Kolom J: Pengeluaran
      parseFloat(d.subtotal) || 0, // Kolom K: Kas Masuk
      "", // Kolom L: Kosong
      "", // Kolom M: Kosong
      "", // Kolom N: Kosong
      ""  // Kolom O: Kosong
    ];
    
    // Simpan ke spreadsheet Database
    sheetDB.appendRow(rowDataDB);
    
    // Format kolom Database
    var newRowDB = sheetDB.getLastRow();
    
    // Format tanggal
    sheetDB.getRange(newRowDB, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheetDB.getRange(newRowDB, 3).setNumberFormat('dddd/mmmm/yyyy');
    
    // Format angka untuk kolom I, J, K (Penjualan, Pengeluaran, Kas Masuk)
    sheetDB.getRange(newRowDB, 9, 1, 3).setNumberFormat('#,##0');
    
    // ======== TAMBAHKAN BORDER PADA SHEET DATABASE (KOLOM A SAMPAI O) ========
    applyBorderToDatabaseRow(sheetDB, newRowDB);
    
    console.log("Data kas masuk berhasil disimpan di Database baris: " + newRowDB);
    
    // ======== SIMPAN KE SHEET RINCIAN ========
    // Siapkan data rincian pecahan uang
    var jumlahLembar = [];
    
    // Inisialisasi array dengan 0 untuk semua pecahan
    for (var i = 0; i < 11; i++) {
      jumlahLembar.push(0);
    }
    
    // Isi jumlah lembar dari data yang dikirim
    if (d.pecahan && Array.isArray(d.pecahan)) {
      d.pecahan.forEach(function(item) {
        var nominal = item.nominal;
        var index = -1;
        
        // Temukan index berdasarkan nominal
        if (nominal === 100000) index = 0;
        else if (nominal === 75000) index = 1;
        else if (nominal === 50000) index = 2;
        else if (nominal === 20000) index = 3;
        else if (nominal === 10000) index = 4;
        else if (nominal === 5000) index = 5;
        else if (nominal === 2000) index = 6;
        else if (nominal === 1000) index = 7;
        else if (nominal === 500) index = 8;
        else if (nominal === 200) index = 9;
        else if (nominal === 100) index = 10;
        
        if (index !== -1) {
          jumlahLembar[index] = item.jumlah || 0;
        }
      });
    }
    
    // Siapkan data untuk sheet Rincian
    var rowDataRincian = [
      noTransaksi, // Kolom A: No. Transaksi (LAY-000001)
      tanggalTransaksi, // Kolom B: Tanggal
      d.jam || "", // Kolom C: Jam
      d.shift, // Kolom D: Shift
      d.cabang, // Kolom E: Cabang Lay
      d.kasir, // Kolom F: Nama Kasir
      jumlahLembar[0], // Kolom G: 100.000
      jumlahLembar[1], // Kolom H: 75.000
      jumlahLembar[2], // Kolom I: 50.000
      jumlahLembar[3], // Kolom J: 20.000
      jumlahLembar[4], // Kolom K: 10.000
      jumlahLembar[5], // Kolom L: 5.000
      jumlahLembar[6], // Kolom M: 2.000
      jumlahLembar[7], // Kolom N: 1.000
      jumlahLembar[8], // Kolom O: 500
      jumlahLembar[9], // Kolom P: 200
      jumlahLembar[10], // Kolom Q: 100
      parseFloat(d.penjualan) || 0, // Kolom R: Penjualan
      parseFloat(d.pengeluaran) || 0, // Kolom S: Pengeluaran
      parseFloat(d.subtotal) || 0 // Kolom T: Kas Masuk
    ];
    
    // Simpan ke sheet Rincian
    sheetRincian.appendRow(rowDataRincian);
    
    // Format kolom Rincian
    var newRowRincian = sheetRincian.getLastRow();
    sheetRincian.getRange(newRowRincian, 2).setNumberFormat('dd/mm/yyyy');
    
    // Format angka untuk kolom pecahan uang (G sampai Q)
    sheetRincian.getRange(newRowRincian, 7, 1, 11).setNumberFormat('#,##0');
    
    // Format angka untuk kolom R, S, T (Penjualan, Pengeluaran, Kas Masuk)
    sheetRincian.getRange(newRowRincian, 18, 1, 3).setNumberFormat('#,##0');
    
    // ======== TAMBAHKAN BORDER PADA SHEET RINCIAN ========
    applyBorderToRincianRow(sheetRincian, newRowRincian);
    
    console.log("Data rincian kas masuk berhasil disimpan di sheet Rincian baris: " + newRowRincian);
    
    return "✅ Kas Masuk berhasil disimpan! No. Transaksi: " + noTransaksi + " (Database dan Rincian)";
    
  } catch (error) {
    console.error("Error simpanKasMasuk:", error.message);
    throw error;
  }
}

// Fungsi untuk menyimpan kas keluar dengan border
function simpanKasKeluar(d, ss, tanggalTransaksi) {
  try {
    var sheetDB = ss.getSheetByName("Database");
    
    if (!sheetDB) {
      throw new Error("Sheet 'Database' tidak ditemukan");
    }
    
    // Hitung nomor transaksi dengan format LAY-000001
    var lastRowDB = sheetDB.getLastRow();
    var noTransaksi;
    
    if (lastRowDB <= 1) {
      noTransaksi = "LAY-000001";
    } else {
      // Cari nomor transaksi terakhir
      var lastNoCell = sheetDB.getRange(lastRowDB, 2).getValue();
      if (lastNoCell && lastNoCell.toString().startsWith("LAY-")) {
        var lastNoStr = lastNoCell.toString().replace("LAY-", "");
        var lastNo = parseInt(lastNoStr) || 0;
        var nextNo = lastNo + 1;
        noTransaksi = "LAY-" + nextNo.toString().padStart(6, '0');
      } else {
        // Jika format tidak sesuai, mulai dari LAY-000001
        noTransaksi = "LAY-000001";
      }
    }
    
    // Hitung total untuk kolom N (rincian uang + jumlah kas keluar jika ada)
    var totalRincian = parseFloat(d.subtotal) || 0;
    var jumlahKeluar = parseFloat(d.jumlah_keluar) || 0;
    var totalKolomN = totalRincian + jumlahKeluar;
    
    // ======== SIMPAN KE SHEET DATABASE (15 KOLOM) ========
    var rowDataDB = [
      new Date(), // Kolom A: Timestamp
      noTransaksi, // Kolom B: No Transaksi (LAY-000001)
      tanggalTransaksi, // Kolom C: Tanggal
      d.jam || "", // Kolom D: Jam
      d.shift, // Kolom E: Shift
      d.cabang, // Kolom F: Cabang Lay
      d.kasir, // Kolom G: Nama Kasir
      d.keterangan || "", // Kolom H: Keterangan
      "", // Kolom I: Kosong (tidak ada penjualan)
      "", // Kolom J: Kosong (tidak ada pengeluaran)
      "", // Kolom K: Kosong (tidak ada kas masuk)
      "", // Kolom L: Kosong
      "", // Kolom M: Kosong
      totalKolomN, // Kolom N: Kas Keluar
      ""  // Kolom O: Kosong
    ];
    
    // Simpan ke spreadsheet Database
    sheetDB.appendRow(rowDataDB);
    
    // Format kolom Database
    var newRowDB = sheetDB.getLastRow();
    sheetDB.getRange(newRowDB, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sheetDB.getRange(newRowDB, 3).setNumberFormat('dddd/mmmm/yyyy');
    
    // Format angka untuk kolom N (Kas Keluar)
    sheetDB.getRange(newRowDB, 14).setNumberFormat('#,##0');
    
    // ======== TAMBAHKAN BORDER PADA SHEET DATABASE (KOLOM A SAMPAI O) ========
    applyBorderToDatabaseRow(sheetDB, newRowDB);
    
    console.log("Data kas keluar berhasil disimpan di Database baris: " + newRowDB);
    console.log("Total kolom N: " + totalKolomN + " (Rincian: " + totalRincian + " + Jumlah Kas: " + jumlahKeluar + ")");
    
    return "✅ Kas Keluar berhasil disimpan! No. Transaksi: " + noTransaksi + " (Total: Rp " + totalKolomN.toLocaleString('id-ID') + ")";
    
  } catch (error) {
    console.error("Error simpanKasKeluar:", error.message);
    throw error;
  }
}

// ============= FUNGSI UNTUK MENAMBAHKAN BORDER PADA DATABASE =============
function applyBorderToDatabaseRow(sheet, row) {
  try {
    // Ambil range untuk baris yang baru ditambahkan (Kolom A sampai O = 15 kolom)
    var range = sheet.getRange(row, 1, 1, 15);
    
    // Set border untuk semua sisi dengan warna abu-abu medium
    range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
    
    // Set border tebal untuk bagian bawah untuk memisahkan antar baris
    range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    // Set background warna untuk header jika ini baris pertama
    if (row === 1) {
      range.setBackground("#4a86e8");
      range.setFontColor("#ffffff");
      range.setFontWeight("bold");
      range.setHorizontalAlignment("center");
    } else {
      // Set background warna bergantian untuk baris data (zebra stripes)
      if (row % 2 === 0) {
        range.setBackground("#f9f9f9"); // Warna terang untuk baris genap
      } else {
        range.setBackground("#ffffff"); // Warna putih untuk baris ganjil
      }
      
      // Set alignment untuk kolom tertentu
      // Kolom A (Timestamp) - kiri
      sheet.getRange(row, 1).setHorizontalAlignment("left");
      // Kolom B (No Transaksi) - tengah
      sheet.getRange(row, 2).setHorizontalAlignment("center");
      // Kolom C (Tanggal) - tengah
      sheet.getRange(row, 3).setHorizontalAlignment("center");
      // Kolom D (Jam) - tengah
      sheet.getRange(row, 4).setHorizontalAlignment("center");
      // Kolom E (Shift) - tengah
      sheet.getRange(row, 5).setHorizontalAlignment("center");
      // Kolom F (Cabang) - tengah
      sheet.getRange(row, 6).setHorizontalAlignment("center");
      // Kolom G (Kasir) - tengah
      sheet.getRange(row, 7).setHorizontalAlignment("center");
      // Kolom H (Keterangan) - kiri
      sheet.getRange(row, 8).setHorizontalAlignment("left");
      // Kolom I, J, K, N (angka) - kanan
      sheet.getRange(row, 9).setHorizontalAlignment("right");
      sheet.getRange(row, 10).setHorizontalAlignment("right");
      sheet.getRange(row, 11).setHorizontalAlignment("right");
      sheet.getRange(row, 14).setHorizontalAlignment("right");
    }
    
    // Set vertical alignment untuk semua sel
    range.setVerticalAlignment("middle");
    
    // Set wrap text untuk kolom keterangan
    sheet.getRange(row, 8).setWrap(true);
    
    console.log("Border berhasil ditambahkan untuk baris " + row + " di sheet Database (kolom A-O)");
    
  } catch (error) {
    console.error("Error applyBorderToDatabaseRow:", error.message);
  }
}

// ============= FUNGSI UNTUK MENAMBAHKAN BORDER PADA RINCIAN =============
function applyBorderToRincianRow(sheet, row) {
  try {
    // Ambil range untuk baris yang baru ditambahkan (Kolom A sampai T = 20 kolom)
    var range = sheet.getRange(row, 1, 1, 20);
    
    // Set border untuk semua sisi dengan warna abu-abu medium
    range.setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
    
    // Set border tebal untuk bagian bawah untuk memisahkan antar baris
    range.setBorder(null, null, true, null, null, null, "#999999", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    // Set background warna untuk header jika ini baris pertama
    if (row === 1) {
      range.setBackground("#3498db");
      range.setFontColor("#ffffff");
      range.setFontWeight("bold");
      range.setHorizontalAlignment("center");
    } else {
      // Set background warna bergantian untuk baris data (zebra stripes)
      if (row % 2 === 0) {
        range.setBackground("#f0f8ff"); // Warna biru muda untuk baris genap
      } else {
        range.setBackground("#ffffff"); // Warna putih untuk baris ganjil
      }
      
      // Set alignment untuk kolom tertentu
      // Kolom A (No Transaksi) - tengah
      sheet.getRange(row, 1).setHorizontalAlignment("center");
      // Kolom B (Tanggal) - tengah
      sheet.getRange(row, 2).setHorizontalAlignment("center");
      // Kolom C (Jam) - tengah
      sheet.getRange(row, 3).setHorizontalAlignment("center");
      // Kolom D (Shift) - tengah
      sheet.getRange(row, 4).setHorizontalAlignment("center");
      // Kolom E (Cabang) - tengah
      sheet.getRange(row, 5).setHorizontalAlignment("center");
      // Kolom F (Kasir) - tengah
      sheet.getRange(row, 6).setHorizontalAlignment("center");
      // Kolom G sampai Q (pecahan uang) - kanan
      for (var col = 7; col <= 17; col++) {
        sheet.getRange(row, col).setHorizontalAlignment("right");
      }
      // Kolom R, S, T (angka) - kanan
      sheet.getRange(row, 18).setHorizontalAlignment("right");
      sheet.getRange(row, 19).setHorizontalAlignment("right");
      sheet.getRange(row, 20).setHorizontalAlignment("right");
    }
    
    // Set vertical alignment untuk semua sel
    range.setVerticalAlignment("middle");
    
    console.log("Border berhasil ditambahkan untuk baris " + row + " di sheet Rincian (kolom A-T)");
    
  } catch (error) {
    console.error("Error applyBorderToRincianRow:", error.message);
  }
}

// ============= FUNGSI UNTUK MENERAPKAN BORDER KE SEMUA DATA YANG SUDAH ADA =============
function applyBorderToAllData() {
  try {
    console.log("Menerapkan border ke semua data yang sudah ada...");
    
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    
    // ======== SHEET DATABASE ========
    var sheetDB = ss.getSheetByName("Database");
    if (sheetDB) {
      var lastRowDB = sheetDB.getLastRow();
      
      if (lastRowDB > 1) {
        // Terapkan border untuk semua data (mulai dari baris 2)
        for (var row = 2; row <= lastRowDB; row++) {
          applyBorderToDatabaseRow(sheetDB, row);
        }
        console.log("Border diterapkan ke " + (lastRowDB - 1) + " baris di sheet Database (kolom A-O)");
      }
    }
    
    // ======== SHEET RINCIAN ========
    var sheetRincian = ss.getSheetByName("Rincian");
    if (sheetRincian) {
      var lastRowRincian = sheetRincian.getLastRow();
      
      if (lastRowRincian > 1) {
        // Terapkan border untuk semua data (mulai dari baris 2)
        for (var row = 2; row <= lastRowRincian; row++) {
          applyBorderToRincianRow(sheetRincian, row);
        }
        console.log("Border diterapkan ke " + (lastRowRincian - 1) + " baris di sheet Rincian (kolom A-T)");
      }
    }
    
    return "✅ Border berhasil diterapkan ke semua data yang sudah ada!";
    
  } catch (error) {
    console.error("Error applyBorderToAllData:", error.message);
    return "❌ Error: " + error.message;
  }
}

// ============= FUNGSI LAPORAN =============
function getLaporanData(filter) {
  try {
    console.log("Mengambil data laporan dengan filter:", JSON.stringify(filter));
    
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    var sheetRincian = ss.getSheetByName("Rincian");
    var sheetDatabase = ss.getSheetByName("Database");
    
    if (!sheetRincian) {
      return { error: "Sheet 'Rincian' tidak ditemukan" };
    }
    
    if (!sheetDatabase) {
      return { error: "Sheet 'Database' tidak ditemukan" };
    }
    
    // Ambil data dari sheet Rincian (kas masuk)
    var lastRowRincian = sheetRincian.getLastRow();
    var dataRincian = [];
    
    if (lastRowRincian > 1) {
      var range = sheetRincian.getRange(2, 1, lastRowRincian - 1, 20); // A2:T
      dataRincian = range.getValues();
    }
    
    // Ambil data dari sheet Database (untuk kas keluar, tapi tidak digunakan dalam perhitungan setoran)
    var lastRowDB = sheetDatabase.getLastRow();
    var dataDatabase = [];
    
    if (lastRowDB > 1) {
      var rangeDB = sheetDatabase.getRange(2, 1, lastRowDB - 1, 15); // A2:O
      dataDatabase = rangeDB.getValues();
    }
    
    // Filter data kas masuk berdasarkan kriteria
    var filteredDataMasuk = [];
    
    for (var i = 0; i < dataRincian.length; i++) {
      var row = dataRincian[i];
      
      // Cek tanggal (kolom B, index 1)
      var rowTanggal = row[1];
      if (!(rowTanggal instanceof Date)) continue;
      
      var rowDate = Utilities.formatDate(rowTanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (rowDate !== filter.tanggal) continue;
      
      // Cek shift (kolom D, index 3)
      if (filter.shift && row[3] !== filter.shift) continue;
      
      // Cek cabang (kolom E, index 4)
      if (filter.cabang && row[4] !== filter.cabang) continue;
      
      // Cek kasir (kolom F, index 5)
      if (filter.kasir && row[5] !== filter.kasir) continue;
      
      filteredDataMasuk.push(row);
    }
    
    // Filter data kas keluar berdasarkan kriteria (untuk statistik saja)
    var filteredDataKeluar = [];
    var totalKasKeluar = 0;
    
    for (var i = 0; i < dataDatabase.length; i++) {
      var row = dataDatabase[i];
      
      // Cek apakah ini kas keluar (kolom N ada jumlah > 0)
      var jumlahKeluar = parseFloat(row[13]) || 0;
      
      // Jika kolom N = 0, skip (bukan kas keluar)
      if (jumlahKeluar === 0) continue;
      
      // Cek tanggal (kolom C, index 2)
      var rowTanggal = row[2];
      if (!(rowTanggal instanceof Date)) continue;
      
      var rowDate = Utilities.formatDate(rowTanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (rowDate !== filter.tanggal) continue;
      
      // Cek shift (kolom E, index 4)
      if (filter.shift && row[4] !== filter.shift) continue;
      
      // Cek cabang (kolom F, index 5)
      if (filter.cabang && row[5] !== filter.cabang) continue;
      
      // Cek kasir (kolom G, index 6)
      if (filter.kasir && row[6] !== filter.kasir) continue;
      
      filteredDataKeluar.push(row);
      totalKasKeluar += jumlahKeluar;
    }
    
    if (filteredDataMasuk.length === 0 && filteredDataKeluar.length === 0) {
      return { error: "Tidak ada data untuk filter yang dipilih" };
    }
    
    // Hitung total
    var totalPenjualan = 0;
    var totalPengeluaran = 0;
    var totalFisik = 0;
    var rincianUang = {};
    
    // Inisialisasi rincian uang
    var nominalList = [100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    nominalList.forEach(function(nominal) {
      rincianUang[nominal] = 0;
    });
    
    // Proses setiap baris data kas masuk
    filteredDataMasuk.forEach(function(row) {
      // Total Penjualan Komputer (kolom R - index 17)
      totalPenjualan += parseFloat(row[17]) || 0;
      
      // Total Pengeluaran (kolom S - index 18)
      totalPengeluaran += parseFloat(row[18]) || 0;
      
      // Total Uang Fisik (kolom T - index 19)
      totalFisik += parseFloat(row[19]) || 0;
      
      // Akumulasi rincian uang (kolom G-Q)
      rincianUang[100000] += parseFloat(row[6]) || 0;
      rincianUang[75000] += parseFloat(row[7]) || 0;
      rincianUang[50000] += parseFloat(row[8]) || 0;
      rincianUang[20000] += parseFloat(row[9]) || 0;
      rincianUang[10000] += parseFloat(row[10]) || 0;
      rincianUang[5000] += parseFloat(row[11]) || 0;
      rincianUang[2000] += parseFloat(row[12]) || 0;
      rincianUang[1000] += parseFloat(row[13]) || 0;
      rincianUang[500] += parseFloat(row[14]) || 0;
      rincianUang[200] += parseFloat(row[15]) || 0;
      rincianUang[100] += parseFloat(row[16]) || 0;
    });
    
    // PERHITUNGAN SETORAN SESUAI PERMINTAAN:
    // Setoran = Total Penjualan - Total Pengeluaran - Total Uang Fisik
    var setoran = totalPenjualan - totalPengeluaran - totalFisik;
    
    // Siapkan data untuk dikembalikan
    var result = {
      tanggal: filter.tanggal,
      shift: filter.shift || "Semua Shift",
      cabang: filter.cabang || "Semua Cabang",
      kasir: filter.kasir || "Semua Kasir",
      totalPenjualan: totalPenjualan,
      totalPengeluaran: totalPengeluaran,
      totalKasKeluar: totalKasKeluar, // Untuk statistik internal
      totalFisik: totalFisik,
      setoran: setoran, // Digunakan untuk menentukan status setoran
      rincianUang: rincianUang,
      jumlahTransaksiMasuk: filteredDataMasuk.length,
      jumlahTransaksiKeluar: filteredDataKeluar.length
    };
    
    console.log("Data laporan berhasil diambil:", result);
    console.log("Perhitungan Setoran: " + totalPenjualan + " - " + totalPengeluaran + " - " + totalFisik + " = " + setoran);
    
    return result;
    
  } catch (error) {
    console.error("Error getLaporanData:", error.message);
    return { error: "Error: " + error.message };
  }
}

// ============= FUNGSI TEST =============
function testKoneksi() {
  console.log("=== TEST KONEKSI ===");
  
  try {
    // Test buka spreadsheet
    var ss = SpreadsheetApp.openById("1hoQLe9HHdEgyf9C4WKVi4LLsNKnskn0yEBL2z1e1F3k");
    console.log("✅ Spreadsheet berhasil dibuka");
    
    // Test sheet "Nama"
    var sheetNama = ss.getSheetByName("Nama");
    if (sheetNama) {
      console.log("✅ Sheet 'Nama' ditemukan");
      console.log("Jumlah baris: " + sheetNama.getLastRow());
      console.log("Jumlah kolom: " + sheetNama.getLastColumn());
    } else {
      console.log("❌ Sheet 'Nama' tidak ditemukan");
    }
    
    // Test sheet "Database"
    var sheetDB = ss.getSheetByName("Database");
    if (sheetDB) {
      console.log("✅ Sheet 'Database' ditemukan");
      console.log("Jumlah baris: " + sheetDB.getLastRow());
      console.log("Jumlah kolom: " + sheetDB.getLastColumn());
      
      // Cek struktur kolom
      var headersDB = sheetDB.getRange(1, 1, 1, sheetDB.getLastColumn()).getValues()[0];
      console.log("Headers Database:", headersDB);
    } else {
      console.log("❌ Sheet 'Database' tidak ditemukan");
    }
    
    // Test sheet "Rincian"
    var sheetRincian = ss.getSheetByName("Rincian");
    if (sheetRincian) {
      console.log("✅ Sheet 'Rincian' ditemukan");
      console.log("Jumlah baris: " + sheetRincian.getLastRow());
      console.log("Jumlah kolom: " + sheetRincian.getLastColumn());
    } else {
      console.log("❌ Sheet 'Rincian' tidak ditemukan");
    }
    
    return "Test koneksi berhasil";
    
  } catch (error) {
    console.error("❌ Error test koneksi:", error.message);
    return "Error: " + error.message;
  }
}

function testFungsi() {
  console.log("=== TEST FUNGSI ===");
  
  try {
    // Test getDataCabang
    console.log("Testing getDataCabang...");
    var cabang = getDataCabang();
    console.log("Data cabang:", cabang);
    
    // Test getDataKasir
    console.log("Testing getDataKasir...");
    var kasir = getDataKasir();
    console.log("Data kasir:", kasir);
    
    // Test getLaporanData
    console.log("Testing getLaporanData...");
    var filter = {
      tanggal: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      shift: "",
      cabang: "",
      kasir: ""
    };
    var laporan = getLaporanData(filter);
    console.log("Data laporan:", laporan);
    
    // Test applyBorderToAllData
    console.log("Testing applyBorderToAllData...");
    var borderResult = applyBorderToAllData();
    console.log("Border result:", borderResult);
    
    return "Test fungsi berhasil";
    
  } catch (error) {
    console.error("Error test fungsi:", error.message);
    return "Error: " + error.message;
  }
}

// Fungsi untuk reset authorization (jika perlu)
function resetAuth() {
  console.log("Reset authorization...");
  // Hapus trigger jika ada
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  console.log("Triggers dihapus");
  return "Authorization reset";
}