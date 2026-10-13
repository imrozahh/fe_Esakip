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
========================================================= */

export function buildRenstra(ultimates = []) {
  const columns = [
    { key: "no", label: "No", align: "center", width: 5 },
    { key: "tujuan", label: "Tujuan", width: 30, mergeBy: "_gUlt" },
    { key: "sasaran", label: "Sasaran Strategis", width: 30, mergeBy: "_gInt" },
    { key: "indikatorSasaran", label: "Indikator Sasaran", width: 32, mergeBy: "_gInt" },
    { key: "targetSasaran", label: "Target Sasaran", width: 16, align: "center", mergeBy: "_gInt" },
    { key: "program", label: "Program", width: 30, mergeBy: "_gImm" },
    { key: "kegiatan", label: "Kegiatan", width: 30 },
    { key: "subKegiatan", label: "Sub Kegiatan", width: 32 },
    { key: "indikatorSub", label: "Indikator Sub Kegiatan", width: 32 },
    { key: "targetSub", label: "Target Sub Kegiatan", width: 16, align: "center" },
    { key: "anggaran", label: "Anggaran (Rp)", width: 20, align: "right", type: "currency" },
  ];

  const rows = [];
  let no = 0;
  let totalAnggaran = 0;

  ultimates.forEach((u) => {
    (u.intermediates || []).forEach((it) => {
      const gInt = `u${u.id}-i${it.id}`;
      const indRows = it.indicators || [];
      const base = {
        _gUlt: `u${u.id}`,
        _gInt: gInt,
        tujuan: u.tujuan || u.title,
        sasaran: it.sasaran || it.title,
        indikatorSasaran: indRows.map((r) => r.indicator).filter(Boolean).join("\n"),
        targetSasaran: indRows
          .map((r) => [r.target, r.satuan].filter(Boolean).join(" "))
          .filter(Boolean)
          .join("\n"),
      };

      const immediates = it.immediates || [];
      if (immediates.length === 0) {
        rows.push({ ...base, _gImm: `${gInt}-x`, no: ++no });
        return;
      }

      immediates.forEach((im) => {
        const gImm = `${gInt}-m${im.id}`;
        const outputs = im.outputs || [];
        if (outputs.length === 0) {
          rows.push({ ...base, _gImm: gImm, no: ++no, program: im.program || im.title });
          return;
        }
        outputs.forEach((o) => {
          const sub = (o.subKegiatan || [])[0] || {};
          const anggaran = toNum(o.anggaran);
          totalAnggaran += anggaran;
          rows.push({
            ...base,
            _gImm: gImm,
            no: ++no,
            program: im.program || im.title,
            kegiatan: o.kegiatan,
            subKegiatan: sub.title,
            indikatorSub: sub.indicator,
            targetSub: sub.target,
            anggaran,
          });
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

