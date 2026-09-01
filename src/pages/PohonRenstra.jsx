import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
import { Download, Pencil } from "lucide-react";

/* =========================================================
   KONFIGURASI API
========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000/api";

// Slug URL yang dipakai backend Laravel: /api/renstra/nodes/{slug}/{id}
const LEVEL_TO_SLUG = {
  "ULTIMATE OUTCOME": "ultimate",
  "INTERMEDIATE OUTCOME": "intermediate",
  "IMMEDIATE OUTCOME": "immediate",
  OUTPUT: "output",
};

/* =========================================================
   UTILITIES
========================================================= */

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/* =========================================================
   HITUNG JUMLAH BARIS
   (1 baris tabel = 1 Output. Sub Kegiatan sudah nempel jadi
   bagian dari Output, jadi tidak menambah baris lagi.)
========================================================= */

function countImmediateRows(immediate) {
  return Math.max(immediate.outputs?.length || 0, 1);
}

function countIntermediateRows(intermediate) {
  return Math.max(
    intermediate.immediates.reduce(
      (total, immediate) => total + countImmediateRows(immediate),
      0
    ),
    1
  );
}

function countUltimateRows(renstra) {
  return Math.max(
    renstra.intermediates.reduce(
      (total, intermediate) => total + countIntermediateRows(intermediate),
      0
    ),
    1
  );
}

/* =========================================================
   EXPORT EXCEL
========================================================= */

const EXPORT_HEADER = [
  "Ultimate Outcome",
  "Tujuan",
  "Indikator",
  "Target/ Satuan",
  "Intermediate Outcome",
  "Sasaran",
  "Indikator",
  "Target/ Satuan",
  "Immediate Outcome",
  "Program",
  "Nomenklatur SIPD",
  "Indikator",
  "Target/ Satuan",
  "Output",
  "Kegiatan",
  "Nomenklatur SIPD",
  "Indikator",
  "Target/ Satuan",
  "Output/ Input",
  "Sub Kegiatan",
  "Nomenklatur SIPD",
  "Indikator",
  "Target/ Satuan",
];

// Warna ARGB persis seperti file referensi (casecading-1_terisi_intermediate).
const COLOR_RED = "FFFF5050";
const COLOR_BLUE = "FF5B9BD5";
const COLOR_GREEN = "FF92D050";
const COLOR_ORANGE = "FFFFC000";
const COLOR_GRAY = "FFD8D8D8";
const COLOR_YELLOW = "FFFFCC29";

// Warna header per kolom (index 0 = kolom A ... index 22 = kolom W).
const HEADER_COLORS = [
  COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED, // Ultimate Outcome, Tujuan, Indikator, Target
  COLOR_BLUE, COLOR_RED, COLOR_RED, COLOR_RED, // Intermediate Outcome, Sasaran, Indikator, Target
  COLOR_GREEN, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, // Immediate Outcome, Program, Nomenklatur, Indikator, Target
  COLOR_ORANGE, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, // Output, Kegiatan, Nomenklatur, Indikator, Target
  COLOR_GRAY, // Output/ Input
  COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, // Sub Kegiatan, Nomenklatur, Indikator, Target
];

// Di baris DATA, cuma 4 kolom "nama" (Ultimate/Intermediate/Immediate/Output)
// yang diwarnai — sama seperti file referensi. Kolom lain putih polos.
const DATA_NAME_COLUMN_COLORS = {
  0: COLOR_RED, // Ultimate Outcome
  4: COLOR_BLUE, // Intermediate Outcome
  8: COLOR_GREEN, // Immediate Outcome
  13: COLOR_ORANGE, // Output
};

// Lebar kolom (wch) persis mengikuti file referensi.
const EXPORT_COLUMN_WIDTHS = [
  18, 14, 14, 18, 38, 30, 13, 18, 26, 21, 19, 18, 19, 27, 23, 21, 17, 18, 17, 20, 19, 26, 17,
];

const THIN_BORDER = {
  top: { style: "thin", color: { rgb: "FF000000" } },
  bottom: { style: "thin", color: { rgb: "FF000000" } },
  left: { style: "thin", color: { rgb: "FF000000" } },
  right: { style: "thin", color: { rgb: "FF000000" } },
};

function headerCellStyle(bgColor) {
  return {
    fill: { patternType: "solid", fgColor: { rgb: bgColor } },
    font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: THIN_BORDER,
  };
}

function dataCellStyle(bgColor) {
  return {
    fill: bgColor
      ? { patternType: "solid", fgColor: { rgb: bgColor } }
      : { patternType: "none" },
    font: { sz: 11, name: "Calibri" },
    alignment: { vertical: "top", wrapText: true },
    border: THIN_BORDER,
  };
}

/**
 * Susun baris export. Beda dari versi sebelumnya: nilai induk (Ultimate,
 * Intermediate, Immediate, Output) DIULANG di setiap baris turunannya —
 * tidak dikosongkan — persis seperti format file referensi (tanpa merge cell).
 */
function buildExportRows(renstraList) {
  const rows = [];

  renstraList.forEach((renstra) => {
    const ultimate = renstra.ultimateOutcome;

    const intermediates = renstra.intermediates.length
      ? renstra.intermediates
      : [{ id: "empty", title: "", sasaran: "", indicator: "", target: "", immediates: [] }];

    intermediates.forEach((intermediate) => {
      const immediates = intermediate.immediates.length
        ? intermediate.immediates
        : [{ id: "empty", title: "", program: "", nomenklaturSipd: "", indicator: "", target: "", outputs: [] }];

      immediates.forEach((immediate) => {
        const outputs = immediate.outputs.length
          ? immediate.outputs
          : [{ id: "empty", title: "", kegiatan: "", nomenklaturSipd: "", indicator: "", target: "", outputInput: "", subKegiatan: [] }];

        outputs.forEach((output) => {
          const sub = output.subKegiatan?.[0] || {};

          rows.push([
            ultimate.title || "",
            ultimate.tujuan || "",
            ultimate.indicator || "",
            ultimate.target || "",
            intermediate.title || "",
            intermediate.sasaran || "",
            intermediate.indicator || "",
            intermediate.target || "",
            immediate.title || "",
            immediate.program || "",
            immediate.nomenklaturSipd || "",
            immediate.indicator || "",
            immediate.target || "",
            output.title || "",
            output.kegiatan || "",
            output.nomenklaturSipd || "",
            output.indicator || "",
            output.target || "",
            output.outputInput || "",
            sub.title || "",
            sub.nomenklaturSipd || "",
            sub.indicator || "",
            sub.target || "",
          ]);
        });
      });
    });
  });

  return rows;
}

function exportRenstraToExcel(renstraList, year) {
  const dataRows = buildExportRows(renstraList);
  const sheetData = [EXPORT_HEADER, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Terapkan style ke tiap sel: header (baris 0) vs data (baris 1+).
  for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
    for (let colIndex = 0; colIndex < EXPORT_HEADER.length; colIndex++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: "s", v: "" };
      }

      worksheet[cellRef].s =
        rowIndex === 0
          ? headerCellStyle(HEADER_COLORS[colIndex])
          : dataCellStyle(DATA_NAME_COLUMN_COLORS[colIndex]);
    }
  }

  worksheet["!cols"] = EXPORT_COLUMN_WIDTHS.map((wch) => ({ wch }));
  worksheet["!rows"] = [{ hpt: 30 }];
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CASECADING");
  XLSX.writeFile(workbook, `casecading-renstra-${year}.xlsx`);
}

/* =========================================================
   LEVEL LABEL MAP
========================================================= */

const LEVEL_TITLE = {
  "ULTIMATE OUTCOME": "Ultimate Outcome",
  "INTERMEDIATE OUTCOME": "Intermediate Outcome",
  "IMMEDIATE OUTCOME": "Immediate Outcome",
  OUTPUT: "Output",
};

/* =========================================================
   TABLE CELL
========================================================= */

function RenstraCell({ title, onDetail }) {
  return (
    <div className="flex h-full min-h-[112px] flex-col items-center justify-between gap-2 px-1 py-2">
      <p className="line-clamp-4 text-center text-[11px] font-semibold leading-snug text-slate-700">
        {title ? (
          title
        ) : (
          <span className="italic font-normal text-slate-400">Belum ada judul</span>
        )}
      </p>

      <button
        type="button"
        onClick={onDetail}
        title="Lihat Detail"
        className="inline-flex items-center rounded-full bg-blue-950 px-3 py-1 text-[9px] font-semibold tracking-wide text-white transition hover:bg-blue-800 active:scale-95"
      >
        Detail
      </button>
    </div>
  );
}

/* =========================================================
   DETAIL MODAL — hanya Edit, tanpa Hapus
========================================================= */

function DetailModal({ data, level, onClose, onEdit }) {
  if (!data) return null;

  const sub = data.subKegiatan?.[0] || {};

  const configs = {
    "ULTIMATE OUTCOME": [
      ["Ultimate Outcome", data.title],
      ["Tujuan", data.tujuan],
      ["Indikator", data.indicator],
      ["Target / Satuan", data.target],
    ],

    "INTERMEDIATE OUTCOME": [
      ["Intermediate Outcome", data.title],
      ["Sasaran", data.sasaran],
      ["Indikator", data.indicator],
      ["Target / Satuan", data.target],
    ],

    "IMMEDIATE OUTCOME": [
      ["Immediate Outcome", data.title],
      ["Program", data.program],
      ["Nomenklatur SIPD", data.nomenklaturSipd],
      ["Indikator", data.indicator],
      ["Target / Satuan", data.target],
    ],

    OUTPUT: [
      ["Output", data.title],
      ["Kegiatan", data.kegiatan],
      ["Nomenklatur SIPD", data.nomenklaturSipd],
      ["Indikator", data.indicator],
      ["Target / Satuan", data.target],
      ["Output/ Input", data.outputInput],
      ["Sub Kegiatan", sub.title],
      ["Nomenklatur SIPD", sub.nomenklaturSipd],
      ["Indikator", sub.indicator],
      ["Target / Satuan", sub.target],
    ],
  };

  const fields = configs[level] || [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-800">visibility</span>
              <h3 className="text-lg font-bold text-slate-900">Detail {level}</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Informasi lengkap data {level.toLowerCase()}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6">
          <div className="space-y-4">
            {fields.map(([label, value], index) => (
              <div
                key={`${label}-${index}`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </span>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {value || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER — hanya Edit, tidak ada Hapus */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:border-blue-950 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-blue-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM MODAL EDIT
   Title/nama node TIDAK bisa diubah dari Renstra (read-only),
   hanya kolom "isi" per level yang bisa diisi/diedit.
========================================================= */

function FormModal({ data, level, saving, onClose, onSave }) {
  const sub = data?.subKegiatan?.[0] || {};

  const [form, setForm] = useState({
    tujuan: data?.tujuan || "",
    sasaran: data?.sasaran || "",
    program: data?.program || "",
    nomenklaturSipd: data?.nomenklaturSipd || "",
    kegiatan: data?.kegiatan || "",
    outputInput: data?.outputInput || "",
    indicator: data?.indicator || "",
    target: data?.target || "",

    subKegiatanTitle: sub.title || "",
    subKegiatanNomenklaturSipd: sub.nomenklaturSipd || "",
    subKegiatanIndicator: sub.indicator || "",
    subKegiatanTarget: sub.target || "",
  });

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Edit Isi Data
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{LEVEL_TITLE[level]}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6">
          <div className="space-y-5">
            {/* NAMA — read-only, milik Pohon Kinerja */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {LEVEL_TITLE[level]} <span className="normal-case font-normal text-slate-400">(tidak bisa diubah di sini)</span>
              </label>
              <div className="w-full rounded-md border border-slate-200 bg-slate-100 p-3 text-sm text-slate-500">
                {data?.title || "-"}
              </div>
            </div>

            {level === "ULTIMATE OUTCOME" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tujuan
                </label>
                <textarea
                  value={form.tujuan}
                  onChange={(event) => changeField("tujuan", event.target.value)}
                  rows={4}
                  placeholder="Masukkan tujuan..."
                  className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
            )}

            {level === "INTERMEDIATE OUTCOME" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sasaran
                </label>
                <textarea
                  value={form.sasaran}
                  onChange={(event) => changeField("sasaran", event.target.value)}
                  rows={3}
                  placeholder="Masukkan sasaran..."
                  className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
            )}

            {level === "IMMEDIATE OUTCOME" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Program
                  </label>
                  <textarea
                    value={form.program}
                    onChange={(event) => changeField("program", event.target.value)}
                    rows={2}
                    placeholder="Masukkan nama program..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nomenklatur SIPD
                  </label>
                  <input
                    type="text"
                    value={form.nomenklaturSipd}
                    onChange={(event) => changeField("nomenklaturSipd", event.target.value)}
                    placeholder="Masukkan kode nomenklatur SIPD..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>
              </>
            )}

            {level === "OUTPUT" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Kegiatan
                  </label>
                  <textarea
                    value={form.kegiatan}
                    onChange={(event) => changeField("kegiatan", event.target.value)}
                    rows={3}
                    placeholder="Masukkan kegiatan..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nomenklatur SIPD
                  </label>
                  <input
                    type="text"
                    value={form.nomenklaturSipd}
                    onChange={(event) => changeField("nomenklaturSipd", event.target.value)}
                    placeholder="Masukkan kode nomenklatur SIPD..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>
              </>
            )}

            {/* INDIKATOR & TARGET — dipakai semua level kecuali OUTPUT (OUTPUT taruh setelah Output/Input) */}
            {level !== "OUTPUT" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Indikator
                  </label>
                  <textarea
                    value={form.indicator}
                    onChange={(event) => changeField("indicator", event.target.value)}
                    rows={3}
                    placeholder="Masukkan indikator..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Target / Satuan
                  </label>
                  <input
                    type="text"
                    value={form.target}
                    onChange={(event) => changeField("target", event.target.value)}
                    placeholder="Contoh: 100%, 10 kegiatan, Baik"
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>
              </>
            )}

            {level === "OUTPUT" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Indikator
                  </label>
                  <textarea
                    value={form.indicator}
                    onChange={(event) => changeField("indicator", event.target.value)}
                    rows={3}
                    placeholder="Masukkan indikator..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Target / Satuan
                  </label>
                  <input
                    type="text"
                    value={form.target}
                    onChange={(event) => changeField("target", event.target.value)}
                    placeholder="Contoh: 100%, 10 kegiatan"
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Output/ Input
                  </label>
                  <input
                    type="text"
                    value={form.outputInput}
                    onChange={(event) => changeField("outputInput", event.target.value)}
                    placeholder="Masukkan output/input..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sub Kegiatan
                  </label>
                  <textarea
                    value={form.subKegiatanTitle}
                    onChange={(event) => changeField("subKegiatanTitle", event.target.value)}
                    rows={2}
                    placeholder="Masukkan sub kegiatan..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nomenklatur SIPD
                  </label>
                  <input
                    type="text"
                    value={form.subKegiatanNomenklaturSipd}
                    onChange={(event) => changeField("subKegiatanNomenklaturSipd", event.target.value)}
                    placeholder="Masukkan kode nomenklatur SIPD..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Indikator
                  </label>
                  <textarea
                    value={form.subKegiatanIndicator}
                    onChange={(event) => changeField("subKegiatanIndicator", event.target.value)}
                    rows={2}
                    placeholder="Masukkan indikator sub kegiatan..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Target / Satuan
                  </label>
                  <input
                    type="text"
                    value={form.subKegiatanTarget}
                    onChange={(event) => changeField("subKegiatanTarget", event.target.value)}
                    placeholder="Contoh: 100%, 12 Kegiatan"
                    className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-blue-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">save</span>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE — 4 kolom, 1 baris per Output
========================================================= */

function RenstraTable({ data, onDetail }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-1/4 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Ultimate Outcome
            </th>
            <th className="w-1/4 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Intermediate Outcome
            </th>
            <th className="w-1/4 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Immediate Outcome
            </th>
            <th className="w-1/4 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Output
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center">
                <span className="material-symbols-outlined mb-2 block text-4xl text-slate-300">
                  folder_open
                </span>
                <p className="text-sm text-slate-500">Belum ada data Renstra.</p>
              </td>
            </tr>
          )}

          {data.map((renstra) => {
            const ultimate = renstra.ultimateOutcome;
            const ultimateRows = countUltimateRows(renstra);
            let ultimateRendered = false;

            return renstra.intermediates.map((intermediate) => {
              const intermediateRows = countIntermediateRows(intermediate);
              let intermediateRendered = false;

              return intermediate.immediates.map((immediate) => {
                const immediateRows = countImmediateRows(immediate);
                let immediateRendered = false;

                const outputs = immediate.outputs?.length
                  ? immediate.outputs
                  : [{ id: createId("empty"), title: "", kegiatan: "", nomenklaturSipd: "", indicator: "", target: "", outputInput: "", subKegiatan: [] }];

                return outputs.map((output) => (
                  <tr
                    key={`${renstra.id}-${intermediate.id}-${immediate.id}-${output.id}`}
                    className="align-middle transition hover:bg-blue-50/40"
                  >
                    {/* ULTIMATE */}
                    {!ultimateRendered &&
                      (() => {
                        ultimateRendered = true;
                        return (
                          <td
                            rowSpan={ultimateRows}
                            className="border border-slate-200 bg-white p-1.5 align-middle"
                          >
                            <RenstraCell
                              title={ultimate.title}
                              onDetail={() =>
                                onDetail(ultimate, "ULTIMATE OUTCOME", {
                                  renstraId: renstra.id,
                                })
                              }
                            />
                          </td>
                        );
                      })()}

                    {/* INTERMEDIATE */}
                    {!intermediateRendered &&
                      (() => {
                        intermediateRendered = true;
                        return (
                          <td
                            rowSpan={intermediateRows}
                            className="border border-slate-200 bg-white p-1.5 align-middle"
                          >
                            <RenstraCell
                              title={intermediate.title}
                              onDetail={() =>
                                onDetail(intermediate, "INTERMEDIATE OUTCOME", {
                                  renstraId: renstra.id,
                                  intermediateId: intermediate.id,
                                })
                              }
                            />
                          </td>
                        );
                      })()}

                    {/* IMMEDIATE */}
                    {!immediateRendered &&
                      (() => {
                        immediateRendered = true;
                        return (
                          <td
                            rowSpan={immediateRows}
                            className="border border-slate-200 bg-white p-1.5 align-middle"
                          >
                            <RenstraCell
                              title={immediate.title}
                              onDetail={() =>
                                onDetail(immediate, "IMMEDIATE OUTCOME", {
                                  renstraId: renstra.id,
                                  intermediateId: intermediate.id,
                                  immediateId: immediate.id,
                                })
                              }
                            />
                          </td>
                        );
                      })()}

                    {/* OUTPUT (sudah termasuk Output/Input & Sub Kegiatan di dalam detailnya) */}
                    <td className="border border-slate-200 bg-white p-1.5 align-middle">
                      <RenstraCell
                        title={output.title}
                        onDetail={() =>
                          onDetail(output, "OUTPUT", {
                            renstraId: renstra.id,
                            intermediateId: intermediate.id,
                            immediateId: immediate.id,
                            outputId: output.id,
                          })
                        }
                      />
                    </td>
                  </tr>
                ));
              });
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

function PohonRenstra() {
  const [data, setData] = useState([]);
  const [year, setYear] = useState("2026");
  const [detail, setDetail] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Available years state
  const [availableYears, setAvailableYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  // Fetch available years on component load
  useEffect(() => {
    const fetchYears = async () => {
      setLoadingYears(true);
      try {
        const response = await fetch(`${API_BASE_URL}/renstra/years`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setAvailableYears(data.data || []);
          // Set default year to first available year if available
          if (data.data && data.data.length > 0) {
            setYear(String(data.data[0]));
          }
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
      } finally {
        setLoadingYears(false);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const fetchRenstra = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/renstra?tahun=${year}`
        );

        const result = await response.json();

        if (!response.ok) {
          setData([]);
          return;
        }

        const formattedData = result.data.flatMap((pohon) =>
          pohon.ultimates.map((ultimate) => ({
            id: `${pohon.id}-${ultimate.id}`,
            year: pohon.tahun,

            ultimateOutcome: {
              id: ultimate.id,
              title: ultimate.title,
              tujuan: ultimate.tujuan,
              indicator: ultimate.indicator,
              target: ultimate.target,
            },

            intermediates: ultimate.intermediates || [],
          }))
        );

        setData(formattedData);
      } catch (error) {
        console.error("Gagal mengambil data Renstra:", error);
        setData([]);
      }
    };

    fetchRenstra();
  }, [year]);

  const filteredData = useMemo(() => {
    return data.filter((item) => item.year === year);
  }, [data, year]);

  /* =======================================================
     DETAIL
  ======================================================= */

  const openDetail = (item, level, path) => {
    setDetail({ data: item, level, path });
  };

  const closeDetail = () => setDetail(null);

  /* =======================================================
     EDIT (dipicu dari dalam Detail Modal)
  ======================================================= */

  const openEdit = (item, level, path) => {
    setDetail(null);
    setEditData({ data: item, level, path });
  };

  const closeEdit = () => setEditData(null);

  const updateNodeInTree = (level, path, formValues) => {
    setData((current) =>
      current.map((renstra) => {
        if (renstra.id !== path.renstraId) return renstra;

        if (level === "ULTIMATE OUTCOME") {
          return {
            ...renstra,
            ultimateOutcome: {
              ...renstra.ultimateOutcome,
              tujuan: formValues.tujuan,
              indicator: formValues.indicator,
              target: formValues.target,
            },
          };
        }

        return {
          ...renstra,
          intermediates: renstra.intermediates.map((intermediate) => {
            if (level === "INTERMEDIATE OUTCOME") {
              return intermediate.id === path.intermediateId
                ? {
                    ...intermediate,
                    sasaran: formValues.sasaran,
                    indicator: formValues.indicator,
                    target: formValues.target,
                  }
                : intermediate;
            }

            if (intermediate.id !== path.intermediateId) return intermediate;

            return {
              ...intermediate,
              immediates: intermediate.immediates.map((immediate) => {
                if (level === "IMMEDIATE OUTCOME") {
                  return immediate.id === path.immediateId
                    ? {
                        ...immediate,
                        program: formValues.program,
                        nomenklaturSipd: formValues.nomenklaturSipd,
                        indicator: formValues.indicator,
                        target: formValues.target,
                      }
                    : immediate;
                }

                if (immediate.id !== path.immediateId) return immediate;

                return {
                  ...immediate,
                  outputs: immediate.outputs.map((output) => {
                    if (output.id !== path.outputId) return output;

                    return {
                      ...output,
                      kegiatan: formValues.kegiatan,
                      nomenklaturSipd: formValues.nomenklaturSipd,
                      indicator: formValues.indicator,
                      target: formValues.target,
                      outputInput: formValues.outputInput,
                      subKegiatan: [
                        {
                          ...(output.subKegiatan?.[0] || {}),
                          title: formValues.subKegiatanTitle,
                          nomenklaturSipd: formValues.subKegiatanNomenklaturSipd,
                          indicator: formValues.subKegiatanIndicator,
                          target: formValues.subKegiatanTarget,
                        },
                      ],
                    };
                  }),
                };
              }),
            };
          }),
        };
      })
    );
  };

  // Simpan ke backend dulu, baru update tampilan lokal kalau berhasil.
  const saveEdit = async (formValues) => {
    const { level, path, data: node } = editData;
    const slug = LEVEL_TO_SLUG[level];
    const id = node.id;

    setSaving(true);

    try {
      let ok = true;

      if (level === "OUTPUT") {
        const [outputRes, subRes] = await Promise.all([
          fetch(`${API_BASE_URL}/renstra/nodes/output/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kegiatan: formValues.kegiatan,
              nomenklaturSipd: formValues.nomenklaturSipd,
              indicator: formValues.indicator,
              target: formValues.target,
              outputInput: formValues.outputInput,
            }),
          }),
          fetch(`${API_BASE_URL}/renstra/nodes/sub-kegiatan/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: formValues.subKegiatanTitle,
              nomenklaturSipd: formValues.subKegiatanNomenklaturSipd,
              indicator: formValues.subKegiatanIndicator,
              target: formValues.subKegiatanTarget,
            }),
          }),
        ]);

        ok = outputRes.ok && subRes.ok;
      } else {
        const body =
          level === "ULTIMATE OUTCOME"
            ? {
                tujuan: formValues.tujuan,
                indicator: formValues.indicator,
                target: formValues.target,
              }
            : level === "INTERMEDIATE OUTCOME"
            ? {
                sasaran: formValues.sasaran,
                indicator: formValues.indicator,
                target: formValues.target,
              }
            : {
                program: formValues.program,
                nomenklaturSipd: formValues.nomenklaturSipd,
                indicator: formValues.indicator,
                target: formValues.target,
              };

        const response = await fetch(`${API_BASE_URL}/renstra/nodes/${slug}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        ok = response.ok;
      }

      if (!ok) {
        alert("Gagal menyimpan perubahan ke server.");
        return;
      }

      updateNodeInTree(level, path, formValues);
      closeEdit();
    } catch (error) {
      console.error("Gagal menyimpan perubahan Renstra:", error);
      alert("Gagal menyimpan perubahan. Periksa koneksi ke server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-bold text-blue-950">Rencana Strategis</span>
        </nav>

        {/* HEADER */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-1 text-3xl font-bold text-slate-900">Rencana Strategis</h2>
            <p className="text-slate-500">
              Pengelolaan isi rencana strategis organisasi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => exportRenstraToExcel(filteredData, year)}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
          >
            <Download className="h-4 w-4" />
            Export ke Excel
          </button>
        </div>

        {/* FILTER TAHUN */}
        <div className="mb-6 rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div className="max-w-xs">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tahun
            </label>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              disabled={loadingYears}
              className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Pilih Tahun</option>
              {loadingYears ? (
                <option disabled>Memuat tahun...</option>
              ) : availableYears.length > 0 ? (
                availableYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))
              ) : (
                <option disabled>Tidak ada data tahun</option>
              )}
            </select>
          </div>
        </div>

        {/* INFO */}
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-700">info</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Struktur Rencana Strategis</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                Struktur Ultimate, Intermediate, Immediate, dan Output berasal dari Pohon
                Kinerja dan tidak bisa ditambah/dihapus dari sini. Klik <b>Lihat Detail</b>{" "}
                lalu <b>Edit</b> untuk mengisi atau melengkapi konten (indikator, target,
                sasaran, program, kegiatan, output/input, dan sub kegiatan).
              </p>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <RenstraTable data={filteredData} onDetail={openDetail} />
      </main>

      {/* DETAIL MODAL */}
      {detail && (
        <DetailModal
          data={detail.data}
          level={detail.level}
          onClose={closeDetail}
          onEdit={() => openEdit(detail.data, detail.level, detail.path)}
        />
      )}

      {/* EDIT MODAL */}
      {editData && (
        <FormModal
          data={editData.data}
          level={editData.level}
          saving={saving}
          onClose={closeEdit}
          onSave={saveEdit}
        />
      )}
    </>
  );
}

export default PohonRenstra;
