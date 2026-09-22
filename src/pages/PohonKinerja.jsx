import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useAuth } from "../context/AuthContext";

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

const BIDANG_OPTIONS = [
  { value: "komunikasi", label: "Bidang Komunikasi" },
  { value: "statistik", label: "Bidang Statistik" },
  { value: "persandian", label: "Bidang Persandian" },
  { value: "aplikasi", label: "Bidang Aplikasi" },
  { value: "kesekretariatan", label: "Kesekretariatan" },
];

function getRoleLabel(role) {
  return (
    BIDANG_OPTIONS.find((b) => b.value === role)?.label ||
    { admin: "Administrator" }[role] ||
    role ||
    "Pengguna"
  );
}

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
  const bidangBadge = level === "INTERMEDIATE" && node.bidang
    ? `<div style="padding:4px;background:#e0edff;color:#1e40af;font-size:9px;font-weight:bold;text-transform:capitalize">Bidang ${escapeHtml(node.bidang)}</div>`
    : "";
  return `<div class="node" style="border-color:${colors[0]};-webkit-print-color-adjust:exact;print-color-adjust:exact"><div class="head" style="background:${colors[1]};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">${escapeHtml(node.title)}</div>${bidangBadge}<div class="indicator">${escapeHtml(node.indicator || "Belum ada indikator")}</div></div>`;
}

function TreeNode({ node, level, selected, onSelect, domRef }) {
  const nodeLevel = node.level || level;
  const colors = palette[nodeLevel];
  const bidangLabel = node.bidang
    ? BIDANG_OPTIONS.find((b) => b.value === node.bidang)?.label || `Bidang ${node.bidang}`
    : null;

  return (
    <button
      type="button"
      ref={domRef}
      onClick={() => onSelect(node, nodeLevel)}
      className={`group relative flex w-[250px] flex-col overflow-visible rounded-lg border-2 bg-white text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors.border} ${selected ? "ring-4 ring-blue-100" : ""}`}
    >
      <span className={`absolute -left-7 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[9px] font-bold leading-none tracking-[0.14em] ${colors.label}`}>
        {nodeLevel}
      </span>
      <span className={`${colors.head} min-h-[48px] px-3 py-2 text-[10px] font-extrabold leading-tight text-white`}>{node.title}</span>
      {nodeLevel === "INTERMEDIATE" && bidangLabel && (
        <span className="border-t border-blue-100 bg-blue-50/90 px-2 py-1 text-[9px] font-bold text-blue-800">
          {bidangLabel}
        </span>
      )}
      <span className="min-h-[37px] border-t border-slate-200 px-3 py-2 text-[10px] leading-tight text-slate-600">{node.indicator || "Belum ada indikator"}</span>
      <span className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-blue-950 text-xs text-white group-hover:flex">✎</span>
    </button>
  );
}

// Menggambar garis panah langsung antar-node (ultimate -> intermediate -> immediate -> output)
// berdasarkan posisi nyata tiap kotak, alih-alih garis bus/horizontal statis.
function TreeConnectors({ containerRef, nodeRefs, edges }) {
  const [lines, setLines] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const recompute = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const nextLines = [];

      edges.forEach(({ fromId, toId, orthogonal }) => {
        const a = nodeRefs.current[fromId];
        const b = nodeRefs.current[toId];
        if (!a || !b) return;
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        nextLines.push({
          key: `${fromId}=>${toId}`,
          orthogonal: !!orthogonal,
          x1: rectA.left + rectA.width / 2 - containerRect.left,
          y1: rectA.bottom - containerRect.top,
          x2: rectB.left + rectB.width / 2 - containerRect.left,
          y2: rectB.top - containerRect.top,
        });
      });

      setLines(nextLines);
      setSize({ width: container.scrollWidth, height: container.scrollHeight });
    };

    recompute();

    const observer = new ResizeObserver(recompute);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", recompute);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [containerRef, nodeRefs, edges]);

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={size.width}
      height={size.height}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker id="tree-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
        </marker>
      </defs>
      {lines.map((line) => (
        line.orthogonal ? (
          <path
            key={line.key}
            d={`M ${line.x1} ${line.y1} L ${line.x1} ${(line.y1 + line.y2) / 2} L ${line.x2} ${(line.y1 + line.y2) / 2} L ${line.x2} ${line.y2}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            markerEnd="url(#tree-arrow)"
          />
        ) : (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#94a3b8"
            strokeWidth="1.5"
            markerEnd="url(#tree-arrow)"
          />
        )
      ))}
    </svg>
  );
}

function getAuthHeaders(extra = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("e_sakip_token") : null;
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function EditablePohonKinerja() {
  const { user } = useAuth();
  const role = user?.role || (() => {
    try {
      return JSON.parse(localStorage.getItem("e_sakip_user") || "{}")?.role;
    } catch {
      return null;
    }
  })();
  const isAdmin = role === "admin";
  const roleLabel = {
    admin: "Administrator",
    komunikasi: "Bidang Komunikasi",
    statistik: "Bidang Statistik",
    persandian: "Bidang Persandian",
    aplikasi: "Bidang Aplikasi",
    kesekretariatan: "Kesekretariatan",
  }[role] || role || "Pengguna";

  const [tree, setTree] = useState(initialTree);
  const [selected, setSelected] = useState({ ...initialTree, id: "ultimate", level: "ULTIMATE" });
  const [showUpload, setShowUpload] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Modal edit node (setiap perubahan langsung tersimpan ke server, tanpa tombol Simpan Perubahan)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", indicator: "", level: "ULTIMATE", bidang: "komunikasi" });
  const [savingNode, setSavingNode] = useState(false);
  const [addingNode, setAddingNode] = useState(false);

  // Modal tambah node intermediate
  const [showAddIntermediateModal, setShowAddIntermediateModal] = useState(false);
  const [newIntermediateForm, setNewIntermediateForm] = useState({
    title: "",
    indicator: "",
    bidang: "komunikasi",
  });
  const [addingIntermediate, setAddingIntermediate] = useState(false);

  // Konfirmasi hapus node
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);

  // Mode lihat-saja untuk pohon kinerja yang sudah diarsipkan
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [loadingArchivedView, setLoadingArchivedView] = useState(false);

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

  // Referensi untuk menggambar garis panah langsung antar-node
  const treeSectionRef = useRef(null);
  const nodeRefs = useRef({});
  const registerNodeRef = (id) => (el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  };

  const ultimateId = tree.id || "ultimate";
  const edges = [];
  tree.branches.forEach((branch) => {
    edges.push({ fromId: ultimateId, toId: branch.id, orthogonal: true });
    (branch.children || []).forEach((child) => {
      edges.push({ fromId: branch.id, toId: child.id, orthogonal: true });
      (child.children || []).forEach((output) => {
        edges.push({ fromId: child.id, toId: output.id });
      });
    });
  });

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

  // Mengambil pohon kinerja aktif (bukan arsip) untuk tahun/unit kerja yang dipilih.
  // Dipakai baik oleh effect di bawah maupun tombol "Kembali ke Tahun Aktif".
  const loadTreeData = async () => {
    if (!tahun) return;

    setIsArchivedView(false);
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

      // Deteksi apakah data yang di-load ternyata sudah diarsipkan, supaya semua
      // guard (edit/hapus/tambah node, tombol aksi) otomatis terkunci walau
      // dimuat lewat alur pemilihan tahun biasa, bukan hanya lewat "Lihat Arsipan".
      // Dicocokkan terhadap daftar arsip (endpoint /archived) karena endpoint /tree
      // tidak selalu menyertakan flag arsip secara eksplisit.
      const archivedList = await fetchArchivedList();
      const isArchived = archivedList.some(
        (item) =>
          Number(item.tahun) === Number(data.data.tahun) &&
          String(item.unit_kerja || "").trim().toLowerCase() ===
            String(data.data.unit_kerja || "").trim().toLowerCase()
      );

      // Use tree data from database directly
      setTreeData(data.data.tree);
      setPohonKinerjaData(data.data);
      setTree(data.data.tree);
      setSelected({ ...data.data.tree, id: data.data.tree.id || "ultimate", level: "ULTIMATE" });
      setIsArchivedView(isArchived);
      setLoadingData(false);
    } catch (err) {
      setErrorData(err.message || "Gagal mengambil data");
      setTreeData(null);
      setPohonKinerjaData(null);
      setLoadingData(false);
    }
  };

  // Fetch tree data when tahun changes
  useEffect(() => {
    loadTreeData();
  }, [tahun, unitKerja]);

  // --- Helper murni untuk mengubah struktur tree secara lokal ---
  const patchNodeInTree = (root, id, patch) => {
    if (id === (root.id || "ultimate")) return { ...root, ...patch };
    const applyToChildren = (node) => {
      if (node.id === id) return { ...node, ...patch };
      if (!node.children) return node;
      return { ...node, children: node.children.map(applyToChildren) };
    };
    return { ...root, branches: root.branches.map(applyToChildren) };
  };

  const removeNodeFromTree = (root, id) => ({
    ...root,
    branches: root.branches
      .filter((branch) => branch.id !== id)
      .map((branch) => ({
        ...branch,
        children: (branch.children || [])
          .filter((child) => child.id !== id)
          .map((child) => ({
            ...child,
            children: (child.children || []).filter((output) => output.id !== id),
          })),
      })),
  });

  const insertNodeIntoTree = (root, target, node) => {
    if (target.level === "ULTIMATE") {
      return { ...root, branches: [...root.branches, node] };
    }
    if (target.level === "INTERMEDIATE") {
      return {
        ...root,
        branches: root.branches.map((branch) =>
          branch.id === target.id ? { ...branch, children: [...(branch.children || []), node] } : branch
        ),
      };
    }
    // IMMEDIATE -> menambah OUTPUT
    return {
      ...root,
      branches: root.branches.map((branch) => ({
        ...branch,
        children: (branch.children || []).map((child) =>
          child.id === target.id ? { ...child, children: [...(child.children || []), node] } : child
        ),
      })),
    };
  };

  // Membuka modal edit untuk node yang diklik
  const openEditModal = (node, level) => {
    const nodeLevel = node.level || level;
    setSelected({ ...node, level: nodeLevel });
    setEditForm({
      title: node.title || "",
      indicator: node.indicator || "",
      level: nodeLevel,
      bidang: node.bidang || "komunikasi",
    });
    setShowEditModal(true);
    setErrorData("");
  };

  // Menyimpan node baru langsung ke server (tanpa tombol Simpan Perubahan)
  const addNode = async (target = selected) => {
    if (isArchivedView) {
      setErrorData("Pohon Kinerja arsip hanya dapat dilihat. Pulihkan terlebih dahulu untuk menambah node.");
      return;
    }
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

    const defaultTitle = nodeLevel === "INTERMEDIATE"
      ? "SASARAN ANTARA BARU"
      : nodeLevel === "IMMEDIATE"
        ? "SASARAN LANGSUNG BARU"
        : "OUTPUT BARU";
    const defaultIndicator = "Tambahkan indikator";

    setAddingNode(true);
    setErrorData("");
    try {
      const rawTargetId = target.id ? String(target.id).replace(/^[a-z]+-/, "") : null;
      const parentId = rawTargetId && !isNaN(rawTargetId) ? Number(rawTargetId) : target.id;

      const response = await fetch("http://localhost:8000/api/pohon-kinerja/node", {
        method: "POST",
        headers: getAuthHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
        body: JSON.stringify({
          level: nodeLevel,
          parent_id: parentId,
          title: defaultTitle,
          indicator: defaultIndicator,
          ...(nodeLevel === "INTERMEDIATE" ? { bidang: "komunikasi" } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Gagal menambahkan ${nodeLevel}`);
      }

      const newNode = {
        id: `${nodeLevel.toLowerCase()}-${data.data.id}`,
        level: nodeLevel,
        title: defaultTitle,
        indicator: defaultIndicator,
        ...(nodeLevel === "INTERMEDIATE" ? { bidang: data.data.bidang || "komunikasi" } : {}),
        children: [],
      };

      setTree((current) => insertNodeIntoTree(current, target, newNode));
      // Langsung buka modal supaya node baru bisa diberi nama/indikator.
      openEditModal(newNode, nodeLevel);
    } catch (error) {
      setErrorData(error.message || "Gagal menambahkan node");
    } finally {
      setAddingNode(false);
    }
  };

  // Buka modal untuk menambah Intermediate secara terstruktur (memilih bidang, sasaran, indikator)
  const handleOpenAddIntermediate = () => {
    if (isArchivedView) {
      setErrorData("Pohon Kinerja arsip hanya dapat dilihat. Pulihkan terlebih dahulu untuk menambah node.");
      return;
    }
    if (!pohonKinerjaData?.pohon_kinerja_id) {
      setErrorData("Pohon Kinerja tahun ini belum dibuat. Tambahkan Pohon Kinerja Baru terlebih dahulu.");
      return;
    }
    setNewIntermediateForm({
      title: "",
      indicator: "",
      bidang: "komunikasi",
    });
    setShowAddIntermediateModal(true);
    setErrorData("");
  };

  // Submit penambahan node Intermediate dari modal
  const handleAddIntermediateSubmit = async () => {
    if (!newIntermediateForm.title.trim()) {
      setErrorData("Tujuan / Sasaran Intermediate wajib diisi.");
      return;
    }
    setAddingIntermediate(true);
    setErrorData("");
    try {
      const rawUltimateId = tree?.id ? String(tree.id).replace(/^[a-z]+-/, "") : null;
      const parentId = rawUltimateId && !isNaN(rawUltimateId) ? Number(rawUltimateId) : pohonKinerjaData.pohon_kinerja_id;

      const response = await fetch("http://localhost:8000/api/pohon-kinerja/node", {
        method: "POST",
        headers: getAuthHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
        body: JSON.stringify({
          level: "INTERMEDIATE",
          pohon_kinerja_id: pohonKinerjaData.pohon_kinerja_id,
          parent_id: parentId,
          title: newIntermediateForm.title.trim(),
          indicator: newIntermediateForm.indicator.trim() || "Tambahkan indikator",
          bidang: newIntermediateForm.bidang,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menambahkan node Intermediate.");
      }

      const newNode = {
        id: `intermediate-${data.data.id}`,
        level: "INTERMEDIATE",
        title: data.data.sasaran || newIntermediateForm.title.trim(),
        indicator: data.data.indikator_sasaran || newIntermediateForm.indicator.trim() || "Tambahkan indikator",
        bidang: data.data.bidang || newIntermediateForm.bidang,
        children: [],
      };

      setTree((current) => ({
        ...current,
        branches: [...(current.branches || []), newNode],
      }));
      setShowAddIntermediateModal(false);
    } catch (error) {
      setErrorData(error.message || "Gagal menambahkan node Intermediate.");
    } finally {
      setAddingIntermediate(false);
    }
  };

  const addIntermediate = handleOpenAddIntermediate;

  const addImmediate = (target) => addNode({ ...target, level: "INTERMEDIATE" });

  // Menyimpan perubahan judul/indikator/bidang node yang sedang dibuka di modal, langsung ke server.
  const saveNodeEdit = async () => {
    if (!selected?.id) return;
    if (isArchivedView) {
      setErrorData("Pohon Kinerja arsip hanya dapat dilihat. Pulihkan terlebih dahulu untuk mengedit.");
      return;
    }
    setSavingNode(true);
    setErrorData("");
    try {
      if (selected.level !== "ULTIMATE") {
        const [level, idString] = selected.id.split("-");
        const id = Number(idString);
        if (!level || !Number.isInteger(id)) {
          throw new Error("ID node tidak valid.");
        }
        const payload = {
          title: editForm.title || "",
          indicator: editForm.indicator || "",
          ...(selected.level === "INTERMEDIATE" ? { bidang: editForm.bidang || "komunikasi" } : {}),
        };
        const response = await fetch(`http://localhost:8000/api/pohon-kinerja/node/${level}/${id}`, {
          method: "PUT",
          headers: getAuthHeaders({ Accept: "application/json", "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Gagal menyimpan perubahan");
        }
      }

      const patch = {
        title: editForm.title,
        indicator: editForm.indicator,
        ...(selected.level === "INTERMEDIATE" ? { bidang: editForm.bidang } : {}),
      };

      setTree((current) => patchNodeInTree(current, selected.id, patch));
      setSelected((current) => ({ ...current, ...patch }));
      setShowEditModal(false);
    } catch (error) {
      setErrorData(error.message || "Gagal menyimpan perubahan");
    } finally {
      setSavingNode(false);
    }
  };

  // Meminta konfirmasi sebelum node benar-benar dihapus.
  const requestDeleteNode = () => {
    if (selected.level === "ULTIMATE") return;
    if (isArchivedView) {
      setErrorData("Pohon Kinerja arsip hanya dapat dilihat. Pulihkan terlebih dahulu untuk menghapus.");
      return;
    }
    setShowDeleteConfirm(true);
  };

  // Menghapus node dari server setelah dikonfirmasi.
  const confirmDeleteNode = async () => {
    if (selected.level === "ULTIMATE") {
      setShowDeleteConfirm(false);
      return;
    }

    setDeletingNode(true);
    setErrorData("");
    try {
      const [level, idString] = selected.id.split("-");
      const id = Number(idString);
      if (!level || !Number.isInteger(id)) {
        throw new Error(`ID node yang dihapus tidak valid: ${selected.id}`);
      }

      const response = await fetch(`http://localhost:8000/api/pohon-kinerja/node/${level}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders({ Accept: "application/json" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Gagal menghapus ${selected.level}`);
      }

      const deletedId = selected.id;
      setTree((current) => removeNodeFromTree(current, deletedId));
      setSelected({ ...tree, id: tree.id || "ultimate", level: "ULTIMATE" });
      setShowDeleteConfirm(false);
      setShowEditModal(false);
    } catch (error) {
      setErrorData(error.message || "Gagal menghapus node");
    } finally {
      setDeletingNode(false);
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
        { method: "POST", headers: getAuthHeaders({ Accept: "application/json" }) }
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
  // Mengambil daftar arsip dan mengembalikannya (selain menyimpan ke state),
  // supaya bisa langsung dipakai untuk mencocokkan status arsip tahun yang sedang dimuat.
  const fetchArchivedList = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/pohon-kinerja/archived', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await response.json();
      const list = response.ok ? (data.data || []) : [];
      setArchivedData(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch archived data:', err);
      setArchivedData([]);
      return [];
    }
  };

  const fetchArchivedData = async () => {
    setLoadingArchived(true);
    await fetchArchivedList();
    setLoadingArchived(false);
  };

  // Memuat pohon kinerja arsip apa adanya (hanya-lihat), tanpa mengubah data aktif.
  const handleViewArchived = async (id) => {
    setLoadingArchivedView(true);
    setErrorData("");
    try {
      const response = await fetch(`http://localhost:8000/api/pohon-kinerja/archived/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal memuat data arsip");
      }

      setTreeData(data.data.tree);
      setPohonKinerjaData(data.data);
      setTree(data.data.tree);
      setSelected({ ...data.data.tree, id: data.data.tree.id || "ultimate", level: "ULTIMATE" });
      setIsArchivedView(true);
      setShowArchivedList(false);
    } catch (error) {
      setErrorData(error.message || "Gagal memuat data arsip");
    } finally {
      setLoadingArchivedView(false);
    }
  };

  // Keluar dari mode lihat-arsip dan memuat ulang pohon kinerja aktif untuk tahun yang dipilih.
  const handleBackToActive = () => {
    loadTreeData();
  };

  const handleRestore = async (id) => {
    setArchivingId(id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/pohon-kinerja/restore/${id}`,
        {
          method: "POST",
          headers: getAuthHeaders({
            Accept: "application/json",
          }),
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
          headers: getAuthHeaders({
            Accept: "application/json",
            "Content-Type": "application/json",
          }),
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
      <div className="flex flex-wrap items-center gap-2">

        {/* Menu Aksi */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActionMenu((current) => !current)}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              menu
            </span>
            Menu
            <span className="material-symbols-outlined text-[18px]">
              {showActionMenu ? "expand_less" : "expand_more"}
            </span>
          </button>

          {showActionMenu && (
            <div className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">

              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  downloadExcel(
                    tree,
                    tahun,
                    unitKerja || pohonKinerjaData?.unit_kerja
                  );
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="material-symbols-outlined text-[19px]">table_view</span>
                Export Excel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  window.print();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="material-symbols-outlined text-[19px]">picture_as_pdf</span>
                Export PDF
              </button>

              {!isArchivedView && isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowActionMenu(false);
                    setShowUpload(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="material-symbols-outlined text-[19px]">upload</span>
                  Upload File
                </button>
              )}

              {pohonKinerjaData && !isArchivedView && isAdmin && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      setShowArchiveModal(true);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <span className="material-symbols-outlined text-[19px]">archive</span>
                    Arsipkan Tahun
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  setShowArchivedList(true);
                  if (archivedData.length === 0) {
                    fetchArchivedData();
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700"
              >
                <span className="material-symbols-outlined text-[19px]">history</span>
                Lihat Arsipan
              </button>
            </div>
          )}
        </div>

        {/* Tambah Intermediate khusus admin */}
        {!isArchivedView && isAdmin && (
          <button
            type="button"
            onClick={addIntermediate}
            disabled={addingNode || addingIntermediate}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {addingIntermediate ? "hourglass_empty" : "add"}
            </span>
            {addingIntermediate ? "Menambahkan..." : "Tambah Intermediate"}
          </button>
        )}

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

      {isArchivedView && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="material-symbols-outlined">visibility</span>
            <p className="text-sm font-semibold">
              Mode hanya-lihat &middot; Pohon Kinerja arsip tahun {pohonKinerjaData?.tahun} tidak dapat diedit, dihapus, atau ditambah node baru.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBackToActive}
            className="flex items-center gap-2 rounded border border-amber-700 px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Tahun Aktif
          </button>
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
          {/* Tampilkan button "Tambah Pohon Kinerja Baru" ketika tahun tidak memiliki data (Khusus Admin) */}
          {!pohonKinerjaData && lastAvailableYear && (
            <div className="mb-8 flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                folder_open
              </span>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Pohon Kinerja Tahun {tahun}</h2>
              <p className="text-slate-500 mb-6 max-w-md text-center">
                {isAdmin
                  ? `Tahun ${tahun} belum memiliki data Pohon Kinerja. Klik tombol di bawah untuk membuat Pohon Kinerja baru dengan template dari tahun ${lastAvailableYear}.`
                  : `Tahun ${tahun} belum memiliki data Pohon Kinerja.`}
              </p>
              {isAdmin && (
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
              )}
            </div>
          )}

          {/* Tampilkan tree jika data ada */}
          {pohonKinerjaData && (
          <div className="w-max min-w-full">
            <section className="w-full min-w-0">
              <div ref={treeSectionRef} className="relative flex flex-col items-center px-8 pb-20 pt-8">
                {/* Lapisan garis panah langsung antar-node */}
                <TreeConnectors containerRef={treeSectionRef} nodeRefs={nodeRefs} edges={edges} />

                {/* Header Pohon Kinerja */}
                <div className="relative mx-auto mb-8 flex w-72 flex-col items-center rounded-lg border-2 border-emerald-400 bg-white p-4 text-center shadow-sm">
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
                <div className="relative flex flex-col items-center">
                  <TreeNode
                    node={tree}
                    level="ULTIMATE"
                    selected={selected.id === ultimateId}
                    onSelect={openEditModal}
                    domRef={registerNodeRef(ultimateId)}
                  />
                  <div className="h-8" />
                </div>

                {/* Intermediate */}
                <div className="relative flex justify-center gap-8 pt-5">
                  {tree.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="relative flex shrink-0 flex-col items-center"
                    >
                      <div className="h-5 shrink-0" />

                      {/* Intermediate Node */}
                      <TreeNode
                        node={branch}
                        level="INTERMEDIATE"
                        selected={selected.id === branch.id}
                        onSelect={openEditModal}
                        domRef={registerNodeRef(branch.id)}
                      />

                      <div className="my-5 h-5 shrink-0" />

                      {/* Immediate - sejajar berdampingan, bukan bertumpuk ke bawah */}
                      {branch.children?.length > 0 && (
                        <div className="relative flex flex-wrap items-start justify-center gap-6">
                          {branch.children.map((child) => (
                            <div
                              key={child.id}
                              className="relative flex flex-col items-center"
                            >
                              {/* Immediate Node */}
                              <TreeNode
                                node={child}
                                level="IMMEDIATE"
                                selected={selected.id === child.id}
                                onSelect={openEditModal}
                                domRef={registerNodeRef(child.id)}
                              />

                              {/* Output */}
                              {child.children?.length > 0 && (
                                <div className="mt-5 flex flex-col items-center gap-5 pt-5">
                                  {child.children.map((output) => (
                                    <div
                                      key={output.id}
                                      className="relative flex flex-col items-center"
                                    >
                                      <TreeNode
                                        node={output}
                                        level="OUTPUT"
                                        selected={selected.id === output.id}
                                        onSelect={openEditModal}
                                        domRef={registerNodeRef(output.id)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Tambah Output untuk Immediate ini (Khusus Admin) */}
                              {!isArchivedView && isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    addNode({
                                      ...child,
                                      level: "IMMEDIATE",
                                    })
                                  }
                                  disabled={addingNode}
                                  className="mb-1 mt-3 flex print:hidden items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    add_circle
                                  </span>
                                  Tambah Output
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tambah Immediate untuk Intermediate ini (Khusus Admin) */}
                      {!isArchivedView && isAdmin && (
                        <button
                          type="button"
                          onClick={() => addImmediate(branch)}
                          disabled={addingNode}
                          className="mt-5 mb-4 flex print:hidden items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            add_circle
                          </span>
                          Tambah Immediate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
          )}
        </div>
      </div>
    </main>
    {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={(tahunBaru) => { setShowUpload(false); setTahun(tahunBaru); }} />}

    {showEditModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                {isArchivedView
                  ? "Lihat Node (Arsip)"
                  : selected.level === "ULTIMATE" ? "Edit Ultimate" : "Editor Node"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.level}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              disabled={savingNode || deletingNode}
              className="text-slate-400 hover:text-red-600 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4 p-6">
            {errorData && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {errorData}
              </div>
            )}

            {isArchivedView && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Node arsip ini hanya dapat dilihat. Pulihkan pohon kinerja ini terlebih dahulu untuk mengeditnya.
              </div>
            )}

            {!isArchivedView && !isAdmin && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Mode lihat-saja: Peran Anda ({getRoleLabel(role)}) hanya dapat melihat detail node ini. Perubahan struktur hanya dapat dilakukan oleh Administrator.
              </div>
            )}

            {selected.level === "INTERMEDIATE" && (
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bidang
                <select
                  value={editForm.bidang || "komunikasi"}
                  onChange={(event) => setEditForm((current) => ({ ...current, bidang: event.target.value }))}
                  disabled={isArchivedView || !isAdmin || savingNode || deletingNode}
                  className="rounded border border-slate-300 bg-white p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {BIDANG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tujuan / Sasaran
              <textarea
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                rows="4"
                readOnly={isArchivedView || !isAdmin}
                disabled={savingNode || deletingNode}
                className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Indikator
              <textarea
                value={editForm.indicator}
                onChange={(event) => setEditForm((current) => ({ ...current, indicator: event.target.value }))}
                rows="3"
                readOnly={isArchivedView || !isAdmin}
                disabled={savingNode || deletingNode}
                className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-6">
            {isArchivedView || !isAdmin ? (
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="ml-auto rounded bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
              >
                Tutup
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={requestDeleteNode}
                  disabled={selected.level === "ULTIMATE" || savingNode || deletingNode}
                  className="flex items-center justify-center gap-1 rounded border border-red-800 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                  Hapus
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={savingNode || deletingNode}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveNodeEdit}
                  disabled={savingNode || deletingNode}
                  className="flex items-center justify-center gap-1 rounded bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[17px]">save</span>
                  {savingNode ? "Menyimpan..." : "Simpan"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {showAddIntermediateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Tambah Node</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">INTERMEDIATE</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddIntermediateModal(false)}
              disabled={addingIntermediate}
              className="text-slate-400 hover:text-red-600 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-4 p-6">
            {errorData && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {errorData}
              </div>
            )}

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bidang
              <select
                value={newIntermediateForm.bidang}
                onChange={(event) =>
                  setNewIntermediateForm((current) => ({ ...current, bidang: event.target.value }))
                }
                disabled={addingIntermediate}
                className="rounded border border-slate-300 bg-white p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100"
              >
                {BIDANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tujuan / Sasaran
              <textarea
                value={newIntermediateForm.title}
                onChange={(event) =>
                  setNewIntermediateForm((current) => ({ ...current, title: event.target.value }))
                }
                rows="4"
                placeholder="Masukkan sasaran intermediate..."
                disabled={addingIntermediate}
                className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Indikator Sasaran
              <textarea
                value={newIntermediateForm.indicator}
                onChange={(event) =>
                  setNewIntermediateForm((current) => ({ ...current, indicator: event.target.value }))
                }
                rows="3"
                placeholder="Masukkan indikator sasaran..."
                disabled={addingIntermediate}
                className="resize-y rounded border border-slate-300 p-2 text-sm font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-950 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-6">
            <button
              type="button"
              onClick={() => setShowAddIntermediateModal(false)}
              disabled={addingIntermediate}
              className="ml-auto rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddIntermediateSubmit}
              disabled={addingIntermediate}
              className="flex items-center justify-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              {addingIntermediate ? "Menyimpan..." : "Tambah Intermediate"}
            </button>
          </div>
        </div>
      </div>
    )}

    {showDeleteConfirm && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Konfirmasi Hapus</h2>
          <p className="mb-2 text-slate-600">
            Apakah Anda yakin ingin menghapus node <strong>"{selected.title}"</strong>?
          </p>
          <p className="mb-6 text-sm text-red-600">
            Tindakan ini tidak dapat dibatalkan. Node beserta seluruh turunannya (jika ada) akan dihapus permanen.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingNode}
              className="flex-1 rounded border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDeleteNode}
              disabled={deletingNode}
              className="flex-1 rounded bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingNode ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    )}

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
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewArchived(item.id)}
                        disabled={archivingId !== null || loadingArchivedView}
                        className="flex items-center gap-2 rounded border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          visibility
                        </span>
                        {loadingArchivedView ? "Memuat..." : "Lihat"}
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id)}
                          disabled={archivingId !== null || loadingArchivedView}
                          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            restore
                          </span>
                          {archivingId === item.id ? "Memproses..." : "Pulihkan"}
                        </button>
                      )}
                    </div>
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
        headers: getAuthHeaders({ Accept: "application/json" }),
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

export default EditablePohonKinerja;