import { useState, useEffect } from "react";

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

function downloadExcel(tree, tahun, unitKerja) {
  const rowsForNode = (node, level) => [
    [level, node.title, node.indicator],
    ...(node.children || []).flatMap((child) => rowsForNode(child, child.level)),
  ];
  const rows = [
    ["Level", "Tujuan / Sasaran", "Indikator"],
    ...rowsForNode(tree, "ULTIMATE"),
    ...tree.branches.flatMap((branch) => rowsForNode(branch, "INTERMEDIATE")),
  ];
  const table = rows.map((row, index) => `<tr>${row.map((cell) => `<${index === 0 ? "th" : "td"}>${escapeHtml(cell)}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
  const excelDocument = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;color:#0b1c30}h1{color:#001e40}table{border-collapse:collapse;width:100%}th{background:#003366;color:white}th,td{border:1px solid #b9d3f5;padding:8px;text-align:left}tr:nth-child(even){background:#f4f8fe}</style></head><body><h1>Pohon Kinerja - ${escapeHtml(unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA")}</h1><p>Tahun ${escapeHtml(tahun)}</p><table>${table}</table></body></html>`;
  const url = URL.createObjectURL(new Blob([excelDocument], { type: "application/vnd.ms-excel" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pohon-kinerja-${tahun}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function printTree(tree, tahun, unitKerja) {
  const childRows = tree.branches.map((branch) => `
    <section class="branch">
      ${printNode("INTERMEDIATE", branch)}
      ${branch.children.map((child) => `${printNode("IMMEDIATE", child)}${(child.children || []).map((output) => printNode("OUTPUT", output)).join("")}`).join("")}
    </section>`).join("");
  const printWindow = window.open("", "_blank", "width=1400,height=900");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>Pohon Kinerja ${escapeHtml(tahun)}</title><style>
    *{box-sizing:border-box}body{margin:0;padding:28px;background:#f7fbff;color:#0b1c30;font-family:Arial,sans-serif}h1{margin:0 0 6px;color:#087f5b;font-size:22px;text-align:center}h2{margin:0 0 28px;font-size:13px;text-align:center}.root,.node{width:250px;margin:0 auto 22px;border:2px solid #2f6fb3;border-radius:8px;background:#fff;text-align:center;overflow:hidden}.root{border-color:#ef6a6a;margin-bottom:28px}.head{padding:11px 12px;background:#2f6fb3;color:#fff;font-size:11px;font-weight:bold}.root .head{background:#ed5c5c}.indicator{padding:9px 12px;border-top:1px solid #dce3ec;font-size:10px}.branches{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;border-top:2px solid #94a3b8;padding-top:18px}.branch{position:relative;padding-top:16px}.branch:before{content:"";position:absolute;top:0;left:50%;height:16px;border-left:2px solid #94a3b8}.branch .node:nth-child(2){border-color:#58b77c}.branch .node:nth-child(n+3){border-color:#e8a52d}.branch .node:nth-child(2) .head{background:#159447}.branch .node:nth-child(n+3) .head{background:#e99b15}@media print{body{padding:10mm}.branches{gap:12mm}}
  </style></head><body><h1>POHON KINERJA</h1><h2>${escapeHtml(unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA")} &middot; TAHUN ${escapeHtml(tahun)}</h2><div class="root">${printNode("ULTIMATE", tree)}</div><div class="branches">${childRows}</div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
  printWindow.document.close();
}

function printNode(level, node) {
  const colors = {
    ULTIMATE: ["#ef5b5b", "#ef5b5b"],
    INTERMEDIATE: ["#2563eb", "#2563eb"],
    IMMEDIATE: ["#059669", "#059669"],
    OUTPUT: ["#f59e0b", "#f59e0b"],
  }[level] || ["#2563eb", "#2563eb"];
  return `<div class="node" style="border-color:${colors[0]};-webkit-print-color-adjust:exact;print-color-adjust:exact"><div class="head" style="background:${colors[1]};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">${escapeHtml(node.title)}</div><div class="indicator">${escapeHtml(node.indicator || "Belum ada indikator")}</div></div>`;
}

function TreeNode({ node, level, selected, onSelect }) {
  const nodeLevel = node.level || level;
  const colors = palette[nodeLevel];
  return (
    <button type="button" onClick={() => onSelect({ ...node, level: nodeLevel })} className={`group relative flex w-[250px] flex-col overflow-visible rounded-lg border-2 bg-white text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors.border} ${selected ? "ring-4 ring-blue-100" : ""}`}>
      <span className={`absolute -left-7 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 text-[9px] font-extrabold tracking-[0.18em] ${colors.label}`}>{nodeLevel}</span>
      <span className={`${colors.head} min-h-[48px] px-3 py-2 text-[10px] font-extrabold leading-tight text-white`}>{node.title}</span>
      <span className="min-h-[37px] border-t border-slate-200 px-3 py-2 text-[10px] leading-tight text-slate-600">{node.indicator || "Belum ada indikator"}</span>
      <span className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-blue-950 text-xs text-white group-hover:flex">✎</span>
    </button>
  );
}

function EditablePohonKinerja() {
  const [tree, setTree] = useState(initialTree);
  const [selected, setSelected] = useState({ ...initialTree, id: "ultimate", level: "ULTIMATE" });
  const [showUpload, setShowUpload] = useState(false);
  const [saved, setSaved] = useState(false);

  // Filter states
  const [tahun, setTahun] = useState("2026");
  const [unitKerja, setUnitKerja] = useState("");
  
  // Data states
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [pohonKinerjaData, setPohonKinerjaData] = useState(null);

  // Fetch tree data when tahun changes
  useEffect(() => {
    if (!tahun) return;
    
    const fetchTreeData = async () => {
      setLoadingData(true);
      setErrorData("");
      
      try {
        const params = new URLSearchParams();
        params.append("tahun", tahun);
        if (unitKerja) {
          params.append("unit_kerja", unitKerja);
        }
        
        const response = await fetch(`http://localhost:8000/api/pohon-kinerja/tree?${params}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setErrorData(data.error || data.message || "Gagal mengambil data");
          setTreeData(null);
          setPohonKinerjaData(null);
          setLoadingData(false);
          return;
        }

        // Use tree data from database directly
        setTreeData(data.data.tree);
        setPohonKinerjaData(data.data);
        setTree(data.data.tree);
        setSelected({ ...data.data.tree, id: data.data.tree.id || "ultimate", level: "ULTIMATE" });
        setLoadingData(false);
      } catch (err) {
        setErrorData(err.message || "Gagal mengambil data");
        setTreeData(null);
        setPohonKinerjaData(null);
        setLoadingData(false);
      }
    };

    fetchTreeData();
  }, [tahun, unitKerja]);

  const updateSelected = (field, value) => {
    setSaved(false);
    const updateNode = (node) => ({
      ...node,
      ...(node.id === selected.id ? { [field]: value } : {}),
      ...(node.children ? { children: node.children.map(updateNode) } : {}),
    });
    setTree((current) => selected.level === "ULTIMATE"
      ? { ...current, [field]: value }
      : { ...current, branches: current.branches.map(updateNode) });
    setSelected((current) => ({ ...current, [field]: value }));
  };

  const addNode = (target = selected) => {
    const nodeLevel = {
      ULTIMATE: "INTERMEDIATE",
      INTERMEDIATE: "IMMEDIATE",
      IMMEDIATE: "OUTPUT",
      OUTPUT: "OUTPUT",
    }[target.level];
    const node = { id: `node-${Date.now()}`, level: nodeLevel, title: nodeLevel === "INTERMEDIATE" ? "SASARAN ANTARA BARU" : nodeLevel === "IMMEDIATE" ? "SASARAN LANGSUNG BARU" : "INDIKATOR BARU", indicator: "Tambahkan indikator" };
    if (target.level === "ULTIMATE") {
      setTree((current) => ({ ...current, branches: [...current.branches, { ...node, children: [] }] }));
      setSelected(node);
      setSaved(false);
      return;
    }

    if (target.level === "INTERMEDIATE") {
      setTree((current) => ({
        ...current,
        branches: current.branches.map((branch) => branch.id === target.id
          ? { ...branch, children: [...(branch.children || []), node] }
          : branch),
      }));
      setSelected(node);
      setSaved(false);
      return;
    }

    const branchId = tree.branches.find((branch) => branch.children.some((child) => child.id === target.id))?.id;
    const parentImmediateId = target.level === "OUTPUT"
      ? tree.branches.flatMap((branch) => branch.children || []).find((child) => child.children?.some((output) => output.id === target.id))?.id
      : target.id;
    if (!branchId || !parentImmediateId) return;
    setTree((current) => ({
      ...current,
      branches: current.branches.map((branch) => branch.id === branchId
        ? {
          ...branch,
          children: branch.children.map((child) => child.id === parentImmediateId
            ? { ...child, children: [...(child.children || []), node] }
            : child),
        }
        : branch),
    }));
    setSelected(node);
    setSaved(false);
  };

  const addIntermediate = () => addNode({ ...tree, id: tree.id || "ultimate", level: "ULTIMATE" });

  const addImmediate = (target) => addNode({ ...target, level: "INTERMEDIATE" });

  const deleteNode = () => {
    if (selected.level === "ULTIMATE") return;
    setTree((current) => ({ ...current, branches: current.branches.map((branch) => ({ ...branch, children: branch.children.filter((child) => child.id !== selected.id) })) }));
    setSelected({ ...tree, id: "ultimate", level: "ULTIMATE" });
    setSaved(false);
  };

  const saveChanges = async () => {
    if (!pohonKinerjaData || !selected.id || selected.id.startsWith("node-")) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
      setSaved(true);
      return;
    }

    const [level, id] = selected.id.split("-");

    try {
      const response = await fetch(`http://localhost:8000/api/pohon-kinerja/node/${level}/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selected.title || "",
          indicator: selected.indicator || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan perubahan");
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
      setSaved(true);
      setErrorData("");
    } catch (error) {
      setSaved(false);
      setErrorData(error.message || "Gagal menyimpan perubahan");
    }
  };

  return <>
    <style>{`@media print { @page { size: landscape; margin: 8mm; } body { overflow: visible !important; } body * { visibility: hidden !important; } #performance-tree, #performance-tree * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } #performance-tree { position: absolute; left: 0; top: 0; width: 100% !important; max-width: 100% !important; overflow: visible !important; border: 0 !important; box-shadow: none !important; } #performance-tree > div { width: 100% !important; min-width: 0 !important; padding: 0 !important; } #performance-tree > div > div { display: block !important; width: 100% !important; min-width: 0 !important; } #performance-tree section { width: 100% !important; overflow: visible !important; } #performance-tree section > div { width: max-content !important; min-width: 0 !important; zoom: 0.7; transform-origin: top left; } #performance-tree aside { display: none !important; } #performance-tree button { cursor: default; } }`}</style>
    <main className="w-full min-w-0 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500"><span>Dashboard</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="font-bold text-blue-950">Pohon Kinerja</span></nav>
      <div className="flex flex-wrap gap-2">

  {/* Simpan Perubahan */}
  <button
    type="button"
    onClick={saveChanges}
    className="flex items-center gap-2 rounded bg-blue-950 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-900"
  >
    <span className="material-symbols-outlined text-[18px]">
      save
    </span>
    {saved ? "Tersimpan" : "Simpan Perubahan"}
  </button>

  {/* Export Excel */}
  <button
    type="button"
    onClick={() => downloadExcel(tree, tahun, unitKerja || pohonKinerjaData?.unit_kerja)}
    className="flex items-center gap-2 rounded border border-blue-950 px-4 py-2 text-blue-950 hover:bg-blue-50"
  >
    <span className="material-symbols-outlined text-[18px]">
      table_view
    </span>
    Export Excel
  </button>

  {/* Export PDF */}
  <button
    type="button"
    onClick={() => window.print()}
    className="flex items-center gap-2 rounded border border-blue-950 px-4 py-2 text-blue-950 hover:bg-blue-50"
  >
    <span className="material-symbols-outlined text-[18px]">
      picture_as_pdf
    </span>
    Export PDF
  </button>

  {/* Upload File */}
  <button
    type="button"
    onClick={() => setShowUpload(true)}
    className="flex items-center gap-2 rounded border border-blue-950 px-4 py-2 text-blue-950 hover:bg-blue-50"
  >
    <span className="material-symbols-outlined text-[18px]">
      upload
    </span>
    Upload File
  </button>

  <button
    type="button"
    onClick={addIntermediate}
    className="flex items-center gap-2 rounded bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm hover:bg-emerald-800"
  >
    <span className="material-symbols-outlined text-[18px]">
      add
    </span>
    Tambah Intermediate
  </button>

</div>
      <div className="mb-8 rounded-lg border border-slate-300 bg-white p-6 shadow-sm"><div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tahun
          </label>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(e.target.value)}
            className="w-full p-2 rounded border border-slate-300 bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 outline-none text-sm"
          >
            <option value="">Pilih Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        

       </div></div>

      {loadingData && (
        <div className="mb-8 rounded-lg border border-blue-300 bg-blue-50 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-blue-600">
            autorenew
          </span>
          <p className="text-blue-900">Mengambil data pohon kinerja...</p>
        </div>
      )}

      {errorData && !loadingData && (
        <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-red-900 font-semibold">Perhatian:</p>
          <p className="text-red-800 text-sm">{errorData}</p>
        </div>
      )}

      {pohonKinerjaData && (
        <div className="mb-8 rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="text-green-900 font-semibold">Data Terimport:</p>
          <p className="text-green-800 text-sm">
            Tahun: {pohonKinerjaData.tahun} 
          </p>
        </div>
      )}

      <div
        id="performance-tree"
        className="w-full min-w-0 overflow-auto rounded-xl border border-slate-300 bg-[#f7fbff] shadow-sm"
      >
        <div className="min-w-max p-4 md:p-5">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] w-max min-w-full">
            <section className="w-full min-w-0"><div className="min-w-max px-8 pb-20 pt-8"><div className="mx-auto mb-8 flex w-72 flex-col items-center rounded-lg border-2 border-emerald-400 bg-white p-4 text-center shadow-sm"><div className="mb-1 font-bold text-emerald-600">POHON KINERJA</div><div className="text-xs font-bold">{pohonKinerjaData?.unit_kerja || "DINAS KOMUNIKASI DAN INFORMATIKA"}</div><div className="text-xs text-slate-500">TAHUN {pohonKinerjaData?.tahun || 2026}</div></div><div className="flex flex-col items-center"><TreeNode node={tree} level="ULTIMATE" selected={selected.id === "ultimate"} onSelect={setSelected} /><div className="h-8 w-px bg-slate-400" /></div><div className="relative flex min-w-max justify-center gap-8 pt-5 before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-slate-400">{tree.branches.map((branch) => <div key={branch.id} className="flex w-[250px] shrink-0 flex-col items-center"><div className="h-5 w-px shrink-0 bg-slate-400" /><TreeNode node={branch} level="INTERMEDIATE" selected={selected.id === branch.id} onSelect={setSelected} /><div className="my-5 h-5 w-px shrink-0 bg-slate-400" />{branch.children.length > 0 && <div className="flex w-full flex-col items-center gap-5">{branch.children.map((child) => <div key={child.id} className="flex w-full flex-col items-center"><TreeNode node={child} level="IMMEDIATE" selected={selected.id === child.id} onSelect={setSelected} />{child.children?.length > 0 && <div className="mt-5 flex w-full flex-col items-center gap-5 border-t border-slate-400 pt-5">{child.children.map((output) => <div key={output.id} className="relative flex w-full flex-col items-center before:absolute before:-top-5 before:h-5 before:border-l before:border-slate-400"><TreeNode node={output} level="OUTPUT" selected={selected.id === output.id} onSelect={setSelected} /></div>)}</div>}</div>)}</div>}<button type="button" onClick={() => addImmediate(branch)} className="mt-5 mb-4 flex print:hidden items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-950"><span className="material-symbols-outlined text-[16px]">add_circle</span>Tambah Immediate</button></div>)}</div></div></section>
          <aside className="h-fit rounded-lg border border-slate-300 bg-white p-5 shadow-sm print:hidden">
          {false && pohonKinerjaData ? (
            <>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700">Data Terimport</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Informasi Pohon</h3>
                </div>
                <span className="material-symbols-outlined text-slate-400">info</span>
              </div>
              <div className="space-y-3 text-sm">
                <p><strong>Tahun:</strong> {pohonKinerjaData.tahun}</p>
                <p><strong>Unit Kerja:</strong> {pohonKinerjaData.unit_kerja}</p>
                <p><strong>Total Ultimate:</strong> {pohonKinerjaData.tree.branches.length}</p>
                <p><strong>Total Sasaran:</strong> {pohonKinerjaData.tree.branches.reduce((acc, b) => acc + (b.children?.length || 0), 0)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Editor Node</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{selected.level === "ULTIMATE" ? "Edit Ultimate" : "Detail kinerja"}</h3>
                </div>
                <span className="material-symbols-outlined text-slate-400">edit_note</span>
              </div>
              <label className="mb-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Level
                <select value={selected.level} onChange={(event) => updateSelected("level", event.target.value)} disabled={selected.level === "ULTIMATE"} className="rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700"><option value="ULTIMATE">ULTIMATE</option><option value="INTERMEDIATE">INTERMEDIATE</option><option value="IMMEDIATE">IMMEDIATE</option><option value="OUTPUT">OUTPUT</option></select>
              </label>
              <label className="mb-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tujuan / Sasaran
                <textarea value={selected.title || ""} onChange={(event) => updateSelected("title", event.target.value)} rows="4" className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950" />
              </label>
              <label className="mb-5 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Indikator
                <textarea value={selected.indicator || ""} onChange={(event) => updateSelected("indicator", event.target.value)} rows="3" className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950" />
              </label>
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={saveChanges} className="flex flex-1 items-center justify-center gap-1 rounded border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><span className="material-symbols-outlined text-[17px]">edit</span>Edit</button>
                <button type="button" onClick={deleteNode} disabled={selected.level === "ULTIMATE"} className="flex flex-1 items-center justify-center gap-1 rounded border border-red-800 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><span className="material-symbols-outlined text-[17px]">delete</span>Hapus</button>
              </div>
            </>
          )}
          </aside>
          </div>
        </div>
      </div>
    </main>
    {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={(tahunBaru) => { setShowUpload(false); setTahun(tahunBaru); }} />}
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

function UploadModal({ onClose, onUploadSuccess }) {
  const [tahun, setTahun] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useState(null)[1];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"].includes(droppedFile.type)) {
      setFile(droppedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tahun || !file) {
      setError("Tahun dan file wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("tahun", tahun);
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/pohon-kinerja/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Gagal mengupload file");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setResult(data.data);
      setTahun("");
      setFile(null);

      // Auto close after 3 seconds and trigger callback
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess(data.data.tahun);
        } else {
          onClose();
        }
      }, 3000);
    } catch (err) {
      setError(err.message || "Gagal mengupload file");
      setLoading(false);
    }
  };

  if (success && result) {
    return (
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">
          <div className="px-6 py-4 border-b bg-green-50">
            <h3 className="text-xl font-semibold text-green-900">
              ✓ Import Berhasil
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-green-900 font-semibold mb-3">Data yang diimport:</p>
              <div className="space-y-2 text-sm text-green-800">
                <p><strong>Tahun:</strong> {result.tahun}</p>
                <p><strong>Unit Kerja:</strong> {result.unit_kerja}</p>
                <p><strong>Ultimate:</strong> {result.total_ultimate}</p>
                <p><strong>Intermediate (Sasaran):</strong> {result.total_intermediate}</p>
                <p><strong>Immediate:</strong> {result.total_immediate}</p>
                <p><strong>Output:</strong> {result.total_output}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">Upload Data Kinerja</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tahun <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 outline-none"
              placeholder="Contoh: 2026"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              File Excel <span className="text-red-600">*</span>
            </label>
            <label
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 hover:border-blue-900 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragDrop}
            >
              <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">
                cloud_upload
              </span>
              <p className="font-semibold mb-1 text-slate-900">
                {file ? file.name : "Drag & drop file di sini"}
              </p>
              {!file && (
                <>
                  <p className="text-sm text-slate-500">
                    atau klik untuk memilih file dari komputer
                  </p>
                  <p className="text-xs text-slate-500 mt-3">
                    Mendukung format .xlsx, .xls, .csv
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !tahun || !file}
            className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">
                  autorenew
                </span>
                Upload...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}