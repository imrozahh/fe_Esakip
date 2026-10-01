import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Api";

const DAFTAR_PERIODE = [
  { id: 1, nama: "3 Bulan Pertama", singkatan: "TW I", rentang: "Jan - Mar" },
  { id: 2, nama: "3 Bulan Kedua", singkatan: "TW II", rentang: "Apr - Jun" },
  { id: 3, nama: "3 Bulan Ketiga", singkatan: "TW III", rentang: "Jul - Sep" },
  { id: 4, nama: "3 Bulan Keempat", singkatan: "TW IV", rentang: "Okt - Des" },
];

function formatRupiah(val) {
  if (val === null || val === undefined || isNaN(Number(val))) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val));
}

function round(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export default function RealisasiAnggaran() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [data, setData] = useState({
    unit_kerja: "",
    summary: {
      total_pagu: 0,
      total_realisasi: 0,
      total_sisa: 0,
      persentase_serapan: 0,
    },
    outputs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal State for Realisasi
  const [selectedCell, setSelectedCell] = useState(null);
  const [formRealisasi, setFormRealisasi] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  // Fetch Available Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const resp = await api.get("/pohon-kinerja/years");
        if (resp.data && Array.isArray(resp.data.data)) {
          const years = resp.data.data.map(Number);
          if (years.length > 0) {
            setAvailableYears(years);
            if (!years.includes(Number(tahun))) {
              setTahun(years[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil daftar tahun, memakai default", err);
      }
    };

    fetchYears();
  }, []);

  // Fetch Realisasi Anggaran Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/realisasi-anggaran?tahun=${tahun}`);
      if (resp.data && resp.data.data) {
        setData(resp.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data realisasi anggaran:", err);
      if (err.response) {
        if (err.response.status === 401) {
          setError("Sesi login berakhir atau token belum ada. Silakan Logout lalu Login kembali.");
        } else if (err.response.status === 404) {
          setError("Endpoint API tidak ditemukan (404). Pastikan backend sudah di-pull.");
        } else if (err.response.status === 500) {
          setError("Kesalahan server (500). Pastikan migrasi 'realisasi_anggarans' sudah dijalankan.");
        } else {
          setError(err.response.data?.message || `Gagal memuat data (HTTP ${err.response.status}).`);
        }
      } else {
        setError("Gagal terhubung ke backend. Pastikan server backend ('php artisan serve') sedang berjalan.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun]);

  // Summary Metrics
  const summary = useMemo(() => {
    return (
      data.summary || {
        total_pagu: 0,
        total_realisasi: 0,
        total_sisa: 0,
        persentase_serapan: 0,
      }
    );
  }, [data]);

  // Filtered Outputs
  const filteredOutputs = useMemo(() => {
    if (!search.trim()) return data.outputs || [];
    const query = search.toLowerCase();
    return (data.outputs || []).filter(
      (item) =>
        (item.sub_kegiatan && item.sub_kegiatan.toLowerCase().includes(query)) ||
        (item.kegiatan && item.kegiatan.toLowerCase().includes(query)) ||
        (item.sasaran && item.sasaran.toLowerCase().includes(query)) ||
        (item.bidang && item.bidang.toLowerCase().includes(query))
    );
  }, [data.outputs, search]);

  // Open Modal for Cell
  const handleOpenModal = (output, periodeId) => {
    const list = output.realisasi_triwulan || [];
    const itemData = list.find((c) => c.periode === periodeId) || {
      realisasi: null,
      keterangan: "",
    };

    const periodeInfo =
      DAFTAR_PERIODE.find((p) => p.id === periodeId) || DAFTAR_PERIODE[0];

    setSelectedCell({
      output,
      periodeId,
      periodeInfo,
      itemData,
    });
    setFormRealisasi(itemData.realisasi !== null ? itemData.realisasi : "");
    setFormKeterangan(itemData.keterangan || "");
  };

  const handleCloseModal = () => {
    if (saving) return;
    setSelectedCell(null);
    setFormRealisasi("");
    setFormKeterangan("");
  };

  // Submit Modal
  const handleSaveRealisasi = async (e) => {
    e.preventDefault();
    if (!selectedCell) return;

    if (formRealisasi === "" || isNaN(Number(formRealisasi))) {
      showToast("Harap masukkan nilai realisasi anggaran yang valid.", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/realisasi-anggaran", {
        output_id: selectedCell.output.id,
        periode: selectedCell.periodeId,
        tahun: Number(tahun),
        realisasi: Number(formRealisasi),
        keterangan: formKeterangan.trim() || null,
      });

      showToast(
        `Realisasi anggaran ${selectedCell.periodeInfo.nama} (${selectedCell.periodeInfo.singkatan}) berhasil disimpan!`,
        "success"
      );
      handleCloseModal();
      await fetchData();
    } catch (err) {
      console.error("Gagal menyimpan realisasi anggaran:", err);
      const msg = err.response?.data?.message || "Gagal menyimpan realisasi anggaran.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper styling badge serapan
  const getBadgeStyle = (persen) => {
    if (persen === null || persen === undefined) {
      return "bg-slate-100 text-slate-400 border border-slate-200";
    }
    const val = Number(persen);
    if (val >= 100)
      return "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold";
    if (val >= 75)
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold";
    if (val >= 50)
      return "bg-amber-50 text-amber-700 border border-amber-200 font-semibold";
    return "bg-rose-50 text-rose-700 border border-rose-200 font-semibold";
  };

  const getProgressColor = (persen) => {
    const val = Number(persen);
    if (val >= 75) return "from-emerald-500 to-teal-600";
    if (val >= 50) return "from-amber-400 to-amber-600";
    return "from-rose-500 to-red-600";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform animate-bounce-short ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-700">Dashboard</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span>Capaian Kerja</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-[#001e40]">Realisasi Anggaran</span>
      </nav>

      {/* Tab Navigation (Sub Menu Switcher) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <Link
          to="/capaian-kerja"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#001e40] hover:bg-white/60 transition-all"
        >
          <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
          <span>Capaian Kinerja (Indikator)</span>
        </Link>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#001e40] text-white shadow-sm transition-all">
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          <span>Realisasi Anggaran (Keuangan)</span>
        </div>
      </div>

      {/* Header & Filter Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-3xl">
              account_balance_wallet
            </span>
            <h1 className="text-2xl font-bold text-[#001e40] tracking-tight">
              Realisasi Anggaran
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring serapan anggaran per Sub Kegiatan (Output) setiap 3 bulan (Triwulan I s.d. IV)
          </p>
          {data.unit_kerja && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-blue-50 text-blue-900 text-xs font-semibold rounded-full border border-blue-200">
              <span className="material-symbols-outlined text-[15px]">apartment</span>
              <span>{data.unit_kerja}</span>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari sub kegiatan / kegiatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Tahun Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-slate-500 text-lg">calendar_today</span>
            <span className="text-xs font-semibold text-slate-500 uppercase">Tahun:</span>
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-[#001e40] focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            title="Muat Ulang Data"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stat Cards (Anggaran) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pagu */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pagu Anggaran
            </p>
            <h3 className="text-lg md:text-xl font-bold text-[#001e40] mt-0.5 truncate" title={formatRupiah(summary.total_pagu)}>
              {formatRupiah(summary.total_pagu)}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Realisasi */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Realisasi
            </p>
            <h3 className="text-lg md:text-xl font-bold text-emerald-700 mt-0.5 truncate" title={formatRupiah(summary.total_realisasi)}>
              {formatRupiah(summary.total_realisasi)}
            </h3>
          </div>
        </div>

        {/* Card 3: Sisa Anggaran */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">savings</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sisa Anggaran
            </p>
            <h3 className="text-lg md:text-xl font-bold text-indigo-700 mt-0.5 truncate" title={formatRupiah(summary.total_sisa)}>
              {formatRupiah(summary.total_sisa)}
            </h3>
          </div>
        </div>

        {/* Card 4: % Serapan Anggaran */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">pie_chart</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Serapan Anggaran
            </p>
            <h3 className="text-2xl font-bold text-amber-700 mt-0.5">
              {summary.persentase_serapan}%
            </h3>
          </div>
        </div>
      </div>

      {/* Kategori Serapan & Legenda Status */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">insights</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs">
              Kategori Serapan Anggaran (Per 3 Bulan)
            </h4>
            <p className="text-[11px] text-slate-500">
              Tingkat serapan belanja anggaran triwulan terhadap pagu anggaran tahun {tahun}
            </p>
          </div>
        </div>

        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>≥ 75% : Sangat Baik</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>50% - 74% : Sedang</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>&lt; 50% : Rendah</span>
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <span className="inline-block w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-sm text-slate-500 font-medium">
              Memuat data realisasi anggaran tahun {tahun}...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-rose-500 text-4xl">error</span>
            <p className="text-sm text-slate-700 font-semibold">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredOutputs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-400 text-4xl">inbox</span>
            <p className="text-sm text-slate-500">
              {search
                ? `Tidak ada data yang cocok dengan pencarian "${search}".`
                : `Belum ada data pohon kinerja pada tahun ${tahun}. Silakan upload Excel terlebih dahulu di menu Pohon Kinerja.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#001e40] text-white">
                  <th className="py-3.5 px-3 font-semibold text-center w-10 border-r border-[#002f66]">
                    No
                  </th>
                  <th className="py-3.5 px-4 font-semibold min-w-[280px] border-r border-[#002f66]">
                    Sub Kegiatan (Output)
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right min-w-[170px] border-r border-[#002f66] bg-[#002952]">
                    Pagu Anggaran (Rp)
                  </th>

                  {/* 4 Kolom Periode Triwulan */}
                  {DAFTAR_PERIODE.map((p) => (
                    <th
                      key={p.id}
                      className="py-3.5 px-3 font-semibold text-center min-w-[150px] border-r border-[#002f66]"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold">{p.nama}</span>
                        <span className="text-[10px] text-blue-200 font-medium">
                          {p.singkatan} ({p.rentang})
                        </span>
                      </div>
                    </th>
                  ))}

                  <th className="py-3.5 px-4 font-semibold text-right min-w-[160px] border-r border-[#002f66] bg-[#002952]">
                    Total Realisasi (Rp)
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right min-w-[150px] border-r border-[#002f66] bg-[#002952]">
                    Sisa Anggaran (Rp)
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center min-w-[110px] bg-[#002952]">
                    % Serapan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOutputs.map((item, index) => {
                  const paguNum = Number(item.pagu) || 0;
                  const totalRealNum = Number(item.total_realisasi) || 0;
                  const sisaNum = Number(item.sisa_anggaran) || 0;
                  const serapanPersen = Number(item.persentase_serapan) || 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                        {index + 1}
                      </td>

                      {/* Sub Kegiatan */}
                      <td className="py-3.5 px-4 border-r border-slate-100 leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-blue-900 text-base shrink-0 mt-0.5">
                            folder_open
                          </span>
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-900 block">
                              {item.sub_kegiatan || "-"}
                            </span>
                            {item.kegiatan && (
                              <span className="text-[10px] text-slate-500 block">
                                <span className="font-semibold text-slate-400">Kegiatan:</span> {item.kegiatan}
                              </span>
                            )}
                            {item.bidang && item.bidang !== "-" && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                                {item.bidang}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Pagu Anggaran (read-only) */}
                      <td className="py-3.5 px-4 text-right font-bold text-[#001e40] border-r border-slate-100 bg-slate-50/50">
                        {formatRupiah(paguNum)}
                      </td>

                      {/* 4 Kolom Realisasi Triwulan */}
                      {DAFTAR_PERIODE.map((p) => {
                        const list = item.realisasi_triwulan || [];
                        const cellData = list.find((c) => c.periode === p.id);
                        const hasValue = cellData && cellData.realisasi !== null;
                        const realisasiVal = hasValue ? Number(cellData.realisasi) : null;

                        return (
                          <td
                            key={p.id}
                            onClick={() => handleOpenModal(item, p.id)}
                            className="py-3 px-3 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors relative group/cell"
                            title={`Klik untuk input/edit realisasi ${p.nama} (${p.singkatan})`}
                          >
                            {hasValue ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-semibold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-slate-100 group-hover/cell:bg-blue-100 group-hover/cell:text-blue-950 transition-colors">
                                  {formatRupiah(realisasiVal)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-8 text-slate-300 group-hover/cell:text-blue-900">
                                <span className="group-hover/cell:hidden text-sm">-</span>
                                <span className="hidden group-hover/cell:inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 shadow-xs">
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                  Isi
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Realisasi */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-800 border-r border-slate-100 bg-emerald-50/20">
                        {formatRupiah(totalRealNum)}
                      </td>

                      {/* Sisa Anggaran */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-700 border-r border-slate-100 bg-slate-50/50">
                        {formatRupiah(sisaNum)}
                      </td>

                      {/* % Serapan */}
                      <td className="py-3.5 px-3 text-center bg-slate-50/70">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs ${getBadgeStyle(
                            serapanPersen
                          )}`}
                        >
                          {serapanPersen}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visualisasi Serapan Anggaran per Sub Kegiatan */}
      {!loading && filteredOutputs.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#001e40]">
                Progres Serapan Anggaran per Sub Kegiatan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan akumulasi serapan belanja triwulan terhadap pagu anggaran tahun {tahun}
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-400">bar_chart</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredOutputs.map((item, index) => {
              const pagu = Number(item.pagu) || 0;
              const totalReal = Number(item.total_realisasi) || 0;
              const sisa = Number(item.sisa_anggaran) || 0;
              const persen = Number(item.persentase_serapan) || 0;
              const displayWidth = Math.min(persen, 100);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Sub Kegiatan #{index + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-1">
                        {item.sub_kegiatan || "-"}
                      </h4>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${getBadgeStyle(
                        persen
                      )}`}
                    >
                      {persen}%
                    </span>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="space-y-1">
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                          persen
                        )} transition-all duration-500`}
                        style={{ width: `${displayWidth}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1">
                      <span>Realisasi: <strong>{formatRupiah(totalReal)}</strong></span>
                      <span>Pagu: <strong>{formatRupiah(pagu)}</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      Sisa: {formatRupiah(sisa)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Input Realisasi Anggaran */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-[#001e40] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">payments</span>
                <h3 className="font-bold text-base">Input Realisasi Anggaran</h3>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRealisasi}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Info Card Sub Kegiatan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Sub Kegiatan
                    </span>
                    <p className="text-xs font-bold text-[#001e40] mt-0.5">
                      {selectedCell.output.sub_kegiatan}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Kegiatan
                      </span>
                      <p className="text-xs text-slate-700">
                        {selectedCell.output.kegiatan || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Pagu Anggaran
                      </span>
                      <p className="text-xs font-bold text-blue-950">
                        {formatRupiah(selectedCell.output.pagu)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200/80 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">
                      calendar_month
                    </span>
                    <span className="text-xs font-bold text-blue-900">
                      Periode: {selectedCell.periodeInfo.nama} ({selectedCell.periodeInfo.singkatan} - {selectedCell.periodeInfo.rentang}) Tahun {tahun}
                    </span>
                  </div>
                </div>

                {/* Input Realisasi */}
                <div>
                  <label
                    htmlFor="realisasiInput"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nilai Realisasi Anggaran Periode Ini (Rp) *
                  </label>
                  <div className="relative">
                    <input
                      id="realisasiInput"
                      type="number"
                      step="any"
                      min="0"
                      value={formRealisasi}
                      onChange={(e) => setFormRealisasi(e.target.value)}
                      placeholder="Masukkan nilai realisasi (contoh: 125000000)"
                      autoFocus
                      required
                      className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                    />
                  </div>
                  {formRealisasi !== "" && !isNaN(Number(formRealisasi)) && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Terbilang: <strong>{formatRupiah(formRealisasi)}</strong>
                    </p>
                  )}
                </div>

                {/* Preview Persentase Serapan Realtime */}
                {formRealisasi !== "" &&
                  !isNaN(Number(formRealisasi)) &&
                  Number(selectedCell.output.pagu) > 0 && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">
                        Proyeksi Serapan Periode Ini:
                      </span>
                      {(() => {
                        const pagu = Number(selectedCell.output.pagu) || 0;
                        const real = Number(formRealisasi) || 0;
                        const persen = pagu > 0 ? round((real / pagu) * 100, 2) : 0;
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(
                              persen
                            )}`}
                          >
                            {persen}%
                          </span>
                        );
                      })()}
                    </div>
                  )}

                {/* Input Keterangan */}
                <div>
                  <label
                    htmlFor="keteranganInput"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Keterangan / Catatan Belanja (Opsional)
                  </label>
                  <textarea
                    id="keteranganInput"
                    rows="3"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Contoh: Realisasi belanja operasional dan pemeliharaan triwulan ini..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#001e40] hover:bg-[#002f66] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>Simpan Realisasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
