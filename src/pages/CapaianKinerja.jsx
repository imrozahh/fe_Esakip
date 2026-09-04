import { useEffect, useMemo, useState } from "react";
import api from "../Api";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const NAMA_BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

export default function CapaianKinerja() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [data, setData] = useState({ unit_kerja: "", intermediates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal State
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

  // Fetch Capaian Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get(`/capaian?tahun=${tahun}`);
      if (resp.data && resp.data.data) {
        setData(resp.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data capaian:", err);
      setError("Gagal memuat data capaian kinerja. Pastikan server backend aktif.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahun]);

  // Summary Calculations
  const summary = useMemo(() => {
    const items = data.intermediates || [];
    if (items.length === 0) {
      return { total: 0, avg: 0, highest: 0, lowest: 0 };
    }

    const percentages = items
      .map((item) => Number(item.rata_rata_persentase) || 0)
      .filter((p) => p > 0);

    const avg =
      percentages.length > 0
        ? round(percentages.reduce((a, b) => a + b, 0) / percentages.length, 2)
        : 0;

    const highest = percentages.length > 0 ? Math.max(...percentages) : 0;
    const lowest = percentages.length > 0 ? Math.min(...percentages) : 0;

    return {
      total: items.length,
      avg,
      highest,
      lowest,
    };
  }, [data]);

  // Filtered Intermediates
  const filteredIntermediates = useMemo(() => {
    if (!search.trim()) return data.intermediates || [];
    const query = search.toLowerCase();
    return (data.intermediates || []).filter(
      (item) =>
        (item.sasaran && item.sasaran.toLowerCase().includes(query)) ||
        (item.indikator && item.indikator.toLowerCase().includes(query))
    );
  }, [data.intermediates, search]);

  // Open Modal for Cell
  const handleOpenModal = (intermediate, bulan) => {
    const capaian = (intermediate.capaian_bulanan || []).find(
      (c) => c.bulan === bulan
    ) || { realisasi: null, keterangan: "" };

    setSelectedCell({
      intermediate,
      bulan,
      bulanNama: NAMA_BULAN[bulan - 1],
      capaian,
    });
    setFormRealisasi(capaian.realisasi !== null ? capaian.realisasi : "");
    setFormKeterangan(capaian.keterangan || "");
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
      showToast("Harap masukkan angka realisasi yang valid.", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/capaian", {
        intermediate_id: selectedCell.intermediate.id,
        bulan: selectedCell.bulan,
        tahun: Number(tahun),
        realisasi: Number(formRealisasi),
        keterangan: formKeterangan.trim() || null,
      });

      showToast(
        `Capaian bulan ${selectedCell.bulanNama} berhasil disimpan!`,
        "success"
      );
      handleCloseModal();
      await fetchData();
    } catch (err) {
      console.error("Gagal menyimpan capaian:", err);
      const msg = err.response?.data?.message || "Gagal menyimpan capaian kinerja.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper untuk warna badge persentase
  const getBadgeStyle = (persen) => {
    if (persen === null || persen === undefined) {
      return "bg-slate-100 text-slate-400 border border-slate-200";
    }
    const val = Number(persen);
    if (val >= 100) return "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold";
    if (val >= 75) return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold";
    if (val >= 50) return "bg-amber-50 text-amber-700 border border-amber-200 font-semibold";
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
        <span className="hover:text-slate-700 cursor-pointer">Dashboard</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-[#001e40]">Capaian Kerja</span>
      </nav>

      {/* Header & Filter Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-3xl">
              assignment_turned_in
            </span>
            <h1 className="text-2xl font-bold text-[#001e40] tracking-tight">
              Capaian Kinerja (Monitoring Progres Bulanan)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pantau target dan realisasi bulanan untuk setiap sasaran strategis (Intermediate Outcome)
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
              placeholder="Cari sasaran/indikator..."
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sasaran */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">alt_route</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sasaran
            </p>
            <h3 className="text-2xl font-bold text-[#001e40] mt-0.5">
              {summary.total} <span className="text-xs font-normal text-slate-400">Node</span>
            </h3>
          </div>
        </div>

        {/* Card 2: Rata-rata Capaian */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">trending_up</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata Capaian
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
              {summary.avg}%
            </h3>
          </div>
        </div>

        {/* Card 3: Capaian Tertinggi */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capaian Tertinggi
            </p>
            <h3 className="text-2xl font-bold text-indigo-700 mt-0.5">
              {summary.highest}%
            </h3>
          </div>
        </div>

        {/* Card 4: Capaian Terendah */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capaian Terendah
            </p>
            <h3 className="text-2xl font-bold text-amber-700 mt-0.5">
              {summary.lowest}%
            </h3>
          </div>
        </div>
      </div>

      {/* Kategori Ketercapaian Kinerja & Status */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">insights</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs">
              Kategori Ketercapaian Kinerja
            </h4>
            <p className="text-[11px] text-slate-500">
              Klasifikasi persentase total akumulasi realisasi bulanan terhadap target indikator tahun {tahun}
            </p>
          </div>
        </div>

        {/* Status Legend Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>≥ 75% : Tercapai</span>
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
            <p className="text-sm text-slate-500 font-medium">Memuat data capaian kinerja tahun {tahun}...</p>
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
        ) : filteredIntermediates.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-400 text-4xl">inbox</span>
            <p className="text-sm text-slate-500">
              {search
                ? `Tidak ada data yang cocok dengan pencarian "${search}".`
                : `Belum ada data pohon kinerja pada tahun ${tahun}. Silakan upload file Excel terlebih dahulu di menu Pohon Kinerja.`}
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
                  <th className="py-3.5 px-4 font-semibold min-w-[240px] border-r border-[#002f66]">
                    Sasaran Strategis (Intermediate)
                  </th>
                  <th className="py-3.5 px-4 font-semibold min-w-[220px] border-r border-[#002f66]">
                    Indikator Kinerja
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center min-w-[90px] border-r border-[#002f66]">
                    Target
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center min-w-[80px] border-r border-[#002f66]">
                    Satuan
                  </th>

                  {/* Kolom 12 Bulan */}
                  {NAMA_BULAN_PENDEK.map((bln) => (
                    <th
                      key={bln}
                      className="py-3 px-2 font-semibold text-center min-w-[70px] border-r border-[#002f66]"
                    >
                      {bln}
                    </th>
                  ))}

                  <th className="py-3.5 px-3 font-semibold text-center min-w-[90px] border-r border-[#002f66] bg-[#002952]">
                    Total Realisasi
                  </th>
                  <th className="py-3.5 px-3 font-semibold text-center min-w-[100px] bg-[#002952]">
                    % Capaian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIntermediates.map((item, index) => {
                  const targetNum = Number(item.target) || 0;
                  const rataPersen = Number(item.rata_rata_persentase) || 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                        {index + 1}
                      </td>

                      {/* Sasaran */}
                      <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-100 leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-blue-900 text-base shrink-0 mt-0.5">
                            alt_route
                          </span>
                          <span>{item.sasaran || item.title || "-"}</span>
                        </div>
                      </td>

                      {/* Indikator */}
                      <td className="py-3 px-4 text-slate-600 border-r border-slate-100 leading-relaxed">
                        {item.indikator || "-"}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-3 text-center font-bold text-[#001e40] border-r border-slate-100">
                        {targetNum > 0 ? targetNum : item.target_satuan_raw || "-"}
                      </td>

                      {/* Satuan */}
                      <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-100">
                        {item.satuan || "-"}
                      </td>

                      {/* 12 Bulan Realisasi */}
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((bln) => {
                        const cellData = (item.capaian_bulanan || []).find(
                          (c) => c.bulan === bln
                        );
                        const hasValue = cellData && cellData.realisasi !== null;
                        const realisasiVal = hasValue ? Number(cellData.realisasi) : null;

                        return (
                          <td
                            key={bln}
                            onClick={() => handleOpenModal(item, bln)}
                            className="py-2.5 px-2 text-center border-r border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors relative group/cell"
                            title={`Klik untuk edit realisasi bulan ${NAMA_BULAN[bln - 1]}`}
                          >
                            {hasValue ? (
                              <div className="flex items-center justify-center h-7">
                                <span className="font-semibold text-slate-800 text-xs px-2.5 py-1 rounded-md bg-slate-100/90 group-hover/cell:bg-blue-100 group-hover/cell:text-blue-900 transition-colors inline-block min-w-[32px]">
                                  {realisasiVal}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-7 text-slate-300 group-hover/cell:text-blue-900">
                                <span className="group-hover/cell:hidden">-</span>
                                <span className="hidden group-hover/cell:inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  + Isi
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Realisasi */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 border-r border-slate-100 bg-slate-50/70">
                        {item.total_realisasi || 0}
                      </td>

                      {/* Persentase Rata-rata */}
                      <td className="py-3 px-3 text-center bg-slate-50/70">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs ${getBadgeStyle(
                            rataPersen
                          )}`}
                        >
                          {rataPersen}%
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

      {/* Visualisasi Progress Bar per Sasaran */}
      {!loading && filteredIntermediates.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#001e40]">
                Ringkasan Capaian Tahunan per Sasaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan total realisasi bulanan terhadap target indikator tahun {tahun}
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-400">bar_chart</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredIntermediates.map((item, index) => {
              const target = Number(item.target) || 0;
              const total = Number(item.total_realisasi) || 0;
              const persen = Number(item.rata_rata_persentase) || 0;
              const displayWidth = Math.min(persen, 100);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Sasaran #{index + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mt-1">
                        {item.sasaran}
                      </h4>
                      <p className="text-[11px] text-slate-500 italic">
                        Indikator: {item.indikator}
                      </p>
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
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>
                        Realisasi: <strong>{total}</strong> {item.satuan}
                      </span>
                      <span>
                        Target: <strong>{target}</strong> {item.satuan}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Input Realisasi */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-[#001e40] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">edit_note</span>
                <h3 className="font-bold text-base">
                  Input Realisasi Capaian
                </h3>
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
                {/* Info Card Sasaran */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Sasaran Strategis
                    </span>
                    <p className="text-xs font-bold text-[#001e40] mt-0.5">
                      {selectedCell.intermediate.sasaran}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Indikator
                      </span>
                      <p className="text-xs text-slate-700">
                        {selectedCell.intermediate.indikator}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Target & Satuan
                      </span>
                      <p className="text-xs font-bold text-blue-950">
                        {selectedCell.intermediate.target}{" "}
                        {selectedCell.intermediate.satuan}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-200/80 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">
                      calendar_month
                    </span>
                    <span className="text-xs font-bold text-blue-900">
                      Bulan: {selectedCell.bulanNama} {tahun}
                    </span>
                  </div>
                </div>

                {/* Input Realisasi */}
                <div>
                  <label
                    htmlFor="realisasiInput"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Nilai Realisasi Aktual *
                  </label>
                  <div className="relative">
                    <input
                      id="realisasiInput"
                      type="number"
                      step="any"
                      min="0"
                      value={formRealisasi}
                      onChange={(e) => setFormRealisasi(e.target.value)}
                      placeholder={`Contoh: ${selectedCell.intermediate.target || "10"}`}
                      autoFocus
                      required
                      className="w-full pl-3 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      {selectedCell.intermediate.satuan || ""}
                    </span>
                  </div>
                </div>

                {/* Preview Persentase Realtime */}
                {formRealisasi !== "" && !isNaN(Number(formRealisasi)) && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Proyeksi Persentase Capaian:
                    </span>
                    {(() => {
                      const target = Number(selectedCell.intermediate.target) || 0;
                      const real = Number(formRealisasi) || 0;
                      const persen = target > 0 ? round((real / target) * 100, 2) : 0;
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
                    Keterangan / Catatan (Opsional)
                  </label>
                  <textarea
                    id="keteranganInput"
                    rows="3"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Contoh: Realisasi kegiatan bulan ini telah memenuhi target triwulan..."
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
                      <span>Simpan Capaian</span>
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

// Simple round helper
function round(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
