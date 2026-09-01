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

  // Menyimpan node yang dihapus sampai tombol Simpan Perubahan ditekan
  const [deletedNodes, setDeletedNodes] = useState([]);
  const [newNodes, setNewNodes] = useState([]);

  // Filter states
  const [tahun, setTahun] = useState("2026");
  const [unitKerja, setUnitKerja] = useState("");
  
  // Data states
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [pohonKinerjaData, setPohonKinerjaData] = useState(null);

  // Available years state
  const [availableYears, setAvailableYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  // Archive states
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedData, setArchivedData] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showArchivedList, setShowArchivedList] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  // Create new year states
  const [showCreateNewModal, setShowCreateNewModal] = useState(false);
  const [creatingNewYear, setCreatingNewYear] = useState(false);
  const [newYearForm, setNewYearForm] = useState({
    tahun: new Date().getFullYear(),
    unit_kerja: "DINAS KOMUNIKASI DAN INFORMATIKA",
  });
  const [lastAvailableYear, setLastAvailableYear] = useState(null);

  // Fetch available years on component load
  useEffect(() => {
    const fetchYears = async () => {
      setLoadingYears(true);
      try {
        const response = await fetch('http://localhost:8000/api/pohon-kinerja/years', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setAvailableYears(data.data || []);
          // Set default tahun to first available year if available
          if (data.data && data.data.length > 0 && !tahun) {
            setTahun(String(data.data[0]));
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
          // Jika tahun tidak memiliki data, tampilkan button "Tambah Pohon Kinerja Baru"
          if (response.status === 404 && data.message && data.message.includes('tidak ditemukan')) {
            setErrorData("");
            setTreeData(null);
            setPohonKinerjaData(null);
            // Cari tahun sebelumnya sebagai template, bukan tahun yang sedang dibuat
            const targetYear = parseInt(tahun);
            const previousYears = availableYears
              .map(Number)
              .filter((year) => year < targetYear);
            const templateYear = previousYears.length > 0
              ? Math.max(...previousYears)
              : null;

            setLastAvailableYear(templateYear);
            setNewYearForm((prev) => ({
              ...prev,
              tahun: targetYear,
              unit_kerja: unitKerja || prev.unit_kerja,
            }));
            setLoadingData(false);
            return;
          }
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

    // Jika node masih baru dan belum masuk database, ikut perbarui antrean POST.
    if (selected.id?.startsWith("node-")) {
      setNewNodes((current) =>
        current.map((node) =>
          node.id === selected.id ? { ...node, [field]: value } : node
        )
      );
    }
  };

  const addNode = (target = selected) => {
    if (!pohonKinerjaData) {
      setErrorData("Pohon Kinerja tahun ini belum dibuat. Tambahkan Pohon Kinerja Baru terlebih dahulu.");
      return;
    }

    const nodeLevel = {
      ULTIMATE: "INTERMEDIATE",
      INTERMEDIATE: "IMMEDIATE",
      IMMEDIATE: "OUTPUT",
      OUTPUT: "OUTPUT",
    }[target.level];

    const parentId = target.level === "ULTIMATE"
      ? target.id
      : target.id;

    const node = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level: nodeLevel,
      title: nodeLevel === "INTERMEDIATE"
        ? "SASARAN ANTARA BARU"
        : nodeLevel === "IMMEDIATE"
          ? "SASARAN LANGSUNG BARU"
          : "OUTPUT BARU",
      indicator: "Tambahkan indikator",
      _parentId: parentId,
      _isNew: true,
    };

    if (target.level === "ULTIMATE") {
      setTree((current) => ({
        ...current,
        branches: [...current.branches, { ...node, children: [] }],
      }));
      setSelected(node);
      setNewNodes((current) => [...current, node]);
      setSaved(false);
      return;
    }

    if (target.level === "INTERMEDIATE") {
      setTree((current) => ({
        ...current,
        branches: current.branches.map((branch) =>
          branch.id === target.id
            ? { ...branch, children: [...(branch.children || []), { ...node, children: [] }] }
            : branch
        ),
      }));
      setSelected(node);
      setNewNodes((current) => [...current, node]);
      setSaved(false);
      return;
    }

    const branchId = tree.branches
      .find((branch) => branch.children?.some((child) => child.id === target.id))?.id;

    const parentImmediateId = target.level === "OUTPUT"
      ? tree.branches
          .flatMap((branch) => branch.children || [])
          .find((child) => child.children?.some((output) => output.id === target.id))?.id
      : target.id;

    if (!branchId || !parentImmediateId) {
      setErrorData("Parent node tidak ditemukan.");
      return;
    }

    const actualParentId = target.level === "OUTPUT" ? parentImmediateId : target.id;
    const actualParentLevel = target.level === "OUTPUT" ? "IMMEDIATE" : target.level;
    const nodeWithParent = { ...node, _parentId: actualParentId, _parentLevel: actualParentLevel };

    setTree((current) => ({
      ...current,
      branches: current.branches.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              children: branch.children.map((child) =>
                child.id === parentImmediateId
                  ? { ...child, children: [...(child.children || []), nodeWithParent] }
                  : child
              ),
            }
          : branch
      ),
    }));
    setSelected(nodeWithParent);
    setNewNodes((current) => [...current, nodeWithParent]);
    setSaved(false);
  };
  const addIntermediate = () => addNode({ ...tree, id: tree.id || "ultimate", level: "ULTIMATE" });

  const addImmediate = (target) => addNode({ ...target, level: "INTERMEDIATE" });

  const deleteNode = () => {
    if (selected.level === "ULTIMATE") return;

    const deletedNode = {
      id: selected.id,
      level: selected.level,
    };

    // Node baru yang belum tersimpan cukup dihapus dari antrean lokal.
    if (selected.id.startsWith("node-")) {
      setNewNodes((current) => current.filter((item) => item.id !== selected.id));
    } else {
      // Node lama ditandai untuk dihapus dari database saat tombol Simpan Perubahan ditekan.
      setDeletedNodes((current) => {
        if (current.some((item) => item.id === deletedNode.id)) {
          return current;
        }
        return [...current, deletedNode];
      });
    }

    // Hapus node dari tampilan tanpa mengubah struktur/tampilan bagan lainnya.
    setTree((current) => ({
      ...current,
      branches: current.branches
        .filter((branch) => branch.id !== selected.id)
        .map((branch) => ({
          ...branch,
          children: (branch.children || [])
            .filter((child) => child.id !== selected.id)
            .map((child) => ({
              ...child,
              children: (child.children || []).filter(
                (output) => output.id !== selected.id
              ),
            })),
        })),
    }));

    // Kembali ke Ultimate setelah node dihapus dari tampilan.
    setSelected({
      ...tree,
      id: tree.id || "ultimate",
      level: "ULTIMATE",
    });

    setSaved(false);
    setErrorData("");
  };

  const saveChanges = async () => {
    try {
      // 1. Simpan node baru terlebih dahulu agar mendapatkan ID database.
      const createdNodes = [];

      for (const newNode of newNodes) {
        const level = newNode.level;
        let parentId = newNode._parentId;

        // Jika parent juga merupakan node baru, gunakan ID database yang baru dibuat.
        const createdParent = createdNodes.find((item) => item.tempId === parentId);
        if (createdParent) {
          parentId = createdParent.id;
        } else if (typeof parentId === "string" && parentId.includes("-")) {
          const parentParts = parentId.split("-");
          const possibleId = Number(parentParts[parentParts.length - 1]);
          if (Number.isInteger(possibleId)) parentId = possibleId;
        }

        if (!parentId) {
          throw new Error(`Parent ${level} tidak ditemukan.`);
        }

        const createResponse = await fetch(
          "http://localhost:8000/api/pohon-kinerja/node",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              level,
              parent_id: parentId,
              title: newNode.title || "",
              indicator: newNode.indicator || "",
            }),
          }
        );

        const createData = await createResponse.json();
        if (!createResponse.ok) {
          throw new Error(createData.message || `Gagal menambahkan ${level}`);
        }

        createdNodes.push({
          tempId: newNode.id,
          id: createData.data.id,
          level,
        });
      }

      // Ganti temporary ID dengan ID database supaya edit/hapus berikutnya normal.
      if (createdNodes.length > 0) {
        setTree((current) => {
          const replaceIds = (node) => {
            const created = createdNodes.find((item) => item.tempId === node.id);
            return {
              ...node,
              ...(created ? { id: `${created.level.toLowerCase()}-${created.id}` } : {}),
              ...(node.children ? { children: node.children.map(replaceIds) } : {}),
            };
          };
          return { ...current, branches: current.branches.map(replaceIds) };
        });

        setSelected((current) => {
          const created = createdNodes.find((item) => item.tempId === current.id);
          return created
            ? { ...current, id: `${created.level.toLowerCase()}-${created.id}` }
            : current;
        });
      }

      // 2. Proses semua node lama yang dihapus.
      for (const deletedNode of deletedNodes) {
        const [deleteLevel, deleteIdString] = deletedNode.id.split("-");
        const deleteId = Number(deleteIdString);

        if (!deleteLevel || !Number.isInteger(deleteId)) {
          throw new Error(`ID node yang dihapus tidak valid: ${deletedNode.id}`);
        }

        const deleteResponse = await fetch(
          `http://localhost:8000/api/pohon-kinerja/node/${deleteLevel}/${deleteId}`,
          { method: "DELETE", headers: { Accept: "application/json" } }
        );

        const deleteData = await deleteResponse.json();
        if (!deleteResponse.ok) {
          throw new Error(deleteData.message || `Gagal menghapus ${deletedNode.level}`);
        }
      }

      // 3. Update node yang sedang dipilih jika node tersebut berasal dari database.
      const selectedIsNew = selected.id.startsWith("node-");
      if (!selectedIsNew && selected.id) {
        const [level, idString] = selected.id.split("-");
        const id = Number(idString);

        if (!Number.isInteger(id)) {
          throw new Error("ID node tidak valid.");
        }

        const response = await fetch(
          `http://localhost:8000/api/pohon-kinerja/node/${level}/${id}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: selected.title || "",
              indicator: selected.indicator || "",
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Gagal menyimpan perubahan");
        }
      }

      setNewNodes([]);
      setDeletedNodes([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
      setSaved(true);
      setErrorData("");

      // Ambil ulang dari database agar state benar-benar sinkron.
      const refresh = await fetch(
        `http://localhost:8000/api/pohon-kinerja/tree?tahun=${encodeURIComponent(tahun)}${unitKerja ? `&unit_kerja=${encodeURIComponent(unitKerja)}` : ""}`,
        { headers: { Accept: "application/json" } }
      );
      const refreshData = await refresh.json();
      if (refresh.ok) {
        setTree(refreshData.data.tree);
        setTreeData(refreshData.data.tree);
        setPohonKinerjaData(refreshData.data);
        setSelected({ ...refreshData.data.tree, level: "ULTIMATE" });
      }
    } catch (error) {
      setSaved(false);
      setErrorData(error.message || "Gagal menyimpan perubahan");
    }
  };
  const handleArchive = async () => {
    if (!pohonKinerjaData) {
      setErrorData("Tidak ada data pohon kinerja yang akan diarsipkan");
      return;
    }

    const tahunLama = Number(pohonKinerjaData.tahun);
    const tahunBaru = tahunLama + 1;
    const unitKerjaLama = pohonKinerjaData.unit_kerja || unitKerja || "DINAS KOMUNIKASI DAN INFORMATIKA";

    setArchivingId(pohonKinerjaData.pohon_kinerja_id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/pohon-kinerja/archive/${pohonKinerjaData.pohon_kinerja_id}`,
        { method: "POST", headers: { Accept: "application/json" } }
      );

      const data = await response.json();
      if (!response.ok) {
        setErrorData(data.message || "Gagal mengarsipkan pohon kinerja");
        return;
      }

      setShowArchiveModal(false);
      setErrorData("");
      setLastAvailableYear(tahunLama);
      setNewYearForm({ tahun: tahunBaru, unit_kerja: unitKerjaLama });

      // Tahun baru langsung dipilih, tetapi belum dibuat. Canvas menampilkan tombol
      // "Tambah Pohon Kinerja Baru" dengan tahun sebelumnya sebagai template.
      setTahun(String(tahunBaru));
      setUnitKerja("");
      setPohonKinerjaData(null);
      setTreeData(null);
      setTree(initialTree);
      setSelected({ ...initialTree, id: "ultimate", level: "ULTIMATE" });
      setNewNodes([]);
      setDeletedNodes([]);
      setSaved(false);

      setAvailableYears((current) => {
        const years = [...new Set(current.map(Number))];
        return years.sort((a, b) => b - a);
      });

      await fetchArchivedData();
    } catch (error) {
      setErrorData(error.message || "Gagal mengarsipkan pohon kinerja");
    } finally {
      setArchivingId(null);
    }
  };
  const fetchArchivedData = async () => {
    setLoadingArchived(true);
    try {
      const response = await fetch('http://localhost:8000/api/pohon-kinerja/archived', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setArchivedData(data.data || []);
      } else {
        setArchivedData([]);
      }
    } catch (err) {
      console.error('Failed to fetch archived data:', err);
      setArchivedData([]);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleRestore = async (id) => {
    setArchivingId(id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/pohon-kinerja/restore/${id}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorData(data.message || "Gagal memulihkan pohon kinerja");
        setArchivingId(null);
        return;
      }

      setErrorData("");
      // Refresh archived list
      await fetchArchivedData();
    } catch (error) {
      setErrorData(error.message || "Gagal memulihkan pohon kinerja");
    } finally {
      setArchivingId(null);
    }
  };

  const handleCreateNewYear = async () => {
    if (!newYearForm.tahun || !newYearForm.unit_kerja) {
      setErrorData("Tahun dan Unit Kerja harus diisi");
      return;
    }

    setCreatingNewYear(true);
    setErrorData("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/pohon-kinerja/duplicate",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tahun_baru: Number(newYearForm.tahun),
            unit_kerja: newYearForm.unit_kerja,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat pohon kinerja tahun baru");
      }

      setShowCreateNewModal(false);
      setAvailableYears((prev) =>
        [...new Set([...prev.map(Number), Number(newYearForm.tahun)])].sort((a, b) => b - a)
      );
      setUnitKerja(newYearForm.unit_kerja);
      setTahun(String(newYearForm.tahun));
      setNewNodes([]);
      setDeletedNodes([]);
      setSaved(false);

      // Jika endpoint duplicate mengembalikan tree, tampilkan langsung tanpa menunggu fetch berikutnya.
      if (data.data?.tree) {
        setTree(data.data.tree);
        setTreeData(data.data.tree);
        setPohonKinerjaData(data.data);
        setSelected({ ...data.data.tree, level: "ULTIMATE" });
      }
    } catch (error) {
      setErrorData(error.message || "Gagal membuat pohon kinerja tahun baru");
    } finally {
      setCreatingNewYear(false);
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

  {pohonKinerjaData && (
    <button
      type="button"
      onClick={() => setShowArchiveModal(true)}
      className="flex items-center gap-2 rounded border border-orange-600 px-4 py-2 text-orange-600 hover:bg-orange-50"
    >
      <span className="material-symbols-outlined text-[18px]">
        archive
      </span>
      Arsipkan Tahun
    </button>
  )}

  <button
    type="button"
    onClick={() => {
      setShowArchivedList(true);
      if (archivedData.length === 0) {
        fetchArchivedData();
      }
    }}
    className="flex items-center gap-2 rounded border border-purple-600 px-4 py-2 text-purple-600 hover:bg-purple-50"
  >
    <span className="material-symbols-outlined text-[18px]">
      history
    </span>
    Lihat Arsipan
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
            disabled={loadingYears}
            className="w-full p-2 rounded border border-slate-300 bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/20 outline-none text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih Tahun</option>
            {loadingYears ? (
              <option disabled>Memuat tahun...</option>
            ) : availableYears.length > 0 ? (
              availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))
            ) : (
              <option disabled>Tidak ada data tahun</option>
            )}
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
          {/* Tampilkan button "Tambah Pohon Kinerja Baru" ketika tahun tidak memiliki data */}
          {!pohonKinerjaData && lastAvailableYear && (
            <div className="mb-8 flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                folder_open
              </span>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Pohon Kinerja Tahun {tahun}</h2>
              <p className="text-slate-500 mb-6 max-w-md text-center">
                Tahun {tahun} belum memiliki data Pohon Kinerja. Klik tombol di bawah untuk membuat Pohon Kinerja baru dengan template dari tahun {lastAvailableYear}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewYearForm({
                    tahun: parseInt(tahun),
                    unit_kerja: "DINAS KOMUNIKASI DAN INFORMATIKA",
                  });
                  setShowCreateNewModal(true);
                }}
                className="flex items-center gap-3 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg hover:bg-blue-700 transition"
              >
                <span className="material-symbols-outlined text-[24px]">
                  add_circle
                </span>
                Tambah Pohon Kinerja Baru
              </button>
            </div>
          )}

          {/* Tampilkan tree jika data ada */}
          {pohonKinerjaData && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] w-max min-w-full">
            <section className="w-full min-w-0">
              <div className="min-w-max px-8 pb-20 pt-8">
                {/* Header Pohon Kinerja */}
                <div className="mx-auto mb-8 flex w-72 flex-col items-center rounded-lg border-2 border-emerald-400 bg-white p-4 text-center shadow-sm">
                  <div className="mb-1 font-bold text-emerald-600">
                    POHON KINERJA
                  </div>
                  <div className="text-xs font-bold">
                    {pohonKinerjaData?.unit_kerja ||
                      "DINAS KOMUNIKASI DAN INFORMATIKA"}
                  </div>
                  <div className="text-xs text-slate-500">
                    TAHUN {pohonKinerjaData?.tahun || 2026}
                  </div>
                </div>

                {/* Ultimate */}
                <div className="flex flex-col items-center">
                  <TreeNode
                    node={tree}
                    level="ULTIMATE"
                    selected={selected.id === "ultimate"}
                    onSelect={setSelected}
                  />
                  <div className="h-8 w-px bg-slate-400" />
                </div>

                {/* Intermediate */}
                <div className="relative flex min-w-max justify-center gap-8 pt-5 before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-slate-400">
                  {tree.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex w-[250px] shrink-0 flex-col items-center"
                    >
                      <div className="h-5 w-px shrink-0 bg-slate-400" />

                      {/* Intermediate Node */}
                      <TreeNode
                        node={branch}
                        level="INTERMEDIATE"
                        selected={selected.id === branch.id}
                        onSelect={setSelected}
                      />

                      <div className="my-5 h-5 w-px shrink-0 bg-slate-400" />

                      {/* Immediate */}
                      {branch.children?.length > 0 && (
                        <div className="flex w-full flex-col items-center gap-5">
                          {branch.children.map((child) => (
                            <div
                              key={child.id}
                              className="flex w-full flex-col items-center"
                            >
                              {/* Immediate Node */}
                              <TreeNode
                                node={child}
                                level="IMMEDIATE"
                                selected={selected.id === child.id}
                                onSelect={setSelected}
                              />

                              {/* Output */}
                              {child.children?.length > 0 && (
                                <div className="mt-5 flex w-full flex-col items-center gap-5 border-t border-slate-400 pt-5">
                                  {child.children.map((output) => (
                                    <div
                                      key={output.id}
                                      className="relative flex w-full flex-col items-center before:absolute before:-top-5 before:h-5 before:border-l before:border-slate-400"
                                    >
                                      <TreeNode
                                        node={output}
                                        level="OUTPUT"
                                        selected={selected.id === output.id}
                                        onSelect={setSelected}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tambah Output untuk Immediate ini */}
                              <button
                                type="button"
                                onClick={() =>
                                  addNode({
                                    ...child,
                                    level: "IMMEDIATE",
                                  })
                                }
                                className="mb-3 mt-3 flex print:hidden items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  add_circle
                                </span>
                                Tambah Output
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tambah Immediate untuk Intermediate ini */}
                      <button
                        type="button"
                        onClick={() => addImmediate(branch)}
                        className="mt-5 mb-4 flex print:hidden items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-950"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          add_circle
                        </span>
                        Tambah Immediate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
          )}
        </div>
      </div>
    </main>
    {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={(tahunBaru) => { setShowUpload(false); setTahun(tahunBaru); }} />}

    {showArchiveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Konfirmasi Pengarsipan</h2>
          <p className="text-slate-600 mb-2">
            Apakah Anda yakin ingin mengarsipkan Pohon Kinerja tahun <strong>{pohonKinerjaData?.tahun}</strong>?
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Data yang diarsipkan dapat dilihat di menu "Lihat Arsipan" dan dapat dipulihkan kapan saja.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowArchiveModal(false)}
              disabled={archivingId !== null}
              className="flex-1 rounded border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={archivingId !== null}
              className="flex-1 rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {archivingId !== null ? "Memproses..." : "Arsipkan"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showArchivedList && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 border-b border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Data Arsipan Pohon Kinerja</h2>
              <button
                type="button"
                onClick={() => setShowArchivedList(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {loadingArchived ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <span className="material-symbols-outlined animate-spin text-blue-600">
                  autorenew
                </span>
                <p className="text-slate-600">Memuat data arsipan...</p>
              </div>
            ) : archivedData.length === 0 ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
                  folder_open
                </span>
                <p className="text-slate-500">Tidak ada data arsipan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedData.map((item) => (
                  <div key={item.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Tahun {item.tahun}</h3>
                      <p className="text-sm text-slate-600">{item.unit_kerja}</p>
                      <div className="mt-2 flex gap-4 text-sm text-slate-500">
                        <span>Ultimate: {item.total_ultimate}</span>
                        <span>Intermediate: {item.total_intermediate}</span>
                        <span>Immediate: {item.total_immediate}</span>
                        <span>Output: {item.total_output}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Diarsipkan: {new Date(item.archived_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(item.id)}
                      disabled={archivingId !== null}
                      className="ml-4 flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        restore
                      </span>
                      {archivingId === item.id ? "Memproses..." : "Pulihkan"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {showCreateNewModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Pohon Kinerja</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Tambah Tahun Baru</h2>
              </div>
              <button type="button" onClick={() => setShowCreateNewModal(false)} className="text-slate-400 hover:text-red-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Struktur tahun <strong>{lastAvailableYear || "sebelumnya"}</strong> akan disalin menjadi Pohon Kinerja tahun <strong>{newYearForm.tahun}</strong>.
              Setelah dibuat, hasil salinan langsung dapat diedit, ditambah, dan dihapus.
            </div>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tahun
              <input
                type="number"
                value={newYearForm.tahun}
                onChange={(e) => setNewYearForm((prev) => ({ ...prev, tahun: e.target.value }))}
                className="rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700"
                disabled={creatingNewYear}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unit Kerja
              <input
                type="text"
                value={newYearForm.unit_kerja}
                onChange={(e) => setNewYearForm((prev) => ({ ...prev, unit_kerja: e.target.value }))}
                className="rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700"
                disabled={creatingNewYear}
              />
            </label>
          </div>

          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              onClick={() => setShowCreateNewModal(false)}
              disabled={creatingNewYear}
              className="flex-1 rounded border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateNewYear}
              disabled={creatingNewYear}
              className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingNewYear ? "Membuat..." : "Buat & Salin Pohon"}
            </button>
          </div>
        </div>
      </div>
    )}
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