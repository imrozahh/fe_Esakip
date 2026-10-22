import * as XLSX from "xlsx-js-style";

/* =========================================================
   KONSTANTA & HELPER
========================================================= */

export const DAFTAR_TRIWULAN = [
  { id: 1, nama: "Triwulan I", singkatan: "TW I", rentang: "Januari - Maret" },
  { id: 2, nama: "Triwulan II", singkatan: "TW II", rentang: "April - Juni" },
  { id: 3, nama: "Triwulan III", singkatan: "TW III", rentang: "Juli - September" },
  { id: 4, nama: "Triwulan IV", singkatan: "TW IV", rentang: "Oktober - Desember" },
];

export const BIDANG_LABEL = {
  komunikasi: "Komunikasi",
  statistik: "Statistik",
  persandian: "Persandian",
  aplikasi: "Aplikasi",
  kesekretariatan: "Kesekretariatan",
};

const toNum = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const pct = (part, whole) => (whole > 0 ? round2((part / whole) * 100) : 0);

export function formatRupiah(v) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNum(v));
}

export function formatNumber(v) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(toNum(v));
}

/** Format nilai sel sesuai tipe kolom (untuk tampilan layar / cetak). */
export function formatCell(value, type) {
  if (value === null || value === undefined || value === "") return "-";
  switch (type) {
    case "currency":
      return formatRupiah(value);
    case "number":
      return formatNumber(value);
    case "percent":
      return `${formatNumber(value)}%`;
    default:
      return String(value);
  }
}

export function kategoriCapaian(persen, hasValue = true) {
  if (!hasValue) return "Belum Diisi";
  if (persen >= 75) return "Tercapai";
  if (persen >= 50) return "Sedang";
  return "Rendah";
}

const getTriwulan = (list, periode) =>
  (list || []).find((c) => Number(c.periode ?? c.bulan) === periode) || null;

/* =========================================================
   STATUS KELENGKAPAN
========================================================= */

export function hitungStatus(filled, total, mode = "isian") {
  if (total === 0) {
    return { label: "Tidak Ada Data", tone: "rose", persen: 0 };
  }
  if (mode === "master") {
    return { label: "Tersedia", tone: "green", persen: 100 };
  }
  const persen = pct(filled, total);
  if (filled >= total) return { label: "Lengkap", tone: "green", persen: 100 };
  if (filled > 0) return { label: "Sebagian", tone: "amber", persen };
  return { label: "Belum Diisi", tone: "slate", persen: 0 };
}

/* =========================================================
   BUILDER: POHON KINERJA
   (Ultimate -> Intermediate -> Immediate -> Output)
========================================================= */

export function buildPohonKinerja(ultimates = []) {
  const columns = [
    { key: "no", label: "No", align: "center", width: 5, mergeBy: "_gInt" },
    { key: "ultimate", label: "Ultimate Outcome", width: 30, mergeBy: "_gUlt" },
    { key: "sasaran", label: "Intermediate Outcome (Sasaran)", width: 34, mergeBy: "_gInt" },
    { key: "bidang", label: "Bidang", width: 16, mergeBy: "_gInt" },
    { key: "indikatorSasaran", label: "Indikator Sasaran", width: 36, mergeBy: "_gInt" },
    { key: "immediate", label: "Immediate Outcome", width: 34, mergeBy: "_gImm" },
    { key: "output", label: "Output", width: 34 },
  ];

  const rows = [];
  let noSasaran = 0;

  ultimates.forEach((u) => {
    const intermediates = u.intermediates || [];
    if (intermediates.length === 0) {
      rows.push({ _gUlt: `u${u.id}`, _gInt: `u${u.id}-x`, _gImm: `u${u.id}-x-x`, ultimate: u.title });
      return;
    }

    intermediates.forEach((it) => {
      noSasaran += 1;
      const gInt = `u${u.id}-i${it.id}`;
      const indikator = (it.indicators || [])
        .map((r) => r.indicator)
        .filter(Boolean)
        .join("\n");
      const base = {
        _gUlt: `u${u.id}`,
        _gInt: gInt,
        no: noSasaran,
        ultimate: u.title,
        sasaran: it.sasaran || it.title,
        bidang: BIDANG_LABEL[it.bidang] || it.bidang || "-",
        indikatorSasaran: indikator,
      };

      const immediates = it.immediates || [];
      if (immediates.length === 0) {
        rows.push({ ...base, _gImm: `${gInt}-x` });
        return;
      }

      immediates.forEach((im) => {
        const gImm = `${gInt}-m${im.id}`;
        const outputs = im.outputs || [];
        if (outputs.length === 0) {
          rows.push({ ...base, _gImm: gImm, immediate: im.title });
          return;
        }
        outputs.forEach((o) => {
          rows.push({ ...base, _gImm: gImm, immediate: im.title, output: o.title });
        });
      });
    });
  });

  const totalSasaran = ultimates.reduce((s, u) => s + (u.intermediates || []).length, 0);

  return { columns, rows, total: totalSasaran, filled: totalSasaran };
}

/* =========================================================
   BUILDER: RENCANA STRATEGIS (RENSTRA / CASCADING)
   Format 24 kolom — sama persis dengan export Excel di halaman
   Rencana Strategis (PohonRenstra).
========================================================= */

// Helper: gabungkan target + satuan jadi satu string.
const fmtTS = (target, satuan) =>
  [target, satuan]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join(" ");

const EMPTY_IMMEDIATE = {
  title: "", program: "", nomenklaturSipd: "", indicator: "", target: "", outputs: [],
};
const EMPTY_OUTPUT = {
  title: "", kegiatan: "", nomenklaturSipd: "", indicator: "", target: "",
  outputInput: "", anggaran: undefined, subKegiatan: [],
};

export function buildRenstra(ultimates = []) {
  const columns = [
    { key: "ultimateOutcome", label: "Ultimate Outcome", width: 18, mergeBy: "_gUlt" },
    { key: "tujuan", label: "Tujuan", width: 14, mergeBy: "_gUlt" },
    { key: "indikatorUlt", label: "Indikator", width: 14, mergeBy: "_gUlt" },
    { key: "targetUlt", label: "Target/ Satuan", width: 18, align: "center", mergeBy: "_gUlt" },
    { key: "intermediateOutcome", label: "Intermediate Outcome", width: 38, mergeBy: "_gInt" },
    { key: "sasaran", label: "Sasaran", width: 30, mergeBy: "_gInt" },
    { key: "indikatorInt", label: "Indikator", width: 13, mergeBy: "_gIntInd" },
    { key: "targetInt", label: "Target/ Satuan", width: 18, align: "center", mergeBy: "_gIntInd" },
    { key: "immediateOutcome", label: "Immediate Outcome", width: 26, mergeBy: "_gImm" },
    { key: "program", label: "Program", width: 21, mergeBy: "_gImm" },
    { key: "nomenklaturImm", label: "Nomenklatur SIPD", width: 19, mergeBy: "_gImm" },
    { key: "indikatorImm", label: "Indikator", width: 18, mergeBy: "_gImm" },
    { key: "targetImm", label: "Target/ Satuan", width: 19, align: "center", mergeBy: "_gImm" },
    { key: "output", label: "Output", width: 27 },
    { key: "kegiatan", label: "Kegiatan", width: 23 },
    { key: "nomenklaturOut", label: "Nomenklatur SIPD", width: 21 },
    { key: "indikatorOut", label: "Indikator", width: 17 },
    { key: "targetOut", label: "Target/ Satuan", width: 18, align: "center" },
    { key: "outputInput", label: "Output/ Input", width: 20 },
    { key: "anggaran", label: "Anggaran", width: 17, align: "right", type: "currency" },
    { key: "subKegiatan", label: "Sub Kegiatan", width: 20 },
    { key: "nomenklaturSub", label: "Nomenklatur SIPD", width: 19 },
    { key: "indikatorSub", label: "Indikator", width: 26 },
    { key: "targetSub", label: "Target/ Satuan", width: 17, align: "center" },
  ];

  const rows = [];
  let totalAnggaran = 0;

  ultimates.forEach((u) => {
    const intermediates = u.intermediates || [];
    if (intermediates.length === 0) {
      rows.push({
        _gUlt: `u${u.id}`, _gInt: `u${u.id}-x`, _gIntInd: `u${u.id}-x`, _gImm: `u${u.id}-x-x`,
        ultimateOutcome: u.title, tujuan: u.tujuan, indikatorUlt: u.indicator, targetUlt: u.target,
      });
      return;
    }

    intermediates.forEach((it) => {
      const gInt = `u${u.id}-i${it.id}`;
      const indicators = it.indicators || [];

      // Kumpulkan semua leaf (Immediate→Output) di bawah intermediate ini
      const leaves = [];
      const immediates = (it.immediates || []).length ? it.immediates : [EMPTY_IMMEDIATE];
      immediates.forEach((im) => {
        const outputs = (im.outputs || []).length ? im.outputs : [EMPTY_OUTPUT];
        outputs.forEach((o) => leaves.push({ immediate: im, output: o }));
      });

      // Jumlah baris = max(leaves, indicators, 1)
      const totalRows = Math.max(leaves.length, indicators.length, 1);
      while (leaves.length < totalRows) {
        const last = leaves[leaves.length - 1];
        leaves.push({ immediate: last.immediate, output: EMPTY_OUTPUT });
      }

      leaves.forEach(({ immediate: im, output: o }, rowIndex) => {
        // Indikator di-distribute merata ke baris-baris
        const indicatorRow = indicators.length
          ? indicators[Math.floor((rowIndex * indicators.length) / totalRows)]
          : null;
        // Group key per indikator row supaya merge benar
        const indIdx = indicators.length
          ? Math.floor((rowIndex * indicators.length) / totalRows)
          : 0;
        const gIntInd = `${gInt}-ind${indIdx}`;

        const gImm = im.id ? `${gInt}-m${im.id}` : `${gInt}-mx`;
        const sub = (o.subKegiatan || [])[0] || {};
        const anggaran = o.anggaran !== undefined ? toNum(o.anggaran) : null;
        if (anggaran) totalAnggaran += anggaran;

        rows.push({
          _gUlt: `u${u.id}`,
          _gInt: gInt,
          _gIntInd: gIntInd,
          _gImm: gImm,
          ultimateOutcome: u.title || "",
          tujuan: u.tujuan || "",
          indikatorUlt: u.indicator || "",
          targetUlt: u.target || "",
          intermediateOutcome: it.title || "",
          sasaran: it.sasaran || "",
          indikatorInt: indicatorRow?.indicator || "",
          targetInt: indicatorRow ? fmtTS(indicatorRow.target, indicatorRow.satuan) : "",
          immediateOutcome: im.title || "",
          program: im.program || "",
          nomenklaturImm: im.nomenklaturSipd || "",
          indikatorImm: im.indicator || "",
          targetImm: im.target || "",
          output: o.title || "",
          kegiatan: o.kegiatan || "",
          nomenklaturOut: o.nomenklaturSipd || "",
          indikatorOut: o.indicator || "",
          targetOut: o.target || "",
          outputInput: o.outputInput || "",
          anggaran: anggaran ?? "",
          subKegiatan: sub.title || "",
          nomenklaturSub: sub.nomenklaturSipd || "",
          indikatorSub: sub.indicator || "",
          targetSub: sub.target || "",
        });
      });
    });
  });

  return {
    columns,
    rows,
    footer: { label: "TOTAL ANGGARAN", values: { anggaran: totalAnggaran } },
    total: rows.length,
    filled: rows.length,
  };
}

/* =========================================================
   EXPORT EXCEL KHUSUS RENSTRA — CASCADING BERWARNA
   Sama persis dengan format Excel di halaman Rencana Strategis.
========================================================= */

const RENSTRA_HEADER = [
  "Ultimate Outcome", "Tujuan", "Indikator", "Target/ Satuan",
  "Intermediate Outcome", "Sasaran", "Indikator", "Target/ Satuan",
  "Immediate Outcome", "Program", "Nomenklatur SIPD", "Indikator", "Target/ Satuan",
  "Output", "Kegiatan", "Nomenklatur SIPD", "Indikator", "Target/ Satuan",
  "Output/ Input", "Anggaran",
  "Sub Kegiatan", "Nomenklatur SIPD", "Indikator", "Target/ Satuan",
];

const RC_RED = "FFFF5050";
const RC_BLUE = "FF5B9BD5";
const RC_GREEN = "FF92D050";
const RC_ORANGE = "FFFFC000";
const RC_GRAY = "FFD8D8D8";
const RC_YELLOW = "FFFFCC29";

const RENSTRA_HEADER_COLORS = [
  RC_RED, RC_RED, RC_RED, RC_RED,
  RC_BLUE, RC_RED, RC_RED, RC_RED,
  RC_GREEN, RC_BLUE, RC_BLUE, RC_BLUE, RC_BLUE,
  RC_ORANGE, RC_GREEN, RC_GREEN, RC_GREEN, RC_GREEN,
  RC_GRAY, RC_GRAY,
  RC_YELLOW, RC_YELLOW, RC_YELLOW, RC_YELLOW,
];

const RENSTRA_DATA_NAME_COLORS = {
  0: RC_RED,    // Ultimate Outcome
  4: RC_BLUE,   // Intermediate Outcome
  8: RC_GREEN,  // Immediate Outcome
  13: RC_ORANGE, // Output
};

const RENSTRA_COL_WIDTHS = [
  18, 14, 14, 18, 38, 30, 13, 18, 26, 21, 19, 18, 19, 27, 23, 21, 17, 18, 20, 17, 20, 19, 26, 17,
];

const RENSTRA_BORDER = {
  top: { style: "thin", color: { rgb: "FF000000" } },
  bottom: { style: "thin", color: { rgb: "FF000000" } },
  left: { style: "thin", color: { rgb: "FF000000" } },
  right: { style: "thin", color: { rgb: "FF000000" } },
};

function renstraHeaderStyle(bgColor) {
  return {
    fill: { patternType: "solid", fgColor: { rgb: bgColor } },
    font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "FF000000" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: RENSTRA_BORDER,
  };
}

function renstraDataStyle(bgColor) {
  return {
    fill: bgColor ? { patternType: "solid", fgColor: { rgb: bgColor } } : { patternType: "none" },
    font: { sz: 11, name: "Calibri" },
    alignment: { vertical: "top", wrapText: true },
    border: RENSTRA_BORDER,
  };
}

const RENSTRA_COL_KEYS = [
  "ultimateOutcome", "tujuan", "indikatorUlt", "targetUlt",
  "intermediateOutcome", "sasaran", "indikatorInt", "targetInt",
  "immediateOutcome", "program", "nomenklaturImm", "indikatorImm", "targetImm",
  "output", "kegiatan", "nomenklaturOut", "indikatorOut", "targetOut",
  "outputInput", "anggaran",
  "subKegiatan", "nomenklaturSub", "indikatorSub", "targetSub",
];

const ANGGARAN_COL_IDX = 19;

export function exportRenstraExcel(renstraRows, year) {
  const dataRows = renstraRows.map((row) =>
    RENSTRA_COL_KEYS.map((key) => {
      const v = row[key];
      if (v === null || v === undefined || v === "") return "";
      return v;
    })
  );

  const sheetData = [RENSTRA_HEADER, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  for (let r = 0; r < sheetData.length; r++) {
    for (let c = 0; c < RENSTRA_HEADER.length; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      ws[ref].s = r === 0
        ? renstraHeaderStyle(RENSTRA_HEADER_COLORS[c])
        : renstraDataStyle(RENSTRA_DATA_NAME_COLORS[c]);

      // Kolom Anggaran: format angka
      if (r > 0 && c === ANGGARAN_COL_IDX) {
        ws[ref].s.numFmt = "#,##0";
        if (typeof ws[ref].v === "number") ws[ref].t = "n";
      }
    }
  }

  ws["!cols"] = RENSTRA_COL_WIDTHS.map((wch) => ({ wch }));
  ws["!rows"] = [{ hpt: 30 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "CASECADING");
  XLSX.writeFile(wb, `casecading-renstra-${year}.xlsx`);
}

/* =========================================================
   BUILDER: CAPAIAN KINERJA
========================================================= */

function withSasaranGroup(items) {
  // Nomor urut per sasaran (intermediate) + group id untuk merge sel
  let no = 0;
  let lastId = null;
  return items.map((it) => {
    if (it.id !== lastId) {
      no += 1;
      lastId = it.id;
    }
    return { item: it, no, gInt: `i${it.id}` };
  });
}

export function buildCapaianTriwulan(items = [], periode) {
  const tw = DAFTAR_TRIWULAN.find((t) => t.id === periode);
  const columns = [
    { key: "no", label: "No", align: "center", width: 5, mergeBy: "_gInt" },
    { key: "sasaran", label: "Sasaran Strategis", width: 34, mergeBy: "_gInt" },
    { key: "indikator", label: "Indikator Kinerja", width: 36 },
    { key: "target", label: "Target", align: "center", width: 10, type: "number" },
    { key: "satuan", label: "Satuan", align: "center", width: 12 },
    { key: "realisasi", label: `Realisasi ${tw.singkatan}`, align: "center", width: 14, type: "number" },
    { key: "persen", label: `% Capaian ${tw.singkatan}`, align: "center", width: 14, type: "percent" },
    { key: "kumulatif", label: `Kumulatif s.d. ${tw.singkatan}`, align: "center", width: 16, type: "number" },
    { key: "persenKumulatif", label: "% Kumulatif", align: "center", width: 13, type: "percent" },
    { key: "keterangan", label: "Keterangan", width: 30 },
  ];

  let filled = 0;
  const rows = withSasaranGroup(items).map(({ item, no, gInt }) => {
    const target = toNum(item.target);
    const cell = getTriwulan(item.capaian_triwulan, periode);
    const hasValue = cell && cell.realisasi !== null && cell.realisasi !== undefined;
    if (hasValue) filled += 1;

    let kumulatif = 0;
    let adaKumulatif = false;
    for (let p = 1; p <= periode; p += 1) {
      const c = getTriwulan(item.capaian_triwulan, p);
      if (c && c.realisasi !== null && c.realisasi !== undefined) {
        kumulatif += toNum(c.realisasi);
        adaKumulatif = true;
      }
    }

    return {
      _gInt: gInt,
      no,
      sasaran: item.sasaran,
      indikator: item.indikator,
      target: target || null,
      satuan: item.satuan,
      realisasi: hasValue ? toNum(cell.realisasi) : null,
      persen: hasValue ? pct(toNum(cell.realisasi), target) : null,
      kumulatif: adaKumulatif ? round2(kumulatif) : null,
      persenKumulatif: adaKumulatif ? pct(kumulatif, target) : null,
      keterangan: hasValue ? cell.keterangan : null,
    };
  });

  return { columns, rows, total: items.length, filled };
}

export function buildCapaianTahunan(items = []) {
  const columns = [
    { key: "no", label: "No", align: "center", width: 5, mergeBy: "_gInt" },
    { key: "sasaran", label: "Sasaran Strategis", width: 34, mergeBy: "_gInt" },
    { key: "indikator", label: "Indikator Kinerja", width: 36 },
    { key: "target", label: "Target", align: "center", width: 10, type: "number" },
    { key: "satuan", label: "Satuan", align: "center", width: 12 },
    ...DAFTAR_TRIWULAN.map((t) => ({
      key: `tw${t.id}`,
      label: t.singkatan,
      align: "center",
      width: 10,
      type: "number",
    })),
    { key: "total", label: "Total Realisasi", align: "center", width: 14, type: "number" },
    { key: "persen", label: "% Capaian", align: "center", width: 12, type: "percent" },
    { key: "kategori", label: "Kategori", align: "center", width: 14 },
  ];

  let filled = 0;
  const rows = withSasaranGroup(items).map(({ item, no, gInt }) => {
    const target = toNum(item.target);
    const row = {
      _gInt: gInt,
      no,
      sasaran: item.sasaran,
      indikator: item.indikator,
      target: target || null,
      satuan: item.satuan,
    };
    let total = 0;
    let adaIsi = false;
    DAFTAR_TRIWULAN.forEach((t) => {
      const c = getTriwulan(item.capaian_triwulan, t.id);
      if (c && c.realisasi !== null && c.realisasi !== undefined) {
        row[`tw${t.id}`] = toNum(c.realisasi);
        total += toNum(c.realisasi);
        adaIsi = true;
        filled += 1;
      } else {
        row[`tw${t.id}`] = null;
      }
    });
    const persen = pct(total, target);
    row.total = adaIsi ? round2(total) : null;
    row.persen = adaIsi ? persen : null;
    row.kategori = kategoriCapaian(persen, adaIsi);
    return row;
  });

  return { columns, rows, total: items.length * 4, filled };
}

/* =========================================================
   BUILDER: REALISASI ANGGARAN
========================================================= */

const realisasiBaseColumns = [
  { key: "no", label: "No", align: "center", width: 5 },
  { key: "subKegiatan", label: "Sub Kegiatan", width: 36 },
  { key: "kegiatan", label: "Kegiatan", width: 32 },
  { key: "bidang", label: "Bidang", width: 15, align: "center" },
  { key: "pagu", label: "Pagu Anggaran (Rp)", width: 20, align: "right", type: "currency" },
];

export function buildRealisasiTriwulan(outputs = [], periode) {
  const tw = DAFTAR_TRIWULAN.find((t) => t.id === periode);
  const columns = [
    ...realisasiBaseColumns,
    { key: "realisasi", label: `Realisasi ${tw.singkatan} (Rp)`, width: 20, align: "right", type: "currency" },
    { key: "persen", label: "% thd Pagu", width: 12, align: "center", type: "percent" },
    { key: "kumulatif", label: `Kumulatif s.d. ${tw.singkatan} (Rp)`, width: 22, align: "right", type: "currency" },
    { key: "persenKumulatif", label: "% Kumulatif", width: 12, align: "center", type: "percent" },
    { key: "keterangan", label: "Keterangan", width: 28 },
  ];

  let filled = 0;
  let sumPagu = 0;
  let sumReal = 0;
  let sumKum = 0;

  const rows = outputs.map((o, idx) => {
    const pagu = toNum(o.pagu);
    const cell = getTriwulan(o.realisasi_triwulan, periode);
    const hasValue = cell && cell.realisasi !== null && cell.realisasi !== undefined;
    if (hasValue) filled += 1;

    let kumulatif = 0;
    for (let p = 1; p <= periode; p += 1) {
      const c = getTriwulan(o.realisasi_triwulan, p);
      if (c && c.realisasi !== null) kumulatif += toNum(c.realisasi);
    }

    sumPagu += pagu;
    sumReal += hasValue ? toNum(cell.realisasi) : 0;
    sumKum += kumulatif;

    return {
      no: idx + 1,
      subKegiatan: o.sub_kegiatan || "-",
      kegiatan: o.kegiatan,
      bidang: BIDANG_LABEL[o.bidang] || o.bidang,
      pagu,
      realisasi: hasValue ? toNum(cell.realisasi) : null,
      persen: hasValue ? pct(toNum(cell.realisasi), pagu) : null,
      kumulatif,
      persenKumulatif: pct(kumulatif, pagu),
      keterangan: hasValue ? cell.keterangan : null,
    };
  });

  return {
    columns,
    rows,
    footer: {
      label: "TOTAL",
      values: {
        pagu: sumPagu,
        realisasi: sumReal,
        persen: pct(sumReal, sumPagu),
        kumulatif: sumKum,
        persenKumulatif: pct(sumKum, sumPagu),
      },
    },
    total: outputs.length,
    filled,
  };
}

export function buildRealisasiTahunan(outputs = []) {
  const columns = [
    ...realisasiBaseColumns,
    ...DAFTAR_TRIWULAN.map((t) => ({
      key: `tw${t.id}`,
      label: `${t.singkatan} (Rp)`,
      width: 18,
      align: "right",
      type: "currency",
    })),
    { key: "total", label: "Total Realisasi (Rp)", width: 20, align: "right", type: "currency" },
    { key: "sisa", label: "Sisa Anggaran (Rp)", width: 20, align: "right", type: "currency" },
    { key: "persen", label: "% Serapan", width: 12, align: "center", type: "percent" },
  ];

  let filled = 0;
  const sums = { pagu: 0, tw1: 0, tw2: 0, tw3: 0, tw4: 0, total: 0, sisa: 0 };

  const rows = outputs.map((o, idx) => {
    const pagu = toNum(o.pagu);
    const row = {
      no: idx + 1,
      subKegiatan: o.sub_kegiatan || "-",
      kegiatan: o.kegiatan,
      bidang: BIDANG_LABEL[o.bidang] || o.bidang,
      pagu,
    };
    let total = 0;
    DAFTAR_TRIWULAN.forEach((t) => {
      const c = getTriwulan(o.realisasi_triwulan, t.id);
      if (c && c.realisasi !== null && c.realisasi !== undefined) {
        row[`tw${t.id}`] = toNum(c.realisasi);
        sums[`tw${t.id}`] += toNum(c.realisasi);
        total += toNum(c.realisasi);
        filled += 1;
      } else {
        row[`tw${t.id}`] = null;
      }
    });
    row.total = total;
    row.sisa = Math.max(0, pagu - total);
    row.persen = pct(total, pagu);

    sums.pagu += pagu;
    sums.total += total;
    sums.sisa += row.sisa;
    return row;
  });

  return {
    columns,
    rows,
    footer: {
      label: "TOTAL",
      values: { ...sums, persen: pct(sums.total, sums.pagu) },
    },
    total: outputs.length * 4,
    filled,
  };
}

/* =========================================================
   MERGE SEL (rowSpan) — dipakai pratinjau, cetak & Excel
========================================================= */

/**
 * Hasilkan matriks rowSpan: spans[rowIdx][colKey] =
 *   >0  -> tampilkan sel dengan rowSpan sebanyak itu
 *    0  -> sel disembunyikan (sudah tergabung dengan baris di atasnya)
 */
export function computeSpans(columns, rows) {
  const spans = rows.map(() => ({}));
  columns.forEach((col) => {
    if (!col.mergeBy) {
      rows.forEach((_, i) => {
        spans[i][col.key] = 1;
      });
      return;
    }
    let i = 0;
    while (i < rows.length) {
      const group = rows[i][col.mergeBy];
      let span = 1;
      while (
        group !== undefined &&
        i + span < rows.length &&
        rows[i + span][col.mergeBy] === group
      ) {
        span += 1;
      }
      spans[i][col.key] = span;
      for (let k = 1; k < span; k += 1) spans[i + k][col.key] = 0;
      i += span;
    }
  });
  return spans;
}

/* =========================================================
   EXPORT EXCEL
========================================================= */

const BORDER = {
  top: { style: "thin", color: { rgb: "94A3B8" } },
  bottom: { style: "thin", color: { rgb: "94A3B8" } },
  left: { style: "thin", color: { rgb: "94A3B8" } },
  right: { style: "thin", color: { rgb: "94A3B8" } },
};

function sheetFromReport(report, meta) {
  const { columns, rows, footer } = report.data;
  const colCount = columns.length;
  const aoa = [];
  const merges = [];

  const kopLines = [
    "PEMERINTAH KABUPATEN MALANG",
    (meta.unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA").toUpperCase(),
    report.nama.toUpperCase(),
    `Tahun ${meta.tahun} — Periode: ${report.periodeLabel}${meta.bidangLabel ? ` — Bidang: ${meta.bidangLabel}` : ""}`,
  ];
  kopLines.forEach((line, r) => {
    aoa.push([line, ...Array(colCount - 1).fill("")]);
    merges.push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
  });
  aoa.push(Array(colCount).fill(""));

  const headerRow = aoa.length;
  aoa.push(columns.map((c) => c.label));

  const dataStart = aoa.length;
  const spans = computeSpans(columns, rows);
  rows.forEach((row, ri) => {
    aoa.push(
      columns.map((c) => {
        const v = row[c.key];
        if (v === null || v === undefined || v === "") return "";
        return v;
      }),
    );
    columns.forEach((c, ci) => {
      const span = spans[ri][c.key];
      if (span > 1) {
        merges.push({ s: { r: dataStart + ri, c: ci }, e: { r: dataStart + ri + span - 1, c: ci } });
      }
    });
  });

  let footerRow = -1;
  if (footer) {
    footerRow = aoa.length;
    const firstValueIdx = columns.findIndex((c) => footer.values[c.key] !== undefined);
    const line = columns.map((c, ci) => {
      if (ci === 0) return footer.label;
      const v = footer.values[c.key];
      return v === undefined ? "" : v;
    });
    aoa.push(line);
    if (firstValueIdx > 1) {
      merges.push({ s: { r: footerRow, c: 0 }, e: { r: footerRow, c: firstValueIdx - 1 } });
    }
  }

  aoa.push(Array(colCount).fill(""));
  aoa.push([
    `Dicetak dari E-SAKIP pada ${meta.tanggalCetak}${meta.dicetakOleh ? ` oleh ${meta.dicetakOleh}` : ""}`,
    ...Array(colCount - 1).fill(""),
  ]);
  merges.push({ s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: colCount - 1 } });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = columns.map((c) => ({ wch: c.width || 15 }));

  // Styling
  for (let r = 0; r < aoa.length; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { t: "s", v: "" };
      const col = columns[c];
      const cell = ws[ref];

      if (r < kopLines.length) {
        cell.s = {
          font: { bold: true, sz: r === 2 ? 13 : 11, color: { rgb: "001E40" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      } else if (r === headerRow) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "001E40" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: BORDER,
        };
      } else if (r >= dataStart && (r < dataStart + rows.length || r === footerRow)) {
        const isFooter = r === footerRow;
        const numFmt =
          col.type === "currency" ? "#,##0" : col.type === "percent" ? '0.00"%"' : col.type === "number" ? "#,##0.##" : undefined;
        cell.s = {
          font: { bold: isFooter, color: { rgb: "0B1C30" } },
          fill: isFooter ? { fgColor: { rgb: "E2E8F0" } } : undefined,
          alignment: {
            horizontal: col.align || "left",
            vertical: "top",
            wrapText: true,
          },
          border: BORDER,
          ...(numFmt && typeof cell.v === "number" ? { numFmt } : {}),
        };
        if (numFmt && typeof cell.v === "number") cell.z = numFmt;
      } else if (r === aoa.length - 1) {
        cell.s = { font: { italic: true, sz: 9, color: { rgb: "64748B" } } };
      }
    }
  }

  return ws;
}

const safeSheetName = (name, used) => {
  let base = name.replace(/[\\/?*[\]:]/g, "").slice(0, 31);
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    const suffix = ` (${i})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
    i += 1;
  }
  used.add(candidate);
  return candidate;
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function exportReportExcel(report, meta) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromReport(report, meta), safeSheetName(report.sheetName || report.nama, new Set()));
  XLSX.writeFile(wb, `${slug(report.nama)}-${meta.tahun}.xlsx`);
}

export function exportAllExcel(reports, meta) {
  const wb = XLSX.utils.book_new();
  const used = new Set();
  reports.forEach((report) => {
    XLSX.utils.book_append_sheet(wb, sheetFromReport(report, meta), safeSheetName(report.sheetName || report.nama, used));
  });
  XLSX.writeFile(wb, `laporan-e-sakip-${meta.tahun}.xlsx`);
}

/* =========================================================
   CETAK / PDF (via dialog print browser)
========================================================= */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* =========================================================
   CETAK POHON KINERJA — FORMAT DIAGRAM POHON (TREE)
   Port langsung dari printTree / printNode di PohonKinerja.jsx.
   Struktur data: ultimates[].intermediates[].immediates[].outputs[]
   (dari endpoint /renstra).
========================================================= */

function printNodeHtml(level, node) {
  const colors = {
    ULTIMATE: ["#ef5b5b", "#ef5b5b"],
    INTERMEDIATE: ["#2563eb", "#2563eb"],
    IMMEDIATE: ["#059669", "#059669"],
    OUTPUT: ["#f59e0b", "#f59e0b"],
  }[level] || ["#2563eb", "#2563eb"];

  const bidangBadge = level === "INTERMEDIATE" && node.bidang
    ? `<div style="padding:4px;background:#e0edff;color:#1e40af;font-size:9px;font-weight:bold;text-transform:capitalize">Bidang ${esc(BIDANG_LABEL[node.bidang] || node.bidang)}</div>`
    : "";

  let indicatorHtml;
  if (level === "INTERMEDIATE" && Array.isArray(node.indicators) && node.indicators.length > 1) {
    indicatorHtml = `<ul style="margin:0;padding-left:14px;text-align:left">${node.indicators.map((r) => `<li>${esc(r.indicator || "")}</li>`).join("")}</ul>`;
  } else if (level === "INTERMEDIATE" && Array.isArray(node.indicators) && node.indicators.length === 1) {
    indicatorHtml = esc(node.indicators[0].indicator || "Belum ada indikator");
  } else {
    indicatorHtml = esc(node.indicator || node.title || "Belum ada indikator");
  }

  const title = level === "INTERMEDIATE" ? (node.title || node.sasaran || "-") : (node.title || "-");

  return `<div class="node" style="border-color:${colors[0]};-webkit-print-color-adjust:exact;print-color-adjust:exact"><div class="head" style="background:${colors[1]};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">${esc(title)}</div>${bidangBadge}<div class="indicator">${indicatorHtml}</div></div>`;
}

export function printPohonKinerjaTree(ultimates, meta) {
  if (!ultimates || ultimates.length === 0) {
    alert("Belum ada data Pohon Kinerja untuk dicetak.");
    return;
  }

  // Untuk setiap Ultimate, kita ambil data pertama saja (biasanya hanya 1 ultimate)
  const u = ultimates[0];
  const intermediates = u.intermediates || [];

  // Bangun kolom per Intermediate (= "branch")
  const childRows = intermediates.map((it) => {
    // Intermediate node
    const intNode = printNodeHtml("INTERMEDIATE", it);

    // Immediate + Output nodes di bawahnya
    const immediates = it.immediates || [];
    const childNodes = immediates.map((im) => {
      const immNode = printNodeHtml("IMMEDIATE", im);
      const outputs = (im.outputs || []).map((o) => printNodeHtml("OUTPUT", o)).join("");
      return immNode + outputs;
    }).join("");

    return `<section class="branch">${intNode}${childNodes}</section>`;
  }).join("");

  // Grid columns: sesuai jumlah intermediate
  const gridCols = Math.max(intermediates.length, 1);

  const html = `<!doctype html><html><head><title>Pohon Kinerja ${esc(meta.tahun)}</title><style>
    *{box-sizing:border-box}
    body{margin:0;padding:28px;background:#f7fbff;color:#0b1c30;font-family:Arial,sans-serif}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    h1{margin:0 0 6px;color:#087f5b;font-size:22px;text-align:center}
    h2{margin:0 0 28px;font-size:13px;text-align:center}
    .root,.node{width:250px;margin:0 auto 22px;border:2px solid #2f6fb3;border-radius:8px;background:#fff;text-align:center;overflow:hidden}
    .root{border-color:#ef6a6a;margin-bottom:28px}
    .head{padding:11px 12px;background:#2f6fb3;color:#fff;font-size:11px;font-weight:bold}
    .root .head{background:#ed5c5c}
    .indicator{padding:9px 12px;border-top:1px solid #dce3ec;font-size:10px}
    .branches{display:grid;grid-template-columns:repeat(${gridCols},1fr);gap:30px;border-top:2px solid #94a3b8;padding-top:18px}
    .branch{position:relative;padding-top:16px}
    .branch:before{content:"";position:absolute;top:0;left:50%;height:16px;border-left:2px solid #94a3b8}
    .branch .node:nth-child(2){border-color:#58b77c}
    .branch .node:nth-child(2) .head{background:#159447}
    .branch .node:nth-child(n+3){border-color:#e8a52d}
    .branch .node:nth-child(n+3) .head{background:#e99b15}
    .meta{text-align:center;margin-top:20px;font-size:9px;color:#64748b;font-style:italic}
    @media print{body{padding:10mm}.branches{gap:12mm}}
  </style></head><body>
    <h1>POHON KINERJA</h1>
    <h2>${esc((meta.unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA").toUpperCase())} &middot; TAHUN ${esc(meta.tahun)}</h2>
    <div class="root">${printNodeHtml("ULTIMATE", u)}</div>
    <div class="branches">${childRows}</div>
    <div class="meta">Dicetak dari E-SAKIP${meta.dicetakOleh ? ` oleh ${esc(meta.dicetakOleh)}` : ""} pada ${esc(meta.tanggalCetak)}</div>
    <script>window.onload=()=>{window.print()}</script>
  </body></html>`;

  const win = window.open("", "_blank", "width=1400,height=900");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function printReport(report, meta) {
  const { columns, rows, footer } = report.data;
  const spans = computeSpans(columns, rows);

  const thead = `<tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr>`;

  const tbody = rows.length
    ? rows
        .map(
          (row, ri) =>
            `<tr>${columns
              .map((c) => {
                const span = spans[ri][c.key];
                if (span === 0) return "";
                return `<td${span > 1 ? ` rowspan="${span}"` : ""} style="text-align:${c.align || "left"}">${esc(
                  formatCell(row[c.key], c.type),
                )}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("")
    : `<tr><td colspan="${columns.length}" style="text-align:center;padding:24px;color:#64748b">Belum ada data untuk laporan ini.</td></tr>`;

  let tfoot = "";
  if (footer && rows.length) {
    const firstValueIdx = columns.findIndex((c) => footer.values[c.key] !== undefined);
    const cells = [`<td colspan="${Math.max(1, firstValueIdx)}" style="text-align:center">${esc(footer.label)}</td>`];
    columns.slice(Math.max(1, firstValueIdx)).forEach((c) => {
      const v = footer.values[c.key];
      cells.push(`<td style="text-align:${c.align || "left"}">${v === undefined ? "" : esc(formatCell(v, c.type))}</td>`);
    });
    tfoot = `<tfoot><tr>${cells.join("")}</tr></tfoot>`;
  }

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8" />
<title>${esc(report.nama)} - ${esc(meta.tahun)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #0b1c30; font-size: 10px; margin: 0; }
  .kop { text-align: center; border-bottom: 3px double #001e40; padding-bottom: 8px; margin-bottom: 12px; }
  .kop h1 { font-size: 14px; margin: 0; letter-spacing: .5px; }
  .kop h2 { font-size: 13px; margin: 2px 0 0; }
  .judul { text-align: center; margin-bottom: 10px; }
  .judul h3 { font-size: 13px; margin: 0; text-transform: uppercase; }
  .judul p { margin: 3px 0 0; color: #334155; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #64748b; padding: 4px 5px; vertical-align: top; white-space: pre-line; }
  th { background: #001e40; color: #fff; font-weight: 600; text-align: center; vertical-align: middle; }
  tfoot td { background: #e2e8f0; font-weight: 700; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .ttd { margin-top: 28px; display: flex; justify-content: flex-end; page-break-inside: avoid; }
  .ttd div { text-align: center; width: 260px; }
  .meta { margin-top: 14px; font-size: 9px; color: #64748b; font-style: italic; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head>
<body>
  <div class="kop">
    <h1>PEMERINTAH KABUPATEN MALANG</h1>
    <h2>${esc((meta.unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA").toUpperCase())}</h2>
  </div>
  <div class="judul">
    <h3>${esc(report.nama)}</h3>
    <p>Tahun ${esc(meta.tahun)} &mdash; Periode: ${esc(report.periodeLabel)}${
      meta.bidangLabel ? ` &mdash; Bidang: ${esc(meta.bidangLabel)}` : ""
    }</p>
  </div>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody>${tfoot}</table>
  <div class="ttd"><div>
    <p>Malang, ${esc(meta.tanggalCetak)}</p>
    <p>Kepala ${esc(meta.unitKerjaTitle || "Dinas Komunikasi dan Informatika")}<br/>Kabupaten Malang</p>
    <br/><br/><br/>
    <p>(.......................................................)<br/>NIP. ..............................................</p>
  </div></div>
  <div class="meta">Dicetak dari E-SAKIP${meta.dicetakOleh ? ` oleh ${esc(meta.dicetakOleh)}` : ""} pada ${esc(meta.tanggalCetak)}</div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;

  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

