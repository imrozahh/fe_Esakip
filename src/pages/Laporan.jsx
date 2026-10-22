import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Api";
import { useAuth } from "../context/AuthContext";
import {
  BIDANG_LABEL,
  DAFTAR_TRIWULAN,
  buildCapaianTahunan,
  buildCapaianTriwulan,
  buildPohonKinerja,
  buildRealisasiTahunan,
  buildRealisasiTriwulan,
  buildRenstra,
  computeSpans,
  exportAllExcel,
  exportReportExcel,
  exportRenstraExcel,
  formatCell,
  hitungStatus,
  printPohonKinerjaTree,
  printReport,
} from "../utils/laporanBuilder";

const KATEGORI = {
  pohon: {
    label: "Pohon Kinerja",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "bg-indigo-50 text-indigo-700",
  },
  renstra: {
    label: "Rencana Strategis",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "bg-sky-50 text-sky-700",
  },
  capaian: {
    label: "Capaian Kinerja",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "bg-emerald-50 text-emerald-700",
  },
  realisasi: {
    label: "Realisasi Anggaran",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "bg-amber-50 text-amber-700",
  },
};

const STATUS_STYLE = {
  green: { badge: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", bar: "bg-green-500" },
  amber: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", bar: "bg-amber-500" },
  slate: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", bar: "bg-slate-400" },
  rose: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", bar: "bg-rose-400" },
};

const titleCase = (s) =>
  String(s || "")
    .toLowerCase()
    .split(" ")
    .map((w) => (["dan", "dari", "di"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export default function Laporan() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [tahun, setTahun] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [kategori, setKategori] = useState("semua");
  const [periode, setPeriode] = useState("semua");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState({
    unitKerja: "",
    ultimates: [],
    capaian: [],
    realisasi: [],
    realisasiSummary: null,
  });

  const [preview, setPreview] = useState(null);

  // Ambil daftar tahun yang tersedia
  useEffect(() => {
    api
      .get("/pohon-kinerja/years")
      .then((resp) => {
        const years = (resp.data?.data || []).map(Number);
        if (years.length > 0) {
          setAvailableYears(years);
          if (!years.includes(Number(tahun))) setTahun(years[0]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambil seluruh data sumber laporan untuk tahun terpilih
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [rRenstra, rCapaian, rRealisasi] = await Promise.allSettled([
      api.get(`/renstra?tahun=${tahun}`),
      api.get(`/capaian?tahun=${tahun}`),
      api.get(`/realisasi-anggaran?tahun=${tahun}`),
    ]);

    // Renstra mengembalikan 404 bila tahun belum punya data — bukan error fatal
    const renstraOk =
      rRenstra.status === "fulfilled" ||
      (rRenstra.status === "rejected" && rRenstra.reason?.response?.status === 404);

    if (!renstraOk || rCapaian.status === "rejected" || rRealisasi.status === "rejected") {
      const anyErr = [rRenstra, rCapaian, rRealisasi].find(
        (r) => r.status === "rejected" && r.reason?.response?.status !== 404,
      );
      const status = anyErr?.reason?.response?.status;
      setError(
        status === 401
          ? "Sesi login berakhir. Silakan logout lalu login kembali."
          : "Gagal memuat data laporan. Pastikan server backend sedang berjalan.",
      );
    }

    const renstraData = rRenstra.status === "fulfilled" ? rRenstra.value.data?.data || [] : [];
    const capaianData = rCapaian.status === "fulfilled" ? rCapaian.value.data?.data || {} : {};
    const realisasiData = rRealisasi.status === "fulfilled" ? rRealisasi.value.data?.data || {} : {};

    setSource({
      unitKerja:
        renstraData[0]?.unitKerja || capaianData.unit_kerja || realisasiData.unit_kerja || "",
      ultimates: renstraData[0]?.ultimates || [],
      capaian: capaianData.intermediates || [],
      realisasi: realisasiData.outputs || [],
      realisasiSummary: realisasiData.summary || null,
    });
    setLoading(false);
  }, [tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Susun daftar laporan dari data asli
  const reports = useMemo(() => {
    const list = [];

    const pohon = buildPohonKinerja(source.ultimates);
    list.push({
      id: "pohon",
      kategori: "pohon",
      nama: "Laporan Pohon Kinerja",
      deskripsi: "Struktur cascading Ultimate, Intermediate, Immediate hingga Output",
      periodeId: 0,
      periodeLabel: "Tahunan",
      icon: "account_tree",
      sheetName: "Pohon Kinerja",
      data: { ...pohon, _ultimates: source.ultimates },
      status: hitungStatus(pohon.filled, pohon.total, "master"),
    });

    const renstra = buildRenstra(source.ultimates);
    list.push({
      id: "renstra",
      kategori: "renstra",
      nama: "Laporan Rencana Strategis (Renstra)",
      deskripsi: "Tujuan, sasaran, program, kegiatan, sub kegiatan beserta anggaran",
      periodeId: 0,
      periodeLabel: "Tahunan",
      icon: "flag",
      sheetName: "Rencana Strategis",
      data: renstra,
      status: hitungStatus(renstra.filled, renstra.total, "master"),
    });

    DAFTAR_TRIWULAN.forEach((tw) => {
      const d = buildCapaianTriwulan(source.capaian, tw.id);
      list.push({
        id: `capaian-${tw.id}`,
        kategori: "capaian",
        nama: `Laporan Capaian Kinerja ${tw.nama}`,
        deskripsi: `Realisasi indikator kinerja periode ${tw.rentang}`,
        periodeId: tw.id,
        periodeLabel: `${tw.nama} (${tw.rentang})`,
        icon: "trending_up",
        sheetName: `Capaian ${tw.singkatan}`,
        data: d,
        status: hitungStatus(d.filled, d.total),
      });
    });

    const capaianTahunan = buildCapaianTahunan(source.capaian);
    list.push({
      id: "capaian-tahunan",
      kategori: "capaian",
      nama: "Laporan Capaian Kinerja Tahunan",
      deskripsi: "Rekap realisasi indikator TW I s.d. TW IV dan persentase capaian",
      periodeId: 0,
      periodeLabel: "Tahunan",
      icon: "insights",
      sheetName: "Capaian Tahunan",
      data: capaianTahunan,
      status: hitungStatus(capaianTahunan.filled, capaianTahunan.total),
    });

    DAFTAR_TRIWULAN.forEach((tw) => {
      const d = buildRealisasiTriwulan(source.realisasi, tw.id);
      list.push({
        id: `realisasi-${tw.id}`,
        kategori: "realisasi",
        nama: `Laporan Realisasi Anggaran ${tw.nama}`,
        deskripsi: `Serapan anggaran per sub kegiatan periode ${tw.rentang}`,
        periodeId: tw.id,
        periodeLabel: `${tw.nama} (${tw.rentang})`,
        icon: "payments",
        sheetName: `Realisasi ${tw.singkatan}`,
        data: d,
        status: hitungStatus(d.filled, d.total),
      });
    });

    const realisasiTahunan = buildRealisasiTahunan(source.realisasi);
    list.push({
      id: "realisasi-tahunan",
      kategori: "realisasi",
      nama: "Laporan Realisasi Anggaran Tahunan",
      deskripsi: "Rekap pagu, realisasi TW I s.d. TW IV, sisa anggaran dan % serapan",
      periodeId: 0,
      periodeLabel: "Tahunan",
      icon: "account_balance_wallet",
      sheetName: "Realisasi Tahunan",
      data: realisasiTahunan,
      status: hitungStatus(realisasiTahunan.filled, realisasiTahunan.total),
    });

    return list;
  }, [source]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (kategori !== "semua" && r.kategori !== kategori) return false;
      if (periode === "tahunan" && r.periodeId !== 0) return false;
      if (!["semua", "tahunan"].includes(periode) && r.periodeId !== Number(periode)) return false;
      if (q && !`${r.nama} ${r.deskripsi} ${r.periodeLabel}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, kategori, periode, search]);

  const meta = useMemo(
    () => ({
      tahun,
      unitKerja: source.unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA",
      unitKerjaTitle: titleCase(source.unitKerja || "Dinas Komunikasi dan Informatika"),
      bidangLabel: user?.role && user.role !== "admin" ? BIDANG_LABEL[user.role] || user.role : null,
      dicetakOleh: user?.name,
      tanggalCetak: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }),
    [tahun, source.unitKerja, user],
  );

  const stats = useMemo(() => {
    const siap = reports.filter((r) => ["Lengkap", "Tersedia"].includes(r.status.label)).length;
    const capaianTahunan = reports.find((r) => r.id === "capaian-tahunan");
    return {
      total: reports.length,
      siap,
      kelengkapanCapaian: capaianTahunan?.status.persen ?? 0,
      serapan: Number(source.realisasiSummary?.persentase_serapan || 0),
    };
  }, [reports, source.realisasiSummary]);

  const hasAnyData = reports.some((r) => r.data.total > 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-[#001e40]">Laporan</span>
      </nav>

      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-3xl">summarize</span>
            <h1 className="text-2xl font-bold text-[#001e40] tracking-tight">Laporan E-SAKIP</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Laporan Pohon Kinerja, Rencana Strategis, Capaian Kinerja dan Realisasi Anggaran yang disusun
            otomatis dari data yang sudah diinput.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {source.unitKerja && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 text-xs font-semibold rounded-full border border-blue-200">
                <span className="material-symbols-outlined text-[15px]">apartment</span>
                {source.unitKerja}
              </span>
            )}
            {meta.bidangLabel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
                <span className="material-symbols-outlined text-[15px]">badge</span>
                Bidang {meta.bidangLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => exportAllExcel(reports, meta)}
            disabled={loading || !hasAnyData}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#001e40] hover:bg-[#002f66] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            title="Unduh seluruh laporan dalam satu file Excel (satu sheet per laporan)"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Unduh Semua (Excel)
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="description" title="Jenis Laporan" value={stats.total} note={`Tahun ${tahun}`} tone="blue" />
        <StatCard
          icon="task_alt"
          title="Laporan Lengkap"
          value={`${stats.siap} / ${stats.total}`}
          note="Data sudah terisi penuh"
          tone="green"
        />
        <StatCard
          icon="fact_check"
          title="Kelengkapan Capaian"
          value={`${stats.kelengkapanCapaian}%`}
          note="Isian realisasi TW I - IV"
          tone="emerald"
        />
        <StatCard
          icon="pie_chart"
          title="Serapan Anggaran"
          value={`${stats.serapan}%`}
          note="Total realisasi terhadap pagu"
          tone="amber"
        />
      </div>

      {/* Filter */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterSelect
            label="Jenis Laporan"
            value={kategori}
            onChange={setKategori}
            options={[
              ["semua", "Semua Jenis"],
              ...Object.entries(KATEGORI).map(([k, v]) => [k, v.label]),
            ]}
          />
          <FilterSelect
            label="Periode"
            value={periode}
            onChange={setPeriode}
            options={[
              ["semua", "Semua Periode"],
              ["tahunan", "Tahunan"],
              ...DAFTAR_TRIWULAN.map((t) => [String(t.id), `${t.nama} (${t.rentang})`]),
            ]}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Pencarian
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama laporan..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel daftar laporan */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-[#001e40]">Daftar Laporan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredReports.length} dari {reports.length} laporan tahun {tahun}
            </p>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <span className="inline-block w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-sm text-slate-500 font-medium">Menyusun laporan tahun {tahun}...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-semibold w-12 text-center">No</th>
                  <th className="px-5 py-3.5 font-semibold min-w-[300px]">Nama Laporan</th>
                  <th className="px-5 py-3.5 font-semibold">Jenis</th>
                  <th className="px-5 py-3.5 font-semibold min-w-[170px]">Periode</th>
                  <th className="px-5 py-3.5 font-semibold min-w-[170px]">Kelengkapan Data</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300">folder_off</span>
                      <p className="mt-3 font-semibold text-slate-600">Tidak ada laporan</p>
                      <p className="text-sm text-slate-400">Coba ubah filter atau kata pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r, idx) => {
                    const kat = KATEGORI[r.kategori];
                    const st = STATUS_STYLE[r.status.tone];
                    const noData = r.data.total === 0;
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-5 py-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kat.icon}`}>
                              <span className="material-symbols-outlined text-[21px]">{r.icon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#0B1C30]">{r.nama}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{r.deskripsi}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${kat.chip}`}>
                            {kat.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs">{r.periodeLabel}</td>
                        <td className="px-5 py-4">
                          {r.kategori === "pohon" || r.kategori === "renstra" ? (
                            <span className="text-xs text-slate-500">
                              {noData ? "-" : `${r.data.rows.length} baris data`}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${r.status.persen}%` }} />
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {r.data.filled} / {r.data.total} isian ({r.status.persen}%)
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {r.status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1">
                            <IconButton icon="visibility" title="Lihat laporan" tone="blue" onClick={() => setPreview(r)} />
                            <IconButton
                              icon="print"
                              title="Cetak / simpan PDF"
                              tone="slate"
                              disabled={noData}
                              onClick={() =>
                                r.kategori === "pohon"
                                  ? printPohonKinerjaTree(r.data._ultimates, meta)
                                  : printReport(r, meta)
                              }
                            />
                            <IconButton
                              icon="table_view"
                              title="Unduh Excel"
                              tone="green"
                              disabled={noData}
                              onClick={() =>
                                r.kategori === "renstra"
                                  ? exportRenstraExcel(r.data.rows, meta.tahun)
                                  : exportReportExcel(r, meta)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && <PreviewModal report={preview} meta={meta} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* =========================================================
   KOMPONEN KECIL
========================================================= */

const TONE = {
  blue: "bg-blue-50 text-blue-900",
  green: "bg-green-50 text-green-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

function StatCard({ icon, title, value, note, tone }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${TONE[tone]}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-[#001e40] mt-0.5">{value}</h3>
        <p className="text-[11px] text-slate-400">{note}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

const BTN_TONE = {
  blue: "text-blue-700 hover:bg-blue-50",
  slate: "text-slate-700 hover:bg-slate-100",
  green: "text-green-700 hover:bg-green-50",
};

function IconButton({ icon, title, tone, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent ${BTN_TONE[tone]}`}
    >
      <span className="material-symbols-outlined text-[19px]">{icon}</span>
    </button>
  );
}

function PreviewModal({ report, meta, onClose }) {
  const { columns, rows, footer } = report.data;
  const spans = useMemo(() => computeSpans(columns, rows), [columns, rows]);
  const firstValueIdx = footer ? columns.findIndex((c) => footer.values[c.key] !== undefined) : -1;
  const noData = report.data.total === 0;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="bg-[#001e40] px-6 py-4 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-xl">{report.icon}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{report.nama}</h3>
              <p className="text-xs text-blue-200">
                Tahun {meta.tahun} &middot; {report.periodeLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                report.kategori === "pohon"
                  ? printPohonKinerjaTree(report.data._ultimates, meta)
                  : printReport(report, meta)
              }
              disabled={noData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-lg text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Cetak / PDF
            </button>
            <button
              onClick={() =>
                report.kategori === "renstra"
                  ? exportRenstraExcel(report.data.rows, meta.tahun)
                  : exportReportExcel(report, meta)
              }
              disabled={noData}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 rounded-lg text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-base">table_view</span>
              Unduh Excel
            </button>
            <button onClick={onClose} className="ml-1 text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Isi laporan */}
        <div className="overflow-auto p-6">
          <div className="text-center border-b-4 border-double border-[#001e40] pb-3 mb-4">
            <p className="font-bold text-[#001e40] tracking-wide">PEMERINTAH KABUPATEN MALANG</p>
            <p className="font-bold text-[#001e40]">{meta.unitKerja.toUpperCase()}</p>
          </div>
          <div className="text-center mb-4">
            <p className="font-bold uppercase text-sm text-[#0B1C30]">{report.nama}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Tahun {meta.tahun} &mdash; Periode: {report.periodeLabel}
              {meta.bidangLabel && <> &mdash; Bidang: {meta.bidangLabel}</>}
            </p>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#001e40] text-white">
                {columns.map((c) => (
                  <th key={c.key} className="border border-[#002f66] px-2.5 py-2 font-semibold text-center align-middle">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="border border-slate-300 py-10 text-center text-slate-500">
                    Belum ada data untuk laporan ini. Silakan upload Pohon Kinerja atau isi data terlebih dahulu.
                  </td>
                </tr>
              ) : (
                rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-blue-50/30">
                    {columns.map((c) => {
                      const span = spans[ri][c.key];
                      if (span === 0) return null;
                      return (
                        <td
                          key={c.key}
                          rowSpan={span > 1 ? span : undefined}
                          className="border border-slate-300 px-2.5 py-2 align-top whitespace-pre-line text-slate-700"
                          style={{ textAlign: c.align || "left" }}
                        >
                          {formatCell(row[c.key], c.type)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            {footer && rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-[#001e40]">
                  <td colSpan={Math.max(1, firstValueIdx)} className="border border-slate-300 px-2.5 py-2 text-center">
                    {footer.label}
                  </td>
                  {columns.slice(Math.max(1, firstValueIdx)).map((c) => (
                    <td key={c.key} className="border border-slate-300 px-2.5 py-2" style={{ textAlign: c.align || "left" }}>
                      {footer.values[c.key] === undefined ? "" : formatCell(footer.values[c.key], c.type)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>

          <p className="text-[11px] text-slate-400 italic mt-4">
            Disusun otomatis dari data E-SAKIP{meta.dicetakOleh ? ` (${meta.dicetakOleh})` : ""} &middot;{" "}
            {meta.tanggalCetak}
          </p>
        </div>
      </div>
    </div>
  );
}