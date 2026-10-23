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
  { key: "kegiatan", label: "Kegiatan", width: 32 },
  { key: "subKegiatan", label: "Sub Kegiatan", width: 36 },
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
  if (report.kategori === "renstra") {
    exportRenstraExcel(report.data.rows, meta.tahun);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromReport(report, meta), safeSheetName(report.sheetName || report.nama, new Set()));
  XLSX.writeFile(wb, `${slug(report.nama)}-${meta.tahun}.xlsx`);
}

export function exportAllExcel(reports, meta) {
  const targets = reports.filter((r) => r.data.total > 0);
  const list = targets.length > 0 ? targets : reports;
  list.forEach((report, idx) => {
    setTimeout(() => {
      exportReportExcel(report, meta);
    }, idx * 250);
  });
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
   Identik dengan tampilan Export PDF di halaman Pohon Kinerja
   (#performance-tree + TreeNode + TreeConnectors SVG + zoom 0.7).
========================================================= */

const PK_PALETTE = {
  ULTIMATE:     { border: "#f87171", head: "#ef4444", label: "#ef4444" },
  INTERMEDIATE: { border: "#60a5fa", head: "#2563eb", label: "#2563eb" },
  IMMEDIATE:    { border: "#34d399", head: "#059669", label: "#059669" },
  OUTPUT:       { border: "#fbbf24", head: "#f59e0b", label: "#d97706" },
};

function renderPkTreeNode(level, node, nodeId) {
  const colors = PK_PALETTE[level] || PK_PALETTE.INTERMEDIATE;
  const title =
    level === "INTERMEDIATE"
      ? node.sasaran || node.title || "-"
      : node.title || "-";

  const bidangLabel =
    level === "INTERMEDIATE" && node.bidang
      ? `Bidang ${BIDANG_LABEL[node.bidang] || node.bidang}`
      : null;

  const bidangHtml = bidangLabel
    ? `<span class="pk-bidang">${esc(bidangLabel)}</span>`
    : "";

  let indicatorList = [];
  if (level === "INTERMEDIATE" && Array.isArray(node.indicators)) {
    indicatorList = node.indicators
      .map((r) => String(typeof r === "object" ? r?.indicator ?? "" : r ?? "").trim())
      .filter(Boolean);
  }

  let indicatorHtml;
  if (level === "INTERMEDIATE" && indicatorList.length > 1) {
    indicatorHtml = `<div class="pk-ind-list">${indicatorList
      .map(
        (ind, idx) =>
          `<div class="pk-ind-row"><span class="pk-ind-num">${idx + 1}.</span><span class="pk-ind-txt">${esc(ind)}</span></div>`,
      )
      .join("")}</div>`;
  } else {
    const singleInd =
      level === "INTERMEDIATE"
        ? indicatorList[0] || node.indicator || "Belum ada indikator"
        : node.indicator || "Belum ada indikator";
    indicatorHtml = `<span class="pk-ind-single">${esc(singleInd)}</span>`;
  }

  return `<div data-node-id="${esc(nodeId)}" class="pk-node" style="border-color:${colors.border}">
    <span class="pk-level" style="color:${colors.label}">${esc(level)}</span>
    <span class="pk-head" style="background:${colors.head}">${esc(title)}</span>
    ${bidangHtml}
    ${indicatorHtml}
  </div>`;
}

export function printPohonKinerjaTree(ultimates, meta) {
  if (!ultimates || ultimates.length === 0) {
    alert("Belum ada data Pohon Kinerja untuk dicetak.");
    return;
  }

  const u = ultimates[0];
  const ultimateId = `ultimate-${u.id || 1}`;
  const intermediates = u.intermediates || [];
  const edges = [];

  const branchesHtml = intermediates
    .map((it, itIdx) => {
      const intId = `intermediate-${it.id || itIdx}`;
      edges.push({ fromId: ultimateId, toId: intId, orthogonal: true, hasArrow: true });

      const immediates = it.immediates || [];
      const immediatesHtml =
        immediates.length > 0
          ? `<div class="pk-imm-row">${immediates
              .map((im, imIdx) => {
                const immId = `immediate-${im.id || `${itIdx}-${imIdx}`}`;
                edges.push({ fromId: intId, toId: immId, orthogonal: true, hasArrow: true });

                const outputs = im.outputs || [];
                const outputsHtml =
                  outputs.length > 0
                    ? `<div class="pk-out-col">${outputs
                        .map((o, oIdx) => {
                          const outId = `output-${o.id || `${itIdx}-${imIdx}-${oIdx}`}`;
                          edges.push({
                            fromId: immId,
                            toId: outId,
                            orthogonal: false,
                            hasArrow: true,
                          });
                          return `<div class="pk-out-item">${renderPkTreeNode("OUTPUT", o, outId)}</div>`;
                        })
                        .join("")}</div>`
                    : "";

                return `<div class="pk-imm-col">${renderPkTreeNode("IMMEDIATE", im, immId)}${outputsHtml}</div>`;
              })
              .join("")}</div>`
          : "";

      return `<div class="pk-branch-col">
        <div style="height:20px;flex-shrink:0"></div>
        ${renderPkTreeNode("INTERMEDIATE", it, intId)}
        <div style="margin:20px 0;height:20px;flex-shrink:0"></div>
        ${immediatesHtml}
      </div>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8" />
<title>Pohon Kinerja ${esc(meta.tahun)}</title>
<style>
  @page { size: landscape; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body {
    margin: 0;
    padding: 0;
    background: #f7fbff;
    color: #0b1c30;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }
  #performance-tree {
    width: 100%;
    overflow: visible;
    background: #f7fbff;
  }
  #tree-zoom-target {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: max-content;
    min-width: 0;
    padding: 32px 32px 80px 32px;
  }
  .pk-banner {
    position: relative;
    margin: 0 auto 32px auto;
    display: flex;
    width: 288px;
    flex-direction: column;
    align-items: center;
    border-radius: 8px;
    border: 2px solid #34d399;
    background: #ffffff;
    padding: 16px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .pk-banner-title {
    margin-bottom: 4px;
    font-weight: 700;
    font-size: 16px;
    color: #059669;
  }
  .pk-banner-unit {
    font-size: 12px;
    font-weight: 700;
    color: #0b1c30;
  }
  .pk-banner-year {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }
  .pk-ult-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pk-branches-row {
    position: relative;
    display: flex;
    justify-content: center;
    gap: 32px;
    padding-top: 20px;
  }
  .pk-branch-col {
    position: relative;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
  }
  .pk-imm-row {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    gap: 24px;
  }
  .pk-imm-col {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pk-out-col {
    margin-top: 20px;
    padding-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .pk-out-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pk-node {
    position: relative;
    display: flex;
    width: 250px;
    flex-direction: column;
    overflow: visible;
    border-radius: 8px;
    border: 2px solid #60a5fa;
    background: #ffffff;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .pk-level {
    position: absolute;
    left: -28px;
    top: 50%;
    transform: translateY(-50%) rotate(180deg);
    writing-mode: vertical-rl;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.14em;
  }
  .pk-head {
    min-height: 48px;
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  .pk-bidang {
    border-top: 1px solid #dbeafe;
    background: rgba(239, 246, 255, 0.9);
    padding: 4px 8px;
    font-size: 9px;
    font-weight: 700;
    color: #1e40af;
  }
  .pk-ind-single {
    min-height: 37px;
    border-top: 1px solid #e2e8f0;
    padding: 8px 12px;
    font-size: 10px;
    line-height: 1.25;
    color: #475569;
    white-space: pre-line;
    text-align: center;
  }
  .pk-ind-list {
    min-height: 37px;
    border-top: 1px solid #e2e8f0;
    padding: 8px 12px;
    font-size: 10px;
    line-height: 1.25;
    color: #475569;
    text-align: left;
  }
  .pk-ind-row {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .pk-ind-row + .pk-ind-row {
    margin-top: 4px;
  }
  .pk-ind-num {
    font-weight: 700;
    color: #1d4ed8;
    flex-shrink: 0;
  }
  .pk-ind-txt {
    word-break: break-word;
  }
  #pk-svg {
    pointer-events: none;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  @media print {
    body { background: #ffffff; overflow: visible !important; }
    #performance-tree { background: #ffffff; }
    #tree-zoom-target {
      width: max-content !important;
      min-width: 0 !important;
      zoom: 0.7;
      transform-origin: top left;
    }
  }
</style>
</head>
<body>
  <div id="performance-tree">
    <div id="tree-zoom-target">
      <svg id="pk-svg">
        <defs>
          <marker id="tree-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>

      <div class="pk-banner">
        <div class="pk-banner-title">POHON KINERJA</div>
        <div class="pk-banner-unit">${esc((meta.unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA").toUpperCase())}</div>
        <div class="pk-banner-year">TAHUN ${esc(meta.tahun)}</div>
      </div>

      <div class="pk-ult-wrap">
        ${renderPkTreeNode("ULTIMATE", u, ultimateId)}
        <div style="height:32px"></div>
      </div>

      <div class="pk-branches-row">
        ${branchesHtml}
      </div>
    </div>
  </div>

  <script>
    (function () {
      var edges = ${JSON.stringify(edges)};
      function getRelRect(el, container) {
        var x = 0;
        var y = 0;
        var cur = el;
        while (cur && cur !== container) {
          x += cur.offsetLeft;
          y += cur.offsetTop;
          cur = cur.offsetParent;
        }
        return {
          left: x,
          top: y,
          width: el.offsetWidth,
          height: el.offsetHeight,
          bottom: y + el.offsetHeight,
        };
      }

      function drawConnectors() {
        var container = document.getElementById("tree-zoom-target");
        var svg = document.getElementById("pk-svg");
        if (!container || !svg) return;
        var w = container.offsetWidth || container.scrollWidth;
        var h = container.offsetHeight || container.scrollHeight;
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        svg.setAttribute("preserveAspectRatio", "none");

        var oldLines = svg.querySelectorAll(".pk-edge");
        oldLines.forEach(function (el) { el.remove(); });

        var ns = "http://www.w3.org/2000/svg";
        edges.forEach(function (edge) {
          var a = container.querySelector('[data-node-id="' + edge.fromId + '"]');
          var b = container.querySelector('[data-node-id="' + edge.toId + '"]');
          if (!a || !b) return;
          var rectA = getRelRect(a, container);
          var rectB = getRelRect(b, container);
          var x1 = rectA.left + rectA.width / 2;
          var y1 = rectA.bottom;
          var x2 = rectB.left + rectB.width / 2;
          var y2 = rectB.top;

          if (edge.orthogonal) {
            var midY = (y1 + y2) / 2;
            var path = document.createElementNS(ns, "path");
            path.setAttribute("class", "pk-edge");
            path.setAttribute("d", "M " + x1 + " " + y1 + " L " + x1 + " " + midY + " L " + x2 + " " + midY + " L " + x2 + " " + y2);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#94a3b8");
            path.setAttribute("stroke-width", "1.5");
            if (edge.hasArrow !== false) path.setAttribute("marker-end", "url(#tree-arrow)");
            svg.appendChild(path);
          } else {
            var line = document.createElementNS(ns, "line");
            line.setAttribute("class", "pk-edge");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("stroke", "#94a3b8");
            line.setAttribute("stroke-width", "1.5");
            if (edge.hasArrow !== false) line.setAttribute("marker-end", "url(#tree-arrow)");
            svg.appendChild(line);
          }
        });
      }

      window.addEventListener("resize", drawConnectors);
      window.addEventListener("beforeprint", drawConnectors);
      if (typeof ResizeObserver !== "undefined") {
        var ro = new ResizeObserver(drawConnectors);
        var target = document.getElementById("tree-zoom-target");
        if (target) ro.observe(target);
      }

      window.onload = function () {
        drawConnectors();
        setTimeout(function () {
          drawConnectors();
          window.focus();
          window.print();
        }, 100);
      };
    })();
  </script>
</body></html>`;

  const win = window.open("", "_blank", "width=1400,height=900");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.");
    return;
  }
  win.document.open();
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

