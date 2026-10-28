import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   KONFIGURASI API
   Sesuaikan base URL ini kalau backend Laravel-mu jalan di
   alamat lain (misal domain Laragon virtual host).
========================================================= */

const API_BASE_URL = "http://localhost:8000";
const AUTO_REFRESH_INTERVAL_MS = 20000;

// Diagram pohon tidak diperkecil lebih dari ini; di bawah itu jadi bisa digeser.
const TREE_MIN_SCALE = 0.55;

/* =========================================================
   HELPER: format waktu relatif ("2 jam yang lalu", dst)
========================================================= */

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   METADATA TAMPILAN PER LEVEL NODE
========================================================= */

const LEVEL_META = {
  ULTIMATE: { label: "Ultimate Outcome", icon: "flag", bg: "bg-[#D5E3FF]", color: "text-[#001E40]" },
  INTERMEDIATE: { label: "Intermediate Outcome", icon: "alt_route", bg: "bg-[#DDE1FF]", color: "text-[#173BAB]" },
  IMMEDIATE: { label: "Immediate Outcome", icon: "hub", bg: "bg-[#DCE9FF]", color: "text-[#43474F]" },
  OUTPUT: { label: "Output", icon: "account_tree", bg: "bg-[#D5E3FF]", color: "text-[#001E40]" },
};

export default function Dashboard() {
  /* =======================================================
     TAHUN — ngikut data Pohon Kinerja (bukan tahun sistem).
     - years       : semua tahun yang ada di Pohon Kinerja
                     (termasuk yang sudah diarsipkan)
     - activeYear  : tahun yang sedang dilihat. Awalnya = tahun
                     aktif dari Pohon Kinerja, lalu bisa diganti
                     lewat dropdown.
  ======================================================= */

  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState("");
  const [yearsLoading, setYearsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchYears() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pohon-kinerja/years`);
        if (!response.ok) return;

        const json = await response.json();
        if (cancelled) return;

        const list = (json?.data ?? []).map(String);
        setYears(list);

        const active = json?.active_year ? String(json.active_year) : list[0] || "";

        // Hanya mengisi saat belum ada pilihan, supaya pilihan pengguna
        // tidak ditimpa waktu daftar tahun di-refresh.
        setActiveYear((previous) => previous || active);
      } catch (error) {
        if (!cancelled) console.error("Gagal mengambil daftar tahun:", error);
      } finally {
        if (!cancelled) setYearsLoading(false);
      }
    }

    fetchYears();

    // Daftar tahun ikut di-refresh, jadi tahun baru dari Pohon Kinerja
    // (misal 2027) otomatis muncul di dropdown.
    const intervalId = setInterval(fetchYears, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  /* =======================================================
     RINGKASAN POHON KINERJA — ikut activeYear.
  ======================================================= */

  const [summary, setSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    if (!activeYear) {
      setSummary(null);
      setSummaryStatus(yearsLoading ? "loading" : "success");
      return;
    }

    let cancelled = false;

    async function fetchSummary() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/summary?tahun=${activeYear}`
        );

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setSummary(json.data);
          setSummaryStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil ringkasan pohon kinerja:", error);
          setSummaryStatus("error");
        }
      }
    }

    setSummaryStatus("loading");
    fetchSummary();

    const intervalId = setInterval(fetchSummary, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear, yearsLoading]);

  /* =======================================================
     DIAGRAM POHON KINERJA — ikut activeYear.
  ======================================================= */

  const [tree, setTree] = useState(null);
  const [treeStatus, setTreeStatus] = useState("loading"); // loading | success | empty | error

  useEffect(() => {
    if (!activeYear) {
      setTree(null);
      setTreeStatus(yearsLoading ? "loading" : "empty");
      return;
    }

    let cancelled = false;

    async function fetchTree() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/tree?tahun=${activeYear}`
        );

        if (response.status === 404) {
          if (!cancelled) {
            setTree(null);
            setTreeStatus("empty");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setTree(json.data?.tree ?? null);
          setTreeStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil diagram pohon kinerja:", error);
          setTreeStatus("error");
        }
      }
    }

    setTreeStatus("loading");
    fetchTree();

    const intervalId = setInterval(fetchTree, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear, yearsLoading]);

  /* =======================================================
     AKTIVITAS TERBARU — ikut activeYear.
  ======================================================= */

  const [activities, setActivities] = useState([]);
  const [activitiesStatus, setActivitiesStatus] = useState("loading");

  useEffect(() => {
    if (!activeYear) {
      setActivities([]);
      setActivitiesStatus(yearsLoading ? "loading" : "success");
      return;
    }

    let cancelled = false;

    async function fetchActivities() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pohon-kinerja/recent-activity?tahun=${activeYear}&limit=2`
        );

        if (!response.ok) {
          throw new Error(`Request gagal dengan status ${response.status}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setActivities(json.data ?? []);
          setActivitiesStatus("success");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Gagal mengambil aktivitas terbaru:", error);
          setActivitiesStatus("error");
        }
      }
    }

    setActivitiesStatus("loading");
    fetchActivities();

    const intervalId = setInterval(fetchActivities, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeYear, yearsLoading]);

  /* =======================================================
     DIAGRAM MUAT PENUH — kalau pohon lebih lebar dari kartunya,
     diagram diperkecil otomatis supaya kiri-kanannya kelihatan
     semua. Kalau sudah mentok di skala minimum, sisanya bisa
     digeser (scroll) tanpa ada bagian yang terpotong.
  ======================================================= */

  const treeViewportRef = useRef(null);
  const treeContentRef = useRef(null);
  const [treeFit, setTreeFit] = useState({ scale: 1, width: 0, height: 0 });

  useEffect(() => {
    const viewport = treeViewportRef.current;
    const content = treeContentRef.current;

    if (!viewport || !content) return;

    function measure() {
      const naturalWidth = content.offsetWidth;
      const naturalHeight = content.offsetHeight;
      const available = viewport.clientWidth;

      const scale =
        naturalWidth > available
          ? Math.max(available / naturalWidth, TREE_MIN_SCALE)
          : 1;

      setTreeFit((previous) =>
        previous.scale === scale &&
        previous.width === naturalWidth * scale &&
        previous.height === naturalHeight * scale
          ? previous
          : {
              scale,
              width: naturalWidth * scale,
              height: naturalHeight * scale,
            }
      );
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);

    return () => observer.disconnect();
  }, [tree, treeStatus]);

  /* =======================================================
     STAT CARDS — Ultimate, Intermediate, Immediate, Output
  ======================================================= */

  const stats = useMemo(() => {
    const formatValue = (value) => {
      if (summaryStatus === "loading") return "...";
      if (summaryStatus === "error") return "-";
      return String(value ?? 0);
    };

    return [
      {
        title: "Jumlah Ultimate Outcome",
        value: formatValue(summary?.ultimate),
        icon: "flag",
      },
      {
        title: "Jumlah Intermediate Outcome",
        value: formatValue(summary?.intermediate),
        icon: "alt_route",
      },
      {
        title: "Jumlah Immediate Outcome",
        value: formatValue(summary?.immediate),
        icon: "hub",
      },
      {
        title: "Jumlah Output",
        value: formatValue(summary?.output),
        icon: "account_tree",
      },
    ];
  }, [summary, summaryStatus]);

  return (
    <div className="w-full bg-[#F8FAFC]">
      {/* =====================================================
          DASHBOARD CONTENT
      ====================================================== */}

      <main className="p-4 md:p-8 flex flex-col gap-6">
        {/* ================= WELCOME ================= */}
        <section className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10 bg-gradient-to-l from-[#001E40] to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-2xl font-semibold text-[#001E40] mb-2">
              Selamat Datang, Admin
            </h1>

            <p className="text-sm md:text-base text-[#43474F] max-w-3xl leading-6">
              Kelola dan pantau kinerja instansi melalui E-SAKIP
              KOMINFO. Sistem ini dirancang untuk memastikan
              akuntabilitas dan transparansi dalam pencapaian target
              strategis.
            </p>
          </div>
        </section>

        {/* ================= STATISTICS ================= */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="dashboard-year"
                className="text-sm text-[#43474F]"
              >
                Pohon Kinerja tahun
              </label>

              <select
                id="dashboard-year"
                value={activeYear}
                onChange={(event) => setActiveYear(event.target.value)}
                disabled={years.length === 0}
                className="rounded-md border border-[#C3C6D1] bg-white px-2 py-1 text-sm font-semibold text-[#001E40] outline-none focus:border-[#001E40] disabled:cursor-not-allowed disabled:bg-[#EFF4FF] disabled:text-[#737780]"
              >
                {years.length === 0 && (
                  <option value="">
                    {yearsLoading ? "Memuat..." : "Belum ada tahun"}
                  </option>
                )}
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {summaryStatus === "error" && (
              <p className="text-xs text-[#93000A]">
                Gagal memuat data pohon kinerja.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm"
              >
                <div className="w-10 h-10 rounded flex items-center justify-center bg-[#D5E3FF] text-[#1F477B]">
                  <span className="material-symbols-outlined">
                    {stat.icon}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-[#43474F] mb-1">
                    {stat.title}
                  </p>

                  <h2 className="text-3xl font-bold text-[#0B1C30]">
                    {stat.value}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= DIAGRAM POHON KINERJA + SISI KANAN ================= */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ================= DIAGRAM POHON KINERJA ================= */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm min-w-0">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30]">
                  Diagram Pohon Kinerja
                </h2>
                <p className="text-xs text-[#737780] mt-0.5">
                  Struktur cascading tahun {activeYear || "-"}
                </p>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {treeStatus === "loading" && (
                <p className="text-sm text-[#737780] text-center py-10">
                  Memuat diagram...
                </p>
              )}

              {treeStatus === "error" && (
                <p className="text-sm text-[#93000A] text-center py-10">
                  Gagal memuat diagram pohon kinerja.
                </p>
              )}

              {treeStatus === "empty" && (
                <p className="text-sm text-[#737780] text-center py-10">
                  Belum ada data pohon kinerja
                  {activeYear ? ` untuk tahun ${activeYear}` : ""}.
                </p>
              )}

              {treeStatus === "success" && tree && (
                <div ref={treeViewportRef} className="w-full overflow-x-auto">
                  {/* Kotak seukuran diagram yang sudah diskalakan: di tengah kalau
                      muat, rata kiri + bisa digeser kalau masih lebih lebar. */}
                  <div
                    className="mx-auto"
                    style={{
                      width: treeFit.width || undefined,
                      height: treeFit.height || undefined,
                    }}
                  >
                    <div
                      ref={treeContentRef}
                      className="flex w-max flex-col items-center"
                      style={{
                        transform: `scale(${treeFit.scale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {/* ROOT: Ultimate Outcome */}
                      <div className="rounded-lg border-2 border-[#001E40] bg-[#001E40] px-4 py-2.5 text-center max-w-[240px] shadow-sm">
                        <p className="text-[9px] uppercase tracking-wide text-white/70">
                          Ultimate Outcome
                        </p>
                        <p className="text-sm font-semibold text-white line-clamp-2">
                          {tree.title}
                        </p>
                      </div>

                      {tree.branches && tree.branches.length > 0 && (
                        <>
                          {/* garis turun dari root */}
                          <div className="w-px h-5 bg-[#C3C6D1]" />

                          <div className="relative flex justify-center gap-5">
                            {/* garis horizontal: dari tengah kartu pertama sampai tengah kartu terakhir */}
                            {tree.branches.length > 1 && (
                              <div className="absolute left-[80px] right-[80px] top-0 h-px bg-[#C3C6D1]" />
                            )}

                            {tree.branches.map((intermediate) => {
                              const immediateChildren = intermediate.children ?? [];
                              const totalImmediate = immediateChildren.length;
                              const totalOutput = immediateChildren.reduce(
                                (sum, immediate) =>
                                  sum + (immediate.children?.length ?? 0),
                                0
                              );

                              return (
                                <div
                                  key={intermediate.id}
                                  className="flex flex-col items-center pt-5"
                                >
                                  <div className="w-px h-5 bg-[#C3C6D1] -mt-5 mb-0" />

                                  <div className="rounded-lg border border-[#173BAB] bg-[#DDE1FF] px-3 py-2 text-center w-[160px]">
                                    <p className="text-[9px] uppercase tracking-wide text-[#173BAB]">
                                      Intermediate
                                    </p>
                                    <p className="text-xs font-medium text-[#0B1C30] line-clamp-2">
                                      {intermediate.title}
                                    </p>
                                    <p className="text-[10px] text-[#43474F] mt-1">
                                      {totalImmediate} Immediate · {totalOutput} Output
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= KOLOM KANAN: AKSI CEPAT + AKTIVITAS TERBARU ================= */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Aksi Cepat */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
              <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30] mb-4">
                Aksi Cepat
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {/* NOTE: sesuaikan href di bawah ini dengan path routing
                    beneran di project React kamu */}
                <a
                  href="/pohon-kinerja"
                  className="flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded hover:bg-[#D3E4FE] hover:border-[#001E40] transition group"
                >
                  <span className="material-symbols-outlined text-[#001E40] mb-1 group-hover:scale-110 transition">
                    account_tree
                  </span>
                  <span className="text-xs text-[#43474F] text-center">
                    Lihat Pohon Kinerja
                  </span>
                </a>

                <a
                  href="/pohon-kinerja/arsip"
                  className="flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded hover:bg-[#D3E4FE] hover:border-[#001E40] transition group"
                >
                  <span className="material-symbols-outlined text-[#001E40] mb-1 group-hover:scale-110 transition">
                    archive
                  </span>
                  <span className="text-xs text-[#43474F] text-center">
                    Lihat Arsip
                  </span>
                </a>
              </div>
            </div>

            {/* Aktivitas Terbaru */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col shadow-sm">
              <div className="p-4 border-b border-[#E2E8F0]">
                <h2 className="text-lg md:text-xl font-semibold text-[#0B1C30]">
                  Aktivitas Terbaru
                </h2>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {activitiesStatus === "loading" && (
                  <p className="text-sm text-[#737780] text-center py-4">
                    Memuat aktivitas...
                  </p>
                )}

                {activitiesStatus === "error" && (
                  <p className="text-sm text-[#93000A] text-center py-4">
                    Gagal memuat aktivitas terbaru.
                  </p>
                )}

                {activitiesStatus === "success" && activities.length === 0 && (
                  <p className="text-sm text-[#737780] text-center py-4">
                    Belum ada aktivitas
                    {activeYear ? ` untuk tahun ${activeYear}` : ""}.
                  </p>
                )}

                {activitiesStatus === "success" &&
                  activities.map((activity, index) => {
                    const meta = LEVEL_META[activity.level] ?? LEVEL_META.OUTPUT;

                    return (
                      <div
                        key={`${activity.level}-${index}`}
                        className="flex gap-3 items-start relative"
                      >
                        {index !== activities.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-[-16px] w-px bg-[#E2E8F0]" />
                        )}

                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white ${meta.bg} ${meta.color}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {meta.icon}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm text-[#0B1C30] leading-5">
                            <span className="text-xs text-[#737780]">
                              {meta.label}
                            </span>
                            <br />
                            <span className="font-medium break-words">
                              {activity.title || "(tanpa judul)"}
                            </span>
                          </p>

                          <p className="text-xs text-[#737780] mt-1">
                            {formatRelativeTime(activity.updated_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#EFF4FF] border-t border-[#C3C6D1] py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-6">
            <button className="text-sm text-[#5D5F5F] hover:underline">
              Privacy Policy
            </button>

            <button className="text-sm text-[#5D5F5F] hover:underline">
              Terms of Service
            </button>
          </div>

          <p className="text-sm font-semibold text-[#001E40]">
            © 2026 KOMINFO
          </p>
        </div>
      </footer>
    </div>
  );
}