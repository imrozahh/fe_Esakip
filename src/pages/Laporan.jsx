import React, { useState } from "react";

const laporanAwal = [
  {
    id: 1,
    nama: "Laporan Kinerja Instansi Pemerintah",
    tahun: "2026",
    periode: "Tahunan",
    unit: "Dinas Komunikasi dan Informatika",
    status: "Published",
    tanggal: "20 Agustus 2026",
  },
  {
    id: 2,
    nama: "Laporan Capaian Kinerja Triwulan II",
    tahun: "2026",
    periode: "Triwulan II",
    unit: "Dinas Komunikasi dan Informatika",
    status: "Published",
    tanggal: "15 Juli 2026",
  },
  {
    id: 3,
    nama: "Laporan Capaian Kinerja Triwulan I",
    tahun: "2026",
    periode: "Triwulan I",
    unit: "Dinas Komunikasi dan Informatika",
    status: "Draft",
    tanggal: "12 April 2026",
  },
];

export default function Laporan() {
  const [laporan, setLaporan] = useState(laporanAwal);
  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("Semua Tahun");
  const [status, setStatus] = useState("Semua Status");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    tahun: "2026",
    periode: "Tahunan",
    unit: "Dinas Komunikasi dan Informatika",
    status: "Draft",
  });

  const filteredLaporan = laporan.filter((item) => {
    const cocokSearch =
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.periode.toLowerCase().includes(search.toLowerCase());

    const cocokTahun =
      tahun === "Semua Tahun" || item.tahun === tahun;

    const cocokStatus =
      status === "Semua Status" || item.status === status;

    return cocokSearch && cocokTahun && cocokStatus;
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const tambahLaporan = (e) => {
    e.preventDefault();

    const dataBaru = {
      id: Date.now(),
      ...form,
      tanggal: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };

    setLaporan([dataBaru, ...laporan]);
    setShowModal(false);

    setForm({
      nama: "",
      tahun: "2026",
      periode: "Tahunan",
      unit: "Dinas Komunikasi dan Informatika",
      status: "Draft",
    });
  };

  const hapusLaporan = (id) => {
    if (window.confirm("Yakin ingin menghapus laporan ini?")) {
      setLaporan(laporan.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30]">

      {/* BLUE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-blue-500/[0.03] via-transparent to-blue-700/[0.04] z-0" />

      <main className="relative z-10 p-4 md:p-8">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
          <span className="material-symbols-outlined text-[18px]">
            home
          </span>

          <span>/</span>

          <span>Dashboard</span>

          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>

          <span className="font-semibold text-[#001E40]">
            Laporan
          </span>
        </div>

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">

          <div>
            <h1 className="text-3xl font-bold text-[#001E40] mb-2">
              Laporan
            </h1>

            <p className="text-sm md:text-base text-[#64748B]">
              Kelola dan pantau laporan kinerja E-SAKIP
              Dinas Komunikasi dan Informatika.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              className="flex items-center gap-2 px-4 py-2.5
              border border-[#001E40] text-[#001E40]
              rounded-lg bg-white hover:bg-[#EFF6FF]
              transition"
            >
              <span className="material-symbols-outlined text-[19px]">
                download
              </span>
              Download Template
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5
              bg-[#003366] text-white rounded-lg
              hover:bg-[#001E40] transition shadow-sm"
            >
              <span className="material-symbols-outlined text-[19px]">
                add
              </span>
              Tambah Laporan
            </button>

          </div>
        </div>

        {/* STATISTIC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <StatCard
            icon="description"
            title="Total Laporan"
            value={laporan.length}
            iconClass="bg-blue-100 text-blue-700"
          />

          <StatCard
            icon="check_circle"
            title="Published"
            value={laporan.filter(
              (x) => x.status === "Published"
            ).length}
            iconClass="bg-green-100 text-green-700"
          />

          <StatCard
            icon="edit_document"
            title="Draft"
            value={laporan.filter(
              (x) => x.status === "Draft"
            ).length}
            iconClass="bg-yellow-100 text-yellow-700"
          />

          <StatCard
            icon="calendar_month"
            title="Tahun Aktif"
            value="2026"
            iconClass="bg-indigo-100 text-indigo-700"
          />

        </div>

        {/* FILTER */}
        <section
          className="bg-white border border-[#E2E8F0]
          rounded-xl p-5 mb-6 shadow-sm"
        >

          <div className="flex items-center gap-2 mb-5">

            <span className="material-symbols-outlined text-[#003366]">
              filter_alt
            </span>

            <h2 className="font-semibold text-[#0B1C30]">
              Filter Laporan
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* TAHUN */}
            <div>
              <label className="block text-xs font-semibold
                text-[#64748B] mb-2 uppercase tracking-wide">
                Tahun
              </label>

              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1]
                px-3 py-2.5 text-sm bg-white
                focus:border-[#003366]
                focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>Semua Tahun</option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-xs font-semibold
                text-[#64748B] mb-2 uppercase tracking-wide">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-[#CBD5E1]
                px-3 py-2.5 text-sm bg-white
                focus:border-[#003366]
                focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>Semua Status</option>
                <option>Published</option>
                <option>Draft</option>
              </select>
            </div>

            {/* SEARCH */}
            <div>
              <label className="block text-xs font-semibold
                text-[#64748B] mb-2 uppercase tracking-wide">
                Pencarian
              </label>

              <div className="relative">

                <span className="material-symbols-outlined
                  absolute left-3 top-1/2 -translate-y-1/2
                  text-[#64748B] text-[19px]">
                  search
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari laporan..."
                  className="w-full rounded-lg border
                  border-[#CBD5E1] pl-10 pr-3 py-2.5
                  text-sm outline-none
                  focus:border-[#003366]
                  focus:ring-2 focus:ring-blue-100"
                />

              </div>
            </div>

          </div>
        </section>

        {/* TABLE */}
        <section
          className="bg-white border border-[#E2E8F0]
          rounded-xl shadow-sm overflow-hidden"
        >

          <div className="px-5 py-4 border-b border-[#E2E8F0]
            flex flex-col sm:flex-row sm:items-center
            justify-between gap-3">

            <div>
              <h2 className="font-semibold text-lg text-[#0B1C30]">
                Daftar Laporan
              </h2>

              <p className="text-sm text-[#64748B] mt-1">
                Menampilkan {filteredLaporan.length} laporan
              </p>
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-[#F8FAFC] border-b
                border-[#E2E8F0]">

                <tr className="text-left">

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    No
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Nama Laporan
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Tahun
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Periode
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Unit Kerja
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569]">
                    Tanggal
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#475569] text-center">
                    Aksi
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLaporan.length > 0 ? (
                  filteredLaporan.map((item, index) => (

                    <tr
                      key={item.id}
                      className="border-b border-[#E2E8F0]
                      hover:bg-[#F8FAFC] transition"
                    >

                      <td className="px-5 py-4 text-[#64748B]">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-lg
                            bg-blue-50 text-blue-700
                            flex items-center justify-center">

                            <span className="material-symbols-outlined text-[20px]">
                              description
                            </span>

                          </div>

                          <span className="font-semibold text-[#0B1C30]">
                            {item.nama}
                          </span>

                        </div>

                      </td>

                      <td className="px-5 py-4">
                        {item.tahun}
                      </td>

                      <td className="px-5 py-4">
                        {item.periode}
                      </td>

                      <td className="px-5 py-4 max-w-[220px]">
                        <span className="text-[#475569]">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4 text-[#64748B]">
                        {item.tanggal}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-1">

                          <button
                            title="Lihat"
                            className="w-9 h-9 rounded-lg
                            flex items-center justify-center
                            text-blue-700 hover:bg-blue-50"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              visibility
                            </span>
                          </button>

                          <button
                            title="Download"
                            className="w-9 h-9 rounded-lg
                            flex items-center justify-center
                            text-green-700 hover:bg-green-50"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              download
                            </span>
                          </button>

                          <button
                            title="Hapus"
                            onClick={() => hapusLaporan(item.id)}
                            className="w-9 h-9 rounded-lg
                            flex items-center justify-center
                            text-red-600 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              delete
                            </span>
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))
                ) : (

                  <tr>

                    <td
                      colSpan="8"
                      className="px-5 py-14 text-center"
                    >

                      <span className="material-symbols-outlined
                        text-5xl text-[#CBD5E1]">
                        folder_off
                      </span>

                      <p className="mt-3 font-semibold text-[#475569]">
                        Tidak ada laporan
                      </p>

                      <p className="text-sm text-[#94A3B8]">
                        Coba ubah filter atau kata pencarian.
                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

      {/* MODAL TAMBAH */}
      {showModal && (
        <div className="fixed inset-0 z-50
          bg-[#001E40]/50 backdrop-blur-sm
          flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl
            w-full max-w-xl overflow-hidden">

            <div className="px-6 py-4 border-b
              border-[#E2E8F0] flex justify-between items-center">

              <div>
                <h3 className="text-lg font-bold text-[#0B1C30]">
                  Tambah Laporan
                </h3>

                <p className="text-sm text-[#64748B]">
                  Masukkan informasi laporan baru.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-lg
                hover:bg-red-50 text-[#64748B]
                hover:text-red-600"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>

            </div>

            <form
              onSubmit={tambahLaporan}
              className="p-6 space-y-4"
            >

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nama Laporan
                </label>

                <input
                  required
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama laporan"
                  className="w-full border border-[#CBD5E1]
                  rounded-lg px-3 py-2.5 text-sm outline-none
                  focus:border-[#003366]
                  focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Tahun
                  </label>

                  <select
                    name="tahun"
                    value={form.tahun}
                    onChange={handleChange}
                    className="w-full border border-[#CBD5E1]
                    rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option>2026</option>
                    <option>2025</option>
                    <option>2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Periode
                  </label>

                  <select
                    name="periode"
                    value={form.periode}
                    onChange={handleChange}
                    className="w-full border border-[#CBD5E1]
                    rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option>Tahunan</option>
                    <option>Triwulan I</option>
                    <option>Triwulan II</option>
                    <option>Triwulan III</option>
                    <option>Triwulan IV</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Unit Kerja
                </label>

                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full border border-[#CBD5E1]
                  rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>
                    Dinas Komunikasi dan Informatika
                  </option>
                  <option>Semua Unit Kerja</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-[#CBD5E1]
                  rounded-lg px-3 py-2.5 text-sm"
                >
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>

              <div className="pt-4 border-t
                border-[#E2E8F0] flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border
                  border-[#CBD5E1] rounded-lg
                  text-sm font-semibold hover:bg-[#F8FAFC]"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#003366]
                  text-white rounded-lg text-sm
                  font-semibold hover:bg-[#001E40]"
                >
                  Simpan Laporan
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================
   COMPONENT KECIL
========================= */

function StatCard({
  icon,
  title,
  value,
  iconClass,
}) {
  return (
    <div className="bg-white border border-[#E2E8F0]
      rounded-xl p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-[#64748B] mb-2">
            {title}
          </p>

          <h3 className="text-3xl font-bold text-[#0B1C30]">
            {value}
          </h3>
        </div>

        <div className={`w-11 h-11 rounded-lg
          flex items-center justify-center ${iconClass}`}>

          <span className="material-symbols-outlined">
            {icon}
          </span>

        </div>

      </div>

    </div>
  );
}


function StatusBadge({ status }) {
  if (status === "Published") {
    return (
      <span className="inline-flex items-center gap-1
        px-2.5 py-1 rounded-full text-xs font-semibold
        bg-green-50 text-green-700">

        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />

        Published
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1
      px-2.5 py-1 rounded-full text-xs font-semibold
      bg-yellow-50 text-yellow-700">

      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />

      Draft
    </span>
  );
}