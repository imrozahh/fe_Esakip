import { useState } from "react";

const STORAGE_KEY = "esakip-pohon-kinerja";

const initialTree = {
  title: "TERWUJUDNYA DIGITALISASI ADMINISTRASI PEMERINTAH",
  indicator: "Indeks Pemerintahan Digital",
  branches: [
    {
      id: "statistics",
      title: "MENINGKATNYA PENYELENGGARAAN STATISTIK SEKTORAL",
      indicator: "Indeks Pembangunan Statistik",
      children: [
        { id: "data-quality", level: "IMMEDIATE", title: "MENINGKATNYA KUALITAS DAN AKSES DATA SEKTORAL", indicator: "Persentase Data Statistik Sektoral yang dilakukan Pemutakhiran" },
        { id: "statistics-output", level: "OUTPUT", title: "MENINGKATNYA PERSEBARAN DATA STATISTIK SEKTORAL", indicator: "Indeks Pembangunan Statistik" },
      ],
    },
    {
      id: "security",
      title: "MENINGKATNYA TATA KELOLA KEAMANAN INFORMASI",
      indicator: "Indeks Keamanan Informasi",
      children: [
        { id: "security-response", level: "IMMEDIATE", title: "MENINGKATNYA PENYELESAIAN GANGGUAN KEAMANAN INFORMASI", indicator: "Persentase Gangguan yang diselesaikan" },
        { id: "security-output", level: "OUTPUT", title: "MENINGKATNYA PENANGANAN GANGGUAN KEAMANAN INFORMASI", indicator: "Persentase Gangguan yang ditangani" },
      ],
    },
    {
      id: "public-info",
      title: "MENINGKATNYA KETERBUKAAN INFORMASI PUBLIK",
      indicator: "Indeks Komunikasi Pembangunan dan Informasi Publik",
      children: [
        { id: "public-service", level: "IMMEDIATE", title: "MENINGKATNYA PELAYANAN INFORMASI PUBLIK", indicator: "Persentase Layanan Informasi Publik" },
        { id: "media-access", level: "OUTPUT", title: "MENINGKATNYA AKSES INFORMASI PADA MEDIA KOMUNIKASI PUBLIK", indicator: "Jumlah Konten Informasi yang dipublikasikan" },
        { id: "dissemination", level: "OUTPUT", title: "MENINGKATNYA DISEMINASI INFORMASI", indicator: "Jumlah Lembaga Komunikasi Publik" },
        { id: "public-response", level: "OUTPUT", title: "MENINGKATNYA TANGGAPAN ATAS PERMOHONAN INFORMASI PUBLIK", indicator: "Persentase Permohonan Informasi yang mendapatkan Tanggapan" },
      ],
    },
  ],
};

const palette = {
  ULTIMATE: { border: "border-red-400", head: "bg-red-500", label: "text-red-500" },
  INTERMEDIATE: { border: "border-blue-400", head: "bg-blue-600", label: "text-blue-600" },
  IMMEDIATE: { border: "border-emerald-400", head: "bg-emerald-600", label: "text-emerald-600" },
  OUTPUT: { border: "border-amber-400", head: "bg-amber-500", label: "text-amber-600" },
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function downloadExcel(tree) {
  const rows = [
    ["Level", "Tujuan / Sasaran", "Indikator"],
    ["ULTIMATE", tree.title, tree.indicator],
    ...tree.branches.flatMap((branch) => [
      ["INTERMEDIATE", branch.title, branch.indicator],
      ...branch.children.map((child) => [child.level, child.title, child.indicator]),
    ]),
  ];
  const table = rows.map((row, index) => `<tr>${row.map((cell) => `<${index === 0 ? "th" : "td"}>${escapeHtml(cell)}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
  const excelDocument = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;color:#0b1c30}h1{color:#001e40}table{border-collapse:collapse;width:100%}th{background:#003366;color:white}th,td{border:1px solid #b9d3f5;padding:8px;text-align:left}tr:nth-child(even){background:#f4f8fe}</style></head><body><h1>Pohon Kinerja - Dinas Komunikasi dan Informatika</h1><p>Tahun 2026</p><table>${table}</table></body></html>`;
  const url = URL.createObjectURL(new Blob([excelDocument], { type: "application/vnd.ms-excel" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "pohon-kinerja-2026.xls";
  link.click();
  URL.revokeObjectURL(url);
}

function printTree(tree) {
  const childRows = tree.branches.map((branch) => `
    <section class="branch">
      ${printNode("INTERMEDIATE", branch)}
      ${branch.children.map((child) => printNode(child.level, child)).join("")}
    </section>`).join("");
  const printWindow = window.open("", "_blank", "width=1400,height=900");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>Pohon Kinerja 2026</title><style>
    *{box-sizing:border-box}body{margin:0;padding:28px;background:#f7fbff;color:#0b1c30;font-family:Arial,sans-serif}h1{margin:0 0 6px;color:#087f5b;font-size:22px;text-align:center}h2{margin:0 0 28px;font-size:13px;text-align:center}.root,.node{width:250px;margin:0 auto 22px;border:2px solid #2f6fb3;border-radius:8px;background:#fff;text-align:center;overflow:hidden}.root{border-color:#ef6a6a;margin-bottom:28px}.head{padding:11px 12px;background:#2f6fb3;color:#fff;font-size:11px;font-weight:bold}.root .head{background:#ed5c5c}.indicator{padding:9px 12px;border-top:1px solid #dce3ec;font-size:10px}.branches{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;border-top:2px solid #94a3b8;padding-top:18px}.branch{position:relative;padding-top:16px}.branch:before{content:"";position:absolute;top:0;left:50%;height:16px;border-left:2px solid #94a3b8}.branch .node:nth-child(2){border-color:#58b77c}.branch .node:nth-child(n+3){border-color:#e8a52d}.branch .node:nth-child(2) .head{background:#159447}.branch .node:nth-child(n+3) .head{background:#e99b15}@media print{body{padding:10mm}.branches{gap:12mm}}
  </style></head><body><h1>POHON KINERJA</h1><h2>DINAS KOMUNIKASI DAN INFORMATIKA &middot; TAHUN 2026</h2><div class="root">${printNode("ULTIMATE", tree)}</div><div class="branches">${childRows}</div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
  printWindow.document.close();
}

function printNode(level, node) {
  return `<div class="node"><div class="head">${escapeHtml(node.title)}</div><div class="indicator">${escapeHtml(node.indicator || "Belum ada indikator")}</div></div>`;
}

function TreeNode({ node, level, selected, onSelect }) {
  const colors = palette[level];
  return (
    <button type="button" onClick={() => onSelect({ ...node, level })} className={`group relative flex w-[250px] flex-col overflow-visible rounded-lg border-2 bg-white text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors.border} ${selected ? "ring-4 ring-blue-100" : ""}`}>
      <span className={`absolute -left-7 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 text-[9px] font-extrabold tracking-[0.18em] ${colors.label}`}>{level}</span>
      <span className={`${colors.head} min-h-[48px] px-3 py-2 text-[10px] font-extrabold leading-tight text-white`}>{node.title}</span>
      <span className="min-h-[37px] border-t border-slate-200 px-3 py-2 text-[10px] leading-tight text-slate-600">{node.indicator || "Belum ada indikator"}</span>
      <span className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-blue-950 text-xs text-white group-hover:flex">✎</span>
    </button>
  );
}

function EditablePohonKinerja() {
  const [tree, setTree] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialTree; } catch { return initialTree; } });
  const [selected, setSelected] = useState({ ...tree, id: "ultimate", level: "ULTIMATE" });
  const [showUpload, setShowUpload] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateSelected = (field, value) => {
    setSaved(false);
    if (selected.level === "ULTIMATE") setTree((current) => ({ ...current, [field]: value }));
    else setTree((current) => ({ ...current, branches: current.branches.map((branch) => branch.id === selected.id ? { ...branch, [field]: value } : { ...branch, children: branch.children.map((child) => child.id === selected.id ? { ...child, [field]: value } : child) }) }));
    setSelected((current) => ({ ...current, [field]: value }));
  };

  const addNode = (target = selected) => {
    const node = { id: `node-${Date.now()}`, level: "OUTPUT", title: "INDIKATOR BARU", indicator: "Tambahkan indikator" };
    const branchId = target.level === "INTERMEDIATE" ? target.id : tree.branches.find((branch) => branch.children.some((child) => child.id === target.id))?.id;
    if (!branchId) return;
    setTree((current) => ({ ...current, branches: current.branches.map((branch) => branch.id === branchId ? { ...branch, children: [...branch.children, node] } : branch) }));
    setSelected(node);
    setSaved(false);
  };

  const deleteNode = () => {
    if (selected.level === "ULTIMATE") return;
    setTree((current) => ({ ...current, branches: current.branches.map((branch) => ({ ...branch, children: branch.children.filter((child) => child.id !== selected.id) })) }));
    setSelected({ ...tree, id: "ultimate", level: "ULTIMATE" });
    setSaved(false);
  };

  const saveChanges = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tree)); setSaved(true); };

  return <>
    <style>{`@media print { body * { visibility: hidden !important; } #performance-tree, #performance-tree * { visibility: visible !important; } #performance-tree { position: absolute; left: 0; top: 0; width: 100%; overflow: visible !important; border: 0 !important; box-shadow: none !important; } #performance-tree button { cursor: default; } }`}</style>
    <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500"><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="font-bold text-blue-950">Pohon Kinerja</span></nav>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"><div><h2 className="mb-1 text-3xl font-bold text-slate-900">Pohon Kinerja</h2><p className="text-slate-500">Visualisasi hierarki tujuan, sasaran, dan indikator kinerja organisasi.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={saveChanges} className="flex items-center gap-2 rounded bg-blue-950 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-900"><span className="material-symbols-outlined text-[18px]">save</span>{saved ? "Tersimpan" : "Simpan Perubahan"}</button><button type="button" onClick={() => setShowUpload(true)} className="flex items-center gap-2 rounded border border-blue-950 px-4 py-2 text-blue-950 hover:bg-blue-50"><span className="material-symbols-outlined text-[18px]">upload</span>Upload File</button></div></div>
      <div className="mb-8 rounded-lg border border-slate-300 bg-white p-6 shadow-sm"><div className="grid grid-cols-1 gap-4 md:grid-cols-4"><FilterSelect label="Tahun" options={["2026", "2025", "2024"]} /><FilterSelect label="Unit Kerja" options={["Dinas Komunikasi dan Informatika", "Semua Unit Kerja"]} /><FilterSelect label="Status" options={["Semua Status", "Draft", "Published"]} /><label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Pencarian<div className="relative"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span><input type="text" placeholder="Cari indikator..." className="w-full rounded border border-slate-300 py-2 pl-10 pr-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-blue-950" /></div></label></div></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><section className="overflow-auto rounded-lg border border-slate-300 bg-[#f7fbff] shadow-sm"><div className="min-w-[1180px] px-8 pb-20 pt-8"><div className="mx-auto mb-8 flex w-72 flex-col items-center rounded-lg border-2 border-emerald-400 bg-white p-4 text-center shadow-sm"><div className="mb-1 font-bold text-emerald-600">POHON KINERJA</div><div className="text-xs font-bold">DINAS KOMUNIKASI DAN INFORMATIKA</div><div className="text-xs text-slate-500">TAHUN 2026</div></div><div className="flex flex-col items-center"><TreeNode node={tree} level="ULTIMATE" selected={selected.id === "ultimate"} onSelect={setSelected} /><div className="h-8 w-px bg-slate-400" /></div><div className="relative grid grid-cols-3 gap-12 pt-5 before:absolute before:left-[16.7%] before:right-[16.7%] before:top-0 before:h-px before:bg-slate-400">{tree.branches.map((branch) => <div key={branch.id} className="flex flex-col items-center"><div className="h-5 w-px bg-slate-400" /><TreeNode node={branch} level="INTERMEDIATE" selected={selected.id === branch.id} onSelect={setSelected} /><div className="my-5 h-5 w-px bg-slate-400" />{branch.children.map((child) => <div key={child.id} className="relative mb-5"><TreeNode node={child} level={child.level} selected={selected.id === child.id} onSelect={setSelected} /></div>)}<button type="button" onClick={() => { setSelected(branch); addNode(); }} className="mb-4 flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-950"><span className="material-symbols-outlined text-[16px]">add_circle</span>Tambah node</button></div>)}</div></div></section>
        <aside className="h-fit rounded-lg border border-slate-300 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Editor Node</p><h3 className="mt-1 text-lg font-bold text-slate-900">Detail kinerja</h3></div><span className="material-symbols-outlined text-slate-400">edit_note</span></div><label className="mb-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Level<select value={selected.level} onChange={(event) => updateSelected("level", event.target.value)} disabled={selected.level === "ULTIMATE"} className="rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700"><option>INTERMEDIATE</option><option>IMMEDIATE</option><option>OUTPUT</option></select></label><label className="mb-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Tujuan / Sasaran<textarea value={selected.title || ""} onChange={(event) => updateSelected("title", event.target.value)} rows="4" className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950" /></label><label className="mb-5 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Indikator<textarea value={selected.indicator || ""} onChange={(event) => updateSelected("indicator", event.target.value)} rows="3" className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950" /></label><div className="flex gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={addNode} disabled={selected.level === "ULTIMATE"} className="flex flex-1 items-center justify-center gap-1 rounded border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"><span className="material-symbols-outlined text-[17px]">add</span>Tambah</button><button type="button" onClick={deleteNode} disabled={selected.level === "ULTIMATE"} className="flex items-center justify-center gap-1 rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><span className="material-symbols-outlined text-[17px]">delete</span>Hapus</button></div><p className="mt-4 text-xs leading-relaxed text-slate-500">Klik node pada pohon untuk memilihnya. Perubahan tersimpan setelah tombol simpan ditekan.</p></aside></div>
    </main>
    {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
  </>;
}

export default EditablePohonKinerja;
export { LegacyPohonKinerja };

const _treeData = [
  {
    level: "INTERMEDIATE",
    color: "blue",
    title: "MENINGKATNYA PENYELENGGARAAN STATISTIK SEKTORAL",
    indicator: "Indeks Pembangunan Statistik",
  },
  {
    level: "IMMEDIATE",
    color: "green",
    title: "MENINGKATNYA KUALITAS DAN AKSES DATA SEKTORAL",
    indicator:
      "Persentase Data Statistik Sektoral yang dilakukan Pemutakhiran Dalam",
  },
];

function TreeCard({ level, color, title, indicator }) {
  const colors = {
    red: {
      border: "border-red-500",
      head: "bg-red-500",
      text: "text-red-500",
    },
    blue: {
      border: "border-blue-500",
      head: "bg-blue-500",
      text: "text-blue-500",
    },
    green: {
      border: "border-emerald-500",
      head: "bg-emerald-500",
      text: "text-emerald-500",
    },
    orange: {
      border: "border-amber-500",
      head: "bg-amber-500",
      text: "text-amber-500",
    },
  };

  const c = colors[color];

  return (
    <div className="relative flex justify-center mb-12">
      <div className="absolute -left-6 top-0 bottom-0 flex items-center">
        <span
          className={`writing-mode-vertical ${c.text} font-bold text-[10px]
          tracking-widest border ${c.border} rounded px-1 py-4 bg-white`}
        >
          {level}
        </span>
      </div>

      <div
        className={`w-[280px] rounded-lg bg-white shadow-md border-[1.5px]
        ${c.border} overflow-hidden relative z-10 text-center`}
      >
        <div
          className={`${c.head} text-white w-full py-3 px-4
          font-bold text-xs min-h-[50px] flex items-center justify-center`}
        >
          {title}
        </div>

        <div className="py-3 px-4 text-xs w-full border-t border-slate-200">
          {indicator}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ children }) {
  return (
    <div className="w-[180px] rounded-lg bg-pink-50 p-3 shadow-sm border-[1.5px] border-dashed border-pink-500 flex items-center justify-center text-center">
      <p className="text-[10px] font-medium text-pink-700">
        {children}
      </p>
    </div>
  );
}

function LegacyPohonKinerja() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <span className="hover:text-blue-900 cursor-pointer">
            Dashboard
          </span>

          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>

          <span className="text-blue-950 font-bold">
            Pohon Kinerja
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">
              Pohon Kinerja
            </h2>

            <p className="text-slate-500">
              Visualisasi hierarki tujuan, sasaran, dan indikator kinerja
              organisasi.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button type="button" onClick={() => downloadExcel(tree)} className="flex items-center gap-2 px-4 py-2 border border-blue-950 text-blue-950 rounded hover:bg-blue-50 transition">
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
                Export Excel
            </button>
            <button type="button" onClick={() => printTree(tree)} className="flex items-center gap-2 px-4 py-2 border border-blue-950 text-blue-950 rounded hover:bg-blue-50 transition">
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
                Export PDF
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 border border-blue-950 text-blue-950 rounded hover:bg-blue-50 transition"
            >
              <span className="material-symbols-outlined text-[18px]">
                upload
              </span>
              Upload File
            </button>

          </div>
        </div>

        {/* Filter */}
        <div className="bg-white border border-slate-300 rounded-lg p-6 mb-8 shadow-sm">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <FilterSelect
              label="Tahun"
              options={["2026", "2025", "2024"]}
            />

            <FilterSelect
              label="Unit Kerja"
              options={[
                "Dinas Komunikasi dan Informatika",
                "Semua Unit Kerja",
              ]}
            />

            <FilterSelect
              label="Status"
              options={[
                "Semua Status",
                "Draft",
                "Published",
              ]}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pencarian
              </label>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                  search
                </span>

                <input
                  type="text"
                  placeholder="Cari indikator..."
                  className="w-full pl-10 pr-3 py-2 rounded border border-slate-300 bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 outline-none text-sm"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Tree */}
        <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-auto h-[800px]">

          <div className="min-w-[1500px] pb-20 flex flex-col items-center pt-8">

            {/* Title */}
            <div className="flex flex-col items-center mb-8 border border-emerald-500 rounded p-4 bg-white shadow-sm w-96 text-center">
              <div className="text-emerald-600 font-bold mb-1">
                POHON KINERJA
              </div>

              <div className="text-xs font-bold mb-1">
                DINAS KOMUNIKASI DAN INFORMATIKA
              </div>

              <div className="text-xs">
                TAHUN 2026
              </div>
            </div>

            {/* Ultimate */}
            <TreeCard
              level="ULTIMATE"
              color="red"
              title="TERWUJUDNYA DIGITALISASI ADMINISTRASI PEMERINTAH"
              indicator="Indeks Pemerintah Digital"
            />

            {/* Connector */}
            <div className="w-px h-8 bg-slate-300" />

            {/* Branches */}
            <div className="grid grid-cols-3 gap-10 w-[1200px]">

              {/* Branch 1 */}
              <div className="flex flex-col items-center">

                <TreeCard
                  level="INTERMEDIATE"
                  color="blue"
                  title="MENINGKATNYA PENYELENGGARAAN STATISTIK SEKTORAL"
                  indicator="Indeks Pembangunan Statistik"
                />

                <TreeCard
                  level="IMMEDIATE"
                  color="green"
                  title="MENINGKATNYA KUALITAS DAN AKSES DATA SEKTORAL"
                  indicator="Persentase Data Statistik Sektoral yang dilakukan Pemutakhiran"
                />

                <TreeCard
                  level="INTERMEDIATE"
                  color="blue"
                  title="MENINGKATNYA PENYELENGGARAAN STATISTIK SEKTORAL"
                  indicator="Indeks Pembangunan Statistik"
                />

              </div>

              {/* Branch 2 */}
              <div className="flex flex-col items-center">

                <TreeCard
                  level="INTERMEDIATE"
                  color="blue"
                  title="MENINGKATNYA TATA KELOLA KEAMANAN INFORMASI"
                  indicator="Indeks Keamanan Informasi"
                />

                <TreeCard
                  level="IMMEDIATE"
                  color="green"
                  title="MENINGKATNYA PENYELESAIAN GANGGUAN KEAMANAN INFORMASI"
                  indicator="Persentase Gangguan yang diselesaikan"
                />

                <TreeCard
                  level="OUTPUT"
                  color="orange"
                  title="MENINGKATNYA PENANGANAN GANGGUAN KEAMANAN INFORMASI"
                  indicator="Persentase Gangguan yang ditangani"
                />

                <div className="flex gap-4 mb-12">
                  <ActivityCard>
                    Terlaksananya sosialisasi terkait edukasi kesadaran
                    keamanan informasi SPBE.
                  </ActivityCard>

                  <ActivityCard>
                    Terlaksananya pengembangan kompetensi SDM bidang
                    keamanan informasi.
                  </ActivityCard>
                </div>

                <TreeCard
                  level="OUTPUT"
                  color="orange"
                  title="PERSENTASE GANGGUAN YANG DITANGANI"
                  indicator=""
                />

              </div>

              {/* Branch 3 */}
              <div className="flex flex-col items-center">

                <TreeCard
                  level="INTERMEDIATE"
                  color="blue"
                  title="MENINGKATNYA KETERBUKAAN INFORMASI PUBLIK"
                  indicator="Indeks Komunikasi Pembangunan dan Informasi Publik"
                />

                <TreeCard
                  level="IMMEDIATE"
                  color="green"
                  title="MENINGKATNYA PELAYANAN INFORMASI PUBLIK"
                  indicator="Persentase Layanan Informasi Publik"
                />

                <div className="grid grid-cols-3 gap-4 mb-12">

                  <TreeCard
                    level="OUTPUT"
                    color="orange"
                    title="MENINGKATNYA AKSES INFORMASI PADA MEDIA KOMUNIKASI PUBLIK"
                    indicator="Jumlah Konten Informasi yang dipublikasikan"
                  />

                  <TreeCard
                    level="OUTPUT"
                    color="orange"
                    title="MENINGKATNYA DISEMINASI INFORMASI"
                    indicator="Jumlah Lembaga Komunikasi Publik"
                  />

                  <TreeCard
                    level="OUTPUT"
                    color="orange"
                    title="MENINGKATNYA TANGGAPAN ATAS PERMOHONAN INFORMASI PUBLIK"
                    indicator="Persentase Permohonan Informasi yang mendapatkan Tanggapan"
                  />

                </div>

                <div className="flex gap-4 mb-12">

                  <ActivityCard>
                    Terlaksananya koordinasi dengan Forum Kelompok
                    Informasi Masyarakat.
                  </ActivityCard>

                  <ActivityCard>
                    Terlaksananya monitoring dan evaluasi kegiatan
                    kemitraan.
                  </ActivityCard>

                </div>

                <TreeCard
                  level="OUTPUT"
                  color="orange"
                  title="JUMLAH LEMBAGA KOMUNIKASI PUBLIK YANG MENDUKUNG KEGIATAN KEMITRAAN"
                  indicator=""
                />

              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} />
      )}
    </>
  );
}

function FilterSelect({ label, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>

      <select className="w-full p-2 rounded border border-slate-300 bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 outline-none text-sm">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function UploadModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">

        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            Upload Data Kinerja
          </h3>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-600"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <div className="p-6">

          <label className="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 hover:border-blue-900 transition">

            <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">
              cloud_upload
            </span>

            <p className="font-semibold mb-1">
              Drag & drop file di sini
            </p>

            <p className="text-sm text-slate-500">
              atau klik untuk memilih file dari komputer
            </p>

            <p className="text-xs text-slate-500 mt-3">
              Mendukung format .xlsx, .xls, .csv
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

          </label>

        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100"
          >
            Batal
          </button>

          <button
            disabled
            className="px-4 py-2 bg-blue-950 text-white rounded opacity-50 cursor-not-allowed"
          >
            Validasi Data
          </button>

        </div>

      </div>
    </div>
  );
}