import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";

/* =========================================================
   UTILITIES
========================================================= */

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/* =========================================================
   HITUNG JUMLAH BARIS
========================================================= */

function countOutputRows(output) {
  return Math.max(output.subKegiatan?.length || 0, 1);
}

function countImmediateRows(immediate) {
  return Math.max(
    immediate.outputs.reduce((total, output) => total + countOutputRows(output), 0),
    1
  );
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

function countUltimateRows(ultimate) {
  return Math.max(
    ultimate.intermediates.reduce(
      (total, intermediate) => total + countIntermediateRows(intermediate),
      0
    ),
    1
  );
}

/* =========================================================
   EXPORT EXCEL — struktur kolom mengikuti file casecading
   (Ultimate → Intermediate → Immediate → Output → Sub Kegiatan),
   baris lanjutan dikosongkan seperti file aslinya (tanpa merge).
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

function buildExportRows(renstraList) {
  const rows = [];

  renstraList.forEach((renstra) => {
    const ultimate = renstra.ultimateOutcome;
    let ultimateShown = false;

    const intermediates = renstra.intermediates.length
      ? renstra.intermediates
      : [{ id: "empty", title: "", indicator: "", target: "", immediates: [] }];

    intermediates.forEach((intermediate) => {
      let intermediateShown = false;

      const immediates = intermediate.immediates.length
        ? intermediate.immediates
        : [{ id: "empty", title: "", indicator: "", target: "", outputs: [] }];

      immediates.forEach((immediate) => {
        let immediateShown = false;

        const outputs = immediate.outputs.length
          ? immediate.outputs
          : [{ id: "empty", title: "", indicator: "", target: "", subKegiatan: [] }];

        outputs.forEach((output) => {
          let outputShown = false;

          const subs = output.subKegiatan?.length
            ? output.subKegiatan
            : [{ id: "empty", title: "", indicator: "", target: "" }];

          subs.forEach((sub) => {
            rows.push([
              !ultimateShown ? ultimate.title || "" : "",
              !ultimateShown ? ultimate.tujuan || "" : "",
              !ultimateShown ? ultimate.indicator || "" : "",
              !ultimateShown ? ultimate.target || "" : "",
              !intermediateShown ? intermediate.title || "" : "",
              !intermediateShown ? intermediate.sasaran || "" : "",
              !intermediateShown ? intermediate.indicator || "" : "",
              !intermediateShown ? intermediate.target || "" : "",
              !immediateShown ? immediate.title || "" : "",
              !immediateShown ? immediate.program || "" : "",
              !immediateShown ? immediate.nomenklaturSipd || "" : "",
              !immediateShown ? immediate.indicator || "" : "",
              !immediateShown ? immediate.target || "" : "",
              !outputShown ? output.title || "" : "",
              !outputShown ? output.kegiatan || "" : "",
              !outputShown ? output.nomenklaturSipd || "" : "",
              !outputShown ? output.indicator || "" : "",
              !outputShown ? output.target || "" : "",
              !outputShown ? output.outputInput || "" : "",
              sub.title || "",
              sub.nomenklaturSipd || "",
              sub.indicator || "",
              sub.target || "",
            ]);

            ultimateShown = true;
            intermediateShown = true;
            immediateShown = true;
            outputShown = true;
          });
        });
      });
    });
  });

  return rows;
}

function exportRenstraToExcel(renstraList, year) {
  const sheetData = [EXPORT_HEADER, ...buildExportRows(renstraList)];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet["!cols"] = EXPORT_HEADER.map(() => ({ wch: 24 }));
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
  "SUB KEGIATAN": "Sub Kegiatan",
};

/* =========================================================
   TABLE CELL — nampilin judul + tombol detail
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
   DETAIL MODAL — sekarang juga punya Edit & Hapus
========================================================= */

function DetailModal({ data, level, canDelete, onClose, onEdit, onDelete }) {
  if (!data) return null;

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
    ],

    "SUB KEGIATAN": [
      ["Sub Kegiatan", data.title],
      ["Nomenklatur SIPD", data.nomenklaturSipd],
      ["Indikator", data.indicator],
      ["Target / Satuan", data.target],
    ],
  };

  const fields = configs[level] || [];
  const headingLabel = level === "SUB KEGIATAN" ? "OUTPUT/ INPUT" : level;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-800">visibility</span>
              <h3 className="text-lg font-bold text-slate-900">Detail {headingLabel}</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Informasi lengkap data {headingLabel.toLowerCase()}.
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
                key={label}
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

        {/* FOOTER — Aksi (Edit / Hapus) sekarang di sini */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:border-blue-950 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            )}
          </div>

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
   CONFIRM MODAL — pengganti window.confirm() bawaan browser
========================================================= */

function ConfirmModal({ open, title, description, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <span className="material-symbols-outlined">warning</span>
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {title || "Hapus data ini?"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {description ||
                "Data turunannya juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM MODAL TAMBAH / EDIT
========================================================= */

function FormModal({ mode, data, level, onClose, onSave }) {
  const [form, setForm] = useState({
    title: data?.title || "",
    tujuan: data?.tujuan || "",
    sasaran: data?.sasaran || "",
    program: data?.program || "",
    kegiatan: data?.kegiatan || "",
    nomenklaturSipd: data?.nomenklaturSipd || "",
    indicator: data?.indicator || "",
    target: data?.target || "",
  });

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert("Nama / judul data wajib diisi.");
      return;
    }

    onSave({ ...data, ...form });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              {mode === "edit" ? "Edit Data" : "Tambah Data"}
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
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {LEVEL_TITLE[level]}
              </label>
              <textarea
                value={form.title}
                onChange={(event) => changeField("title", event.target.value)}
                rows={4}
                placeholder={`Masukkan ${LEVEL_TITLE[level].toLowerCase()}...`}
                className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
              />
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

            {level === "SUB KEGIATAN" && (
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
            )}

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
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-blue-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">save</span>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL TAMBAH DATA
========================================================= */

function AddDataModal({ data, year, onClose, onAdd }) {
  const [level, setLevel] = useState("INTERMEDIATE OUTCOME");
  const [intermediateId, setIntermediateId] = useState(data.intermediates[0]?.id || "");
  const [immediateId, setImmediateId] = useState("");
  const [outputId, setOutputId] = useState("");
  const [form, setForm] = useState({
    title: "",
    tujuan: "",
    sasaran: "",
    program: "",
    kegiatan: "",
    nomenklaturSipd: "",
    indicator: "",
    target: "",
  });

  const intermediates = data.intermediates;
  const selectedIntermediate = intermediates.find((item) => item.id === intermediateId);
  const immediates = selectedIntermediate?.immediates || [];
  const selectedImmediate = immediates.find((item) => item.id === immediateId);
  const outputs = selectedImmediate?.outputs || [];

  const changeForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLevelChange = (value) => {
    setLevel(value);
    setForm({
      title: "",
      tujuan: "",
      sasaran: "",
      program: "",
      kegiatan: "",
      nomenklaturSipd: "",
      indicator: "",
      target: "",
    });

    if (value === "IMMEDIATE OUTCOME" && !immediateId && immediates.length > 0) {
      setImmediateId(immediates[0].id);
    }

    if (value === "OUTPUT" && !outputId && outputs.length > 0) {
      setOutputId(outputs[0].id);
    }
  };

  const submit = () => {
    if (!form.title.trim()) {
      alert("Nama / judul data wajib diisi.");
      return;
    }

    if (level === "IMMEDIATE OUTCOME" && !intermediateId) {
      alert("Pilih Intermediate Outcome terlebih dahulu.");
      return;
    }

    if (level === "OUTPUT" && (!intermediateId || !immediateId)) {
      alert("Pilih Intermediate dan Immediate terlebih dahulu.");
      return;
    }

    if (level === "SUB KEGIATAN" && (!intermediateId || !immediateId || !outputId)) {
      alert("Pilih Intermediate, Immediate, dan Output terlebih dahulu.");
      return;
    }

    onAdd({ level, form, intermediateId, immediateId, outputId, year });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Tambah Data</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Tambah Struktur Renstra</h3>
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
            {/* LEVEL */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Level Data
              </label>
              <select
                value={level}
                onChange={(event) => handleLevelChange(event.target.value)}
                className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950"
              >
                <option>INTERMEDIATE OUTCOME</option>
                <option>IMMEDIATE OUTCOME</option>
                <option>OUTPUT</option>
                <option>SUB KEGIATAN</option>
              </select>
            </div>

            {/* INTERMEDIATE PARENT */}
            {level !== "INTERMEDIATE OUTCOME" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Intermediate Outcome
                </label>
                <select
                  value={intermediateId}
                  onChange={(event) => {
                    setIntermediateId(event.target.value);
                    setImmediateId("");
                    setOutputId("");
                  }}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950"
                >
                  <option value="">Pilih Intermediate Outcome</option>
                  {intermediates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* IMMEDIATE PARENT */}
            {(level === "OUTPUT" || level === "SUB KEGIATAN") && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Immediate Outcome
                </label>
                <select
                  value={immediateId}
                  onChange={(event) => {
                    setImmediateId(event.target.value);
                    setOutputId("");
                  }}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950"
                >
                  <option value="">Pilih Immediate Outcome</option>
                  {immediates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* OUTPUT PARENT */}
            {level === "SUB KEGIATAN" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Output
                </label>
                <select
                  value={outputId}
                  onChange={(event) => setOutputId(event.target.value)}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950"
                >
                  <option value="">Pilih Output</option>
                  {outputs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* NAMA */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nama / Judul
              </label>
              <textarea
                value={form.title}
                onChange={(event) => changeForm("title", event.target.value)}
                rows={4}
                placeholder="Masukkan data..."
                className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
              />
            </div>

            {level === "INTERMEDIATE OUTCOME" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sasaran
                </label>
                <textarea
                  value={form.sasaran}
                  onChange={(event) => changeForm("sasaran", event.target.value)}
                  rows={3}
                  placeholder="Masukkan sasaran..."
                  className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
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
                    onChange={(event) => changeForm("program", event.target.value)}
                    rows={2}
                    placeholder="Masukkan nama program..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nomenklatur SIPD
                  </label>
                  <input
                    type="text"
                    value={form.nomenklaturSipd}
                    onChange={(event) => changeForm("nomenklaturSipd", event.target.value)}
                    placeholder="Masukkan kode nomenklatur SIPD..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
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
                    onChange={(event) => changeForm("kegiatan", event.target.value)}
                    rows={3}
                    placeholder="Masukkan kegiatan..."
                    className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nomenklatur SIPD
                  </label>
                  <input
                    type="text"
                    value={form.nomenklaturSipd}
                    onChange={(event) => changeForm("nomenklaturSipd", event.target.value)}
                    placeholder="Masukkan kode nomenklatur SIPD..."
                    className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                  />
                </div>
              </>
            )}

            {level === "SUB KEGIATAN" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nomenklatur SIPD
                </label>
                <input
                  type="text"
                  value={form.nomenklaturSipd}
                  onChange={(event) => changeForm("nomenklaturSipd", event.target.value)}
                  placeholder="Masukkan kode nomenklatur SIPD..."
                  className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
                />
              </div>
            )}

            {/* INDIKATOR */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Indikator
              </label>
              <textarea
                value={form.indicator}
                onChange={(event) => changeForm("indicator", event.target.value)}
                rows={3}
                placeholder="Masukkan indikator..."
                className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
              />
            </div>

            {/* TARGET */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target / Satuan
              </label>
              <input
                type="text"
                value={form.target}
                onChange={(event) => changeForm("target", event.target.value)}
                placeholder="Contoh: 100%, 10 kegiatan"
                className="w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-blue-950 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900"
          >
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">add</span>
            Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TABLE — kolom Aksi dihapus, judul tampil langsung di sel,
   klik "Lihat Detail" untuk detail + edit + hapus
========================================================= */

function RenstraTable({ data, onDetail }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-1/5 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Ultimate Outcome
            </th>
            <th className="w-1/5 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Intermediate Outcome
            </th>
            <th className="w-1/5 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Immediate Outcome
            </th>
            <th className="w-1/5 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Output
            </th>
            <th className="w-1/5 border border-slate-300 bg-blue-950 px-2 py-4 text-center text-[10px] font-bold uppercase leading-tight text-white">
              Output/ Input
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
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

                return immediate.outputs.map((output) => {
                  const outputRows = countOutputRows(output);
                  let outputRendered = false;

                  const subKegiatan = output.subKegiatan?.length
                    ? output.subKegiatan
                    : [{ id: createId("empty"), title: "", indicator: "", target: "" }];

                  return subKegiatan.map((sub, subIndex) => {
                    const firstSub = subIndex === 0;

                    return (
                      <tr
                        key={`${renstra.id}-${intermediate.id}-${immediate.id}-${output.id}-${sub.id}`}
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

                        {/* OUTPUT */}
                        {!outputRendered &&
                          (() => {
                            outputRendered = true;
                            return (
                              <td
                                rowSpan={outputRows}
                                className="border border-slate-200 bg-white p-1.5 align-middle"
                              >
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
                            );
                          })()}

                        {/* SUB KEGIATAN */}
                        <td className="border border-slate-200 bg-white p-1.5 align-middle">
                          <RenstraCell
                            title={sub.title}
                            onDetail={() =>
                              onDetail(sub, "SUB KEGIATAN", {
                                renstraId: renstra.id,
                                intermediateId: intermediate.id,
                                immediateId: immediate.id,
                                outputId: output.id,
                                subId: sub.id,
                              })
                            }
                          />
                        </td>
                      </tr>
                    );
                  });
                });
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
  const [showAdd, setShowAdd] = useState(false);

  // { level, path } — dipakai ConfirmModal pengganti window.confirm()
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const fetchRenstra = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/renstra?tahun=${year}`
        );

        const result = await response.json();

        console.log("DATA DARI BACKEND:", result);

        if (!response.ok) {
          setData([]);
          return;
        }

        /*
         * Backend:
         * {
         *   tahun,
         *   ultimates: [...]
         * }
         *
         * Diubah menjadi format frontend:
         * {
         *   year,
         *   ultimateOutcome,
         *   intermediates
         * }
         */

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

  const updateNodeInTree = (level, path, updatedData) => {
    setData((current) =>
      current.map((renstra) => {
        if (renstra.id !== path.renstraId) return renstra;

        if (level === "ULTIMATE OUTCOME") {
          return { ...renstra, ultimateOutcome: { ...renstra.ultimateOutcome, ...updatedData } };
        }

        return {
          ...renstra,
          intermediates: renstra.intermediates.map((intermediate) => {
            if (level === "INTERMEDIATE OUTCOME") {
              return intermediate.id === path.intermediateId
                ? { ...intermediate, ...updatedData }
                : intermediate;
            }

            if (intermediate.id !== path.intermediateId) return intermediate;

            return {
              ...intermediate,
              immediates: intermediate.immediates.map((immediate) => {
                if (level === "IMMEDIATE OUTCOME") {
                  return immediate.id === path.immediateId
                    ? { ...immediate, ...updatedData }
                    : immediate;
                }

                if (immediate.id !== path.immediateId) return immediate;

                return {
                  ...immediate,
                  outputs: immediate.outputs.map((output) => {
                    if (level === "OUTPUT") {
                      return output.id === path.outputId
                        ? { ...output, ...updatedData }
                        : output;
                    }

                    if (output.id !== path.outputId) return output;

                    return {
                      ...output,
                      subKegiatan: output.subKegiatan.map((sub) =>
                        sub.id === path.subId ? { ...sub, ...updatedData } : sub
                      ),
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

  const saveEdit = (updatedData) => {
    updateNodeInTree(editData.level, editData.path, updatedData);
    closeEdit();
  };

  /* =======================================================
     HAPUS (dipicu dari dalam Detail Modal, dikonfirmasi lewat ConfirmModal)
  ======================================================= */

  const deleteNodeInTree = (level, path) => {
    if (level === "ULTIMATE OUTCOME") return;

    setData((current) =>
      current.map((renstra) => {
        if (renstra.id !== path.renstraId) return renstra;

        if (level === "INTERMEDIATE OUTCOME") {
          return {
            ...renstra,
            intermediates: renstra.intermediates.filter(
              (intermediate) => intermediate.id !== path.intermediateId
            ),
          };
        }

        return {
          ...renstra,
          intermediates: renstra.intermediates.map((intermediate) => {
            if (intermediate.id !== path.intermediateId) return intermediate;

            if (level === "IMMEDIATE OUTCOME") {
              return {
                ...intermediate,
                immediates: intermediate.immediates.filter(
                  (immediate) => immediate.id !== path.immediateId
                ),
              };
            }

            return {
              ...intermediate,
              immediates: intermediate.immediates.map((immediate) => {
                if (immediate.id !== path.immediateId) return immediate;

                if (level === "OUTPUT") {
                  return {
                    ...immediate,
                    outputs: immediate.outputs.filter((output) => output.id !== path.outputId),
                  };
                }

                return {
                  ...immediate,
                  outputs: immediate.outputs.map((output) => {
                    if (output.id !== path.outputId) return output;

                    return {
                      ...output,
                      subKegiatan: output.subKegiatan.filter((sub) => sub.id !== path.subId),
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

  // Dipanggil dari tombol "Hapus" di DetailModal — buka ConfirmModal, belum menghapus apa pun.
  const deleteFromDetail = (level, path) => {
    setConfirmDelete({ level, path });
  };

  // Dipanggil dari tombol "Ya, Hapus" di ConfirmModal — baru benar-benar menghapus.
  const confirmDeleteNode = () => {
    if (!confirmDelete) return;

    deleteNodeInTree(confirmDelete.level, confirmDelete.path);
    setConfirmDelete(null);
    setDetail(null);
  };

  const cancelDeleteNode = () => setConfirmDelete(null);

  /* =======================================================
     TAMBAH DATA
  ======================================================= */

  const addData = ({ level, form, intermediateId, immediateId, outputId, year: selectedYear }) => {
    setData((current) =>
      current.map((renstra) => {
        if (renstra.year !== selectedYear) return renstra;

        if (level === "INTERMEDIATE OUTCOME") {
          return {
            ...renstra,
            intermediates: [
              ...renstra.intermediates,
              {
                id: createId("intermediate"),
                title: form.title,
                sasaran: form.sasaran,
                indicator: form.indicator,
                target: form.target,
                immediates: [],
              },
            ],
          };
        }

        if (level === "IMMEDIATE OUTCOME") {
          return {
            ...renstra,
            intermediates: renstra.intermediates.map((intermediate) =>
              intermediate.id === intermediateId
                ? {
                    ...intermediate,
                    immediates: [
                      ...intermediate.immediates,
                      {
                        id: createId("immediate"),
                        title: form.title,
                        program: form.program,
                        nomenklaturSipd: form.nomenklaturSipd,
                        indicator: form.indicator,
                        target: form.target,
                        outputs: [],
                      },
                    ],
                  }
                : intermediate
            ),
          };
        }

        if (level === "OUTPUT") {
          return {
            ...renstra,
            intermediates: renstra.intermediates.map((intermediate) =>
              intermediate.id === intermediateId
                ? {
                    ...intermediate,
                    immediates: intermediate.immediates.map((immediate) =>
                      immediate.id === immediateId
                        ? {
                            ...immediate,
                            outputs: [
                              ...immediate.outputs,
                              {
                                id: createId("output"),
                                title: form.title,
                                kegiatan: form.kegiatan,
                                nomenklaturSipd: form.nomenklaturSipd,
                                indicator: form.indicator,
                                target: form.target,
                                subKegiatan: [],
                              },
                            ],
                          }
                        : immediate
                    ),
                  }
                : intermediate
            ),
          };
        }

        if (level === "SUB KEGIATAN") {
          return {
            ...renstra,
            intermediates: renstra.intermediates.map((intermediate) =>
              intermediate.id === intermediateId
                ? {
                    ...intermediate,
                    immediates: intermediate.immediates.map((immediate) =>
                      immediate.id === immediateId
                        ? {
                            ...immediate,
                            outputs: immediate.outputs.map((output) =>
                              output.id === outputId
                                ? {
                                    ...output,
                                    subKegiatan: [
                                      ...output.subKegiatan,
                                      {
                                        id: createId("sub"),
                                        title: form.title,
                                        nomenklaturSipd: form.nomenklaturSipd,
                                        indicator: form.indicator,
                                        target: form.target,
                                      },
                                    ],
                                  }
                                : output
                            ),
                          }
                        : immediate
                    ),
                  }
                : intermediate
            ),
          };
        }

        return renstra;
      })
    );

    setShowAdd(false);
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
              Pengelolaan hierarki rencana strategis organisasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportRenstraToExcel(filteredData, year)}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Export ke Excel
            </button>

            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-md bg-blue-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
            >
              <Plus className="h-4 w-4" />
              Tambah Data
            </button>
          </div>
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
              className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
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
                Setiap Ultimate Outcome dapat memiliki beberapa Intermediate Outcome. Setiap
                Intermediate Outcome dapat memiliki beberapa Immediate Outcome, Output, dan
                Output/ Input. Klik <b>Lihat Detail</b> untuk melihat, mengedit, atau menghapus
                data.
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
          canDelete={detail.level !== "ULTIMATE OUTCOME"}
          onClose={closeDetail}
          onEdit={() => openEdit(detail.data, detail.level, detail.path)}
          onDelete={() => deleteFromDetail(detail.level, detail.path)}
        />
      )}

      {/* EDIT MODAL */}
      {editData && (
        <FormModal
          mode="edit"
          data={editData.data}
          level={editData.level}
          onClose={closeEdit}
          onSave={saveEdit}
        />
      )}

      {/* ADD MODAL */}
      {showAdd && filteredData[0] && (
        <AddDataModal
          data={filteredData[0]}
          year={year}
          onClose={() => setShowAdd(false)}
          onAdd={addData}
        />
      )}

      {/* CONFIRM DELETE MODAL — pengganti window.confirm() */}
      <ConfirmModal
        open={!!confirmDelete}
        onCancel={cancelDeleteNode}
        onConfirm={confirmDeleteNode}
      />
    </>
  );
}

export default PohonRenstra;