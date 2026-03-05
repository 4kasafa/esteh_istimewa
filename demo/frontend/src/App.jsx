import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SHIFT_OPTIONS = ['PAGI', 'SIANG', 'SORE', 'MALAM']
const CABANG_OPTIONS = [
  'SDF',
  'SELUMIT',
  'KAMPUNG BUGIS',
  'KAMPUNG SATU',
  'SEBENGKOK',
  'JUWATA',
  'Setoran Bank BRI',
  'Test Input'
]
const KASIR_OPTIONS = [
  'Abu Arfan',
  'Farel',
  'Arief Rahman',
  'Imam Solihin',
  'Arya Ahman',
  'Ardi',
  'Irfan',
  'Imam Hardani',
  'Aliansyah',
  'Syamsudin',
  'Abdul salam'
]
const DENOM_FIELDS = [
  'Rp 100.000',
  'Rp 75.000',
  'Rp 50.000',
  'Rp 20.000',
  'Rp 10.000',
  'Rp 5.000',
  'Rp 2.000',
  'Rp 1.000',
  'Rp 500',
  'Rp 200',
  'Rp 100',
]
const DENOM_VALUES = {
  'Rp 100.000': 100000,
  'Rp 75.000': 75000,
  'Rp 50.000': 50000,
  'Rp 20.000': 20000,
  'Rp 10.000': 10000,
  'Rp 5.000': 5000,
  'Rp 2.000': 2000,
  'Rp 1.000': 1000,
  'Rp 500': 500,
  'Rp 200': 200,
  'Rp 100': 100,
}
const ALL_FIELDS = [
  'NO TRANSAKSI',
  'SHIFT',
  'ARUS DANA',
  'KASIR',
  'STOK AWAL GELAS',
  'GELAS MASUK',
  'GELAS LAKU',
  'GELAS RUSAK',
  'STOK AKHIR GELAS',
  ...DENOM_FIELDS,
  'TOTAL NOTA',
  'PENGELUARAN',
  'UNAG MASUK',
  'ES BATU DEPO',
  'ES BATU BELI',
  'TEH',
  'GULA',
]

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const normalized = String(value).replace(/\./g, '').replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatRupiahNumber(num) {
  return Math.round(num).toLocaleString('id-ID')
}

function toDisplayNumber(value) {
  return formatRupiahNumber(toNumber(value))
}

function currentTimestampLabel() {
  const now = new Date()
  const weekdays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  const two = (n) => String(n).padStart(2, '0')
  return `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${two(now.getHours())}.${two(now.getMinutes())}.${two(now.getSeconds())}`
}

function parseTransaksiDate(value) {
  if (!value) return 0
  const match = String(value).match(/^\w+,\s(\d{1,2})\s(\w+)\s(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/)
  if (!match) return 0
  const months = {
    Januari: 0,
    Februari: 1,
    Maret: 2,
    April: 3,
    Mei: 4,
    Juni: 5,
    Juli: 6,
    Agustus: 7,
    September: 8,
    Oktober: 9,
    November: 10,
    Desember: 11,
  }
  const monthIndex = months[match[2]]
  if (monthIndex === undefined) return 0
  const date = new Date(
    Number(match[3]),
    monthIndex,
    Number(match[1]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  )
  return date.getTime()
}

function createInitialForm() {
  const base = {
    'NO TRANSAKSI': currentTimestampLabel(),
    SHIFT: 'PAGI',
    'ARUS DANA': CABANG_OPTIONS[0],
    KASIR: KASIR_OPTIONS[0],
    'STOK AWAL GELAS': '0',
    'GELAS MASUK': '0',
    'GELAS LAKU': '0',
    'GELAS RUSAK': '0',
    'STOK AKHIR GELAS': '0',
    'TOTAL NOTA': '0',
    PENGELUARAN: '0',
    'UNAG MASUK': '0',
    'ES BATU DEPO': '0',
    'ES BATU BELI': '0',
    TEH: '0',
    GULA: '0',
  }

  DENOM_FIELDS.forEach((key) => {
    base[key] = '0'
  })

  return base
}

function applyCalculatedFields(draft) {
  const next = { ...draft }
  const stokA = toNumber(next['STOK AWAL GELAS'])
  const masuk = toNumber(next['GELAS MASUK'])
  const laku = toNumber(next['GELAS LAKU'])
  const rusak = toNumber(next['GELAS RUSAK'])
  next['STOK AKHIR GELAS'] = toDisplayNumber(stokA + masuk - laku - rusak)
  next['TOTAL NOTA'] = toDisplayNumber(laku * 3000)

  const uangMasuk = DENOM_FIELDS.reduce((sum, field) => {
    return sum + toNumber(next[field]) * DENOM_VALUES[field]
  }, 0)
  next['UNAG MASUK'] = toDisplayNumber(uangMasuk)
  return next
}

function normalizeDataRow(row) {
  const out = {}
  ALL_FIELDS.forEach((field) => {
    out[field] = row?.[field] ?? ''
  })
  out.__sortTs = parseTransaksiDate(out['NO TRANSAKSI'])
  return out
}

function App() {
  const apiUrl =
    import.meta.env.VITE_APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbxMwr7ZRVdzLErfEIyx8GtUjcqKrHeW3vC8h0lD8senhRnZPJOlk9SM3XrWmlca2lE3ng/exec'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filterShift, setFilterShift] = useState('')
  const [filterCabang, setFilterCabang] = useState('')
  const [visibleCount, setVisibleCount] = useState(80)
  const [form, setForm] = useState(() => applyCalculatedFields(createInitialForm()))
  const [editId, setEditId] = useState('')

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (b.__sortTs || 0) - (a.__sortTs || 0))
  }, [rows])

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sortedRows.filter((row) => {
      if (filterShift && row.SHIFT !== filterShift) return false
      if (filterCabang && row['ARUS DANA'] !== filterCabang) return false
      if (!keyword) return true
      const haystack = Object.values(row).join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [sortedRows, search, filterShift, filterCabang])

  const visibleRows = useMemo(() => {
    return filteredRows.slice(0, visibleCount)
  }, [filteredRows, visibleCount])

  useEffect(() => {
    if (activeTab !== 'input') return undefined
    const autoRefreshId = setInterval(() => {
      setForm((prev) => ({
        ...prev,
        'NO TRANSAKSI': currentTimestampLabel(),
      }))
    }, 1000)
    return () => clearInterval(autoRefreshId)
  }, [activeTab])

  async function callApi(payload, method = 'POST') {
    if (!apiUrl) throw new Error('Isi API URL dulu.')
    const url = method === 'GET' ? `${apiUrl}?action=read` : apiUrl
    const options =
      method === 'GET'
        ? { method: 'GET' }
        : {
            method: 'POST',
            // Use text/plain to avoid CORS preflight on Apps Script Web App.
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          }
    const response = await fetch(url, options)
    const data = await response.json()
    if (!data.success) throw new Error(data.message || 'Request gagal')
    return data
  }

  async function loadRows() {
    try {
      setLoading(true)
      setMessage('')
      const result = await callApi(null, 'GET')
      const list = Array.isArray(result.data) ? result.data : []
      setRows(list.map((row) => normalizeDataRow(row)))
      setVisibleCount(80)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (apiUrl) loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setForm((prev) => {
      const next = {
        ...prev,
        'STOK AWAL GELAS': getLatestStokAkhirByCabang(prev['ARUS DANA']),
      }
      return applyCalculatedFields(next)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  function getLatestStokAkhirByCabang(cabang) {
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (rows[i]['ARUS DANA'] === cabang) {
        return toDisplayNumber(rows[i]['STOK AKHIR GELAS'])
      }
    }
    return '0'
  }

  function updateInputField(field, value) {
    setForm((prev) => {
      let next = { ...prev, [field]: value }
      if (field === 'ARUS DANA') {
        next['STOK AWAL GELAS'] = getLatestStokAkhirByCabang(value)
      }
      next = applyCalculatedFields(next)
      return next
    })
  }

  function openEdit(row) {
    const normalized = applyCalculatedFields(normalizeDataRow(row))
    setEditId(row['NO TRANSAKSI'] || '')
    setForm(normalized)
    setActiveTab('input')
  }

  function startNewInput() {
    setEditId('')
    setForm(applyCalculatedFields(createInitialForm()))
    setActiveTab('input')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setMessage('')
      const action = editId ? 'update' : 'create'
      const payload = { 
        action: action, 
        data: form 
      }
      if (editId) {
        payload.id = editId
      }
      await callApi(payload)
      setMessage(`Data berhasil ${editId ? 'diupdate' : 'ditambahkan'}.`)
      if (!editId) {
        setForm((prev) => {
          const reset = createInitialForm()
          reset['ARUS DANA'] = prev['ARUS DANA']
          reset['STOK AWAL GELAS'] = getLatestStokAkhirByCabang(prev['ARUS DANA'])
          return applyCalculatedFields(reset)
        })
      }
      await loadRows()
      setActiveTab('dashboard')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Demo Aplikasi Laporan Es Teh Lay</h1>
        <p>Tes demo aplikasi</p>
      </header>

      <section className="panel panel-actions">
        <button 
          type="button" 
          onClick={loadRows} 
          disabled={loading || !apiUrl}
          style={{ background: '#334155' }}
        >
          {loading ? '⏳ Sedang Memuat...' : '🔄 Segarkan Data'}
        </button>
        <button 
          type="button" 
          onClick={startNewInput} 
        >
          ➕ Input Data Baru
        </button>
      </section>

      {message && <div className="notice">{message}</div>}

      {activeTab === 'dashboard' && (
        <section className="panel">
          <div className="filters">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari data..."
            />
            <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
              <option value="">Semua Shift</option>
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)}>
              <option value="">Semua Cabang</option>
              {CABANG_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <p className="meta">Total tampil: {filteredRows.length}</p>

          <div className="list">
            {visibleRows.map((row) => (
              <article className="card" key={`${row['NO TRANSAKSI']}-${row['ARUS DANA']}`}>
                <div className="card-head">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{row['ARUS DANA']}</strong>
                    <small style={{ color: '#64748b', fontSize: '0.7rem' }}>{row['NO TRANSAKSI']}</small>
                  </div>
                  <button type="button" onClick={() => openEdit(row)}>
                    Edit
                  </button>
                </div>
                <div className="grid">
                  <p>
                    <span>Shift / Kasir</span>
                    {row.SHIFT} - {row.KASIR}
                  </p>
                  <p>
                    <span>Stok Akhir Gelas</span>
                    {row['STOK AKHIR GELAS']}
                  </p>
                  <p>
                    <span>Total Penjualan</span>
                    Rp {row['TOTAL NOTA']}
                  </p>
                  <p>
                    <span>Total Uang Masuk</span>
                    Rp {row['UNAG MASUK']}
                  </p>
                </div>
              </article>
            ))}
            {!filteredRows.length && <div className="empty">Tidak ada data ditemukan.</div>}
          </div>
          {filteredRows.length > visibleRows.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 80)}
              className="load-more"
            >
              Tampilkan lebih banyak
            </button>
          )}
        </section>
      )}

      {activeTab === 'input' && (
        <section className="panel">
          <button 
            type="button" 
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              background: 'transparent', 
              color: '#64748b', 
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              width: 'auto',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            ⬅️ Kembali ke Dashboard
          </button>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="section-title">
                {editId ? '📝 EDIT DATA LAPORAN' : '📦 INPUT DATA BARU'}
              </h3>
              <div className="form-grid">
                <label>
                  NO TRANSAKSI
                  <input value={form['NO TRANSAKSI']} readOnly style={{ background: '#f1f5f9' }} />
                </label>
                <label>
                  SHIFT
                  <select value={form.SHIFT} onChange={(e) => updateInputField('SHIFT', e.target.value)}>
                    {SHIFT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  ARUS DANA / CABANG
                  <select
                    value={form['ARUS DANA']}
                    onChange={(e) => updateInputField('ARUS DANA', e.target.value)}
                  >
                    {CABANG_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  KASIR
                  <select value={form.KASIR} onChange={(e) => updateInputField('KASIR', e.target.value)}>
                    {KASIR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">📊 LAPORAN GELAS</h3>
              <div className="form-grid">
                {['GELAS MASUK', 'GELAS LAKU', 'GELAS RUSAK'].map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      type="number"
                      value={form[field]}
                      onChange={(e) => updateInputField(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">📝 CATATAN & LAINNYA</h3>
              <div className="form-grid">
                {['PENGELUARAN', 'ES BATU DEPO', 'ES BATU BELI', 'TEH', 'GULA'].map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      value={form[field]}
                      onChange={(e) => updateInputField(field, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">💸 RINCIAN UANG (DENOMINASI)</h3>
              <div className="denom-container">
                {DENOM_FIELDS.map((field) => {
                  const nominalValue = DENOM_VALUES[field];
                  const count = toNumber(form[field]);
                  const subTotal = count * nominalValue;
                  return (
                    <div className="denom-row" key={field}>
                      <span className="denom-label">{field.replace('Rp ', '')}</span>
                      <input
                        type="number"
                        placeholder="Jumlah lembar"
                        value={form[field]}
                        onChange={(e) => updateInputField(field, e.target.value)}
                        style={{ background: 'white', minHeight: '36px' }}
                      />
                      <span className="denom-total">Rp {formatRupiahNumber(subTotal)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="summary-card" style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
              <div className="summary-item">
                <span>Total Uang Masuk</span>
                <strong style={{ fontSize: '1.5rem' }}>Rp {form['UNAG MASUK']}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !apiUrl}
              style={{ width: '100%', marginTop: '24px', padding: '16px', fontSize: '1rem' }}
            >
              {saving ? '⏳ Sedang Menyimpan...' : (editId ? '✅ Update Laporan' : '✅ Simpan Laporan')}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}

export default App
